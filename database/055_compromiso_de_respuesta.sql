-- =====================================================================
-- 055 - Compromiso de respuesta y salario obligatorio
--
-- El problema que resuelve:
--
--   Hoy (igual que en Computrabajo) el candidato se postula y queda
--   a ciegas: no sabe cuanto paga la plaza ni cuando le van a
--   responder. Y el reclutador tampoco tiene una fecha que lo
--   obligue, asi que la vacante se queda abierta para siempre.
--
--   A partir de aqui, para publicar en ChanceGT hay que declarar
--   DOS cosas, una sola vez, al momento de publicar:
--
--     1. El salario (salary_min > 0). Sin salario no se publica.
--     2. La fecha en que la empresa se compromete a resolver
--        (resolution_deadline).
--
--   Son 5 segundos del reclutador que le sirven a los 200
--   candidatos que se postulen. Nadie tiene que acordarse de nada
--   despues: el archivo 056 se encarga de cerrar solo.
--
-- El plazo se puede AMPLIAR, pero no a escondidas: solo con la
-- funcion extend_job_deadline(), maximo 2 veces y maximo 15 dias
-- cada vez, y queda contado en deadline_extensions para que el
-- candidato vea que la empresa ya lo movio.
--
-- Requiere 008 (is_company_member). Segura de correr mas de una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Columnas nuevas
-- ---------------------------------------------------------------------

alter table public.jobs
  add column if not exists resolution_deadline date;

alter table public.jobs
  add column if not exists original_deadline date;

alter table public.jobs
  add column if not exists deadline_extensions integer not null default 0;

alter table public.jobs
  add column if not exists last_extended_at timestamptz;

-- Marca si la postulacion la resolvio el SISTEMA (por vencimiento
-- del plazo) y no una persona. Sirve para escribirle al candidato
-- un mensaje honesto en vez de fingir que alguien la reviso.
alter table public.applications
  add column if not exists auto_resolved boolean not null default false;

create index if not exists jobs_resolution_deadline_idx
  on public.jobs(resolution_deadline)
  where resolution_deadline is not null;


-- ---------------------------------------------------------------------
-- 2. Relleno de las vacantes que YA existen
--
-- OJO — esto es importante: si a una vacante vieja le ponemos una
-- fecha ya vencida, la tarea automatica del archivo 056 cerraria
-- de golpe cientos de postulaciones esta misma noche y saldrian
-- cientos de correos de un solo. Por eso a toda vacante existente
-- se le da un piso de 7 dias a partir de hoy: te da tiempo de
-- avisarle a las empresas antes de que el sistema empiece a
-- resolver por ellas.
-- ---------------------------------------------------------------------

update public.jobs
set resolution_deadline = greatest(
      coalesce(published_at::date, created_at::date, current_date) + 30,
      current_date + 7
    )
where resolution_deadline is null
  and status in ('published', 'scheduled', 'paused');

-- Las cerradas y los borradores no necesitan compromiso.
update public.jobs
set original_deadline = resolution_deadline
where original_deadline is null
  and resolution_deadline is not null;


-- ---------------------------------------------------------------------
-- 3. Validacion: no se publica sin salario ni sin fecha
--
-- Se hace con trigger y no con "not null" porque los borradores
-- (draft) y las cerradas si pueden vivir sin fecha, y porque asi
-- el mensaje de error le llega al reclutador en español.
-- ---------------------------------------------------------------------

create or replace function public.cgt_jobs_validar_compromiso()
returns trigger
language plpgsql
set search_path = public
as $$
begin

  if new.status in ('published', 'scheduled') then

    if new.salary_min is null or new.salary_min <= 0 then
      raise exception
        'En ChanceGT toda vacante publicada debe indicar el salario. Agrega el salario mensual antes de publicar.';
    end if;

    if new.resolution_deadline is null then
      raise exception
        'Debes indicar la fecha en la que te comprometes a resolver este proceso.';
    end if;

    if tg_op = 'INSERT' and new.resolution_deadline < current_date then
      raise exception
        'La fecha de compromiso no puede estar en el pasado.';
    end if;

  end if;

  -- La primera fecha prometida queda guardada para siempre: es la
  -- que se le muestra al candidato junto a las ampliaciones.
  if new.original_deadline is null and new.resolution_deadline is not null then
    new.original_deadline := new.resolution_deadline;
  end if;

  -- Ampliar el plazo NO se puede hacer editando el campo a mano:
  -- tiene que pasar por extend_job_deadline(), que es la que lleva
  -- la cuenta. Si no, el contador de ampliaciones no valdria nada
  -- y el candidato no se enteraria de que le movieron la fecha.
  if tg_op = 'UPDATE'
     and new.resolution_deadline is not null
     and old.resolution_deadline is not null
     and new.resolution_deadline > old.resolution_deadline
     and new.deadline_extensions = old.deadline_extensions then

    raise exception
      'Para mover la fecha de compromiso hacia adelante usa el boton "Ampliar plazo". Adelantarla si se puede.';

  end if;

  if tg_op = 'UPDATE'
     and new.resolution_deadline is distinct from old.resolution_deadline
     and new.resolution_deadline < current_date
     and new.status in ('published', 'scheduled') then

    raise exception
      'La fecha de compromiso no puede quedar en el pasado.';

  end if;

  return new;

end;
$$;

drop trigger if exists cgt_jobs_compromiso on public.jobs;

create trigger cgt_jobs_compromiso
  before insert or update on public.jobs
  for each row
  execute function public.cgt_jobs_validar_compromiso();


-- ---------------------------------------------------------------------
-- 4. Ampliar el plazo (unica puerta de entrada)
--
--   - Solo dueño o reclutador de esa empresa.
--   - Maximo 2 ampliaciones por vacante.
--   - Maximo 15 dias por ampliacion.
--   - Queda contado y con fecha, y eso se le muestra al candidato.
-- ---------------------------------------------------------------------

create or replace function public.extend_job_deadline(
  p_job_id uuid,
  p_dias integer
)
returns date
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id      uuid;
  v_deadline        date;
  v_extensions      integer;
  v_nueva_fecha     date;
  max_ampliaciones  constant integer := 2;
  max_dias          constant integer := 15;
begin

  select company_id, resolution_deadline, deadline_extensions
    into v_company_id, v_deadline, v_extensions
  from public.jobs
  where id = p_job_id;

  if v_company_id is null then
    raise exception 'La vacante no existe.';
  end if;

  if not public.is_company_member(
       v_company_id, array['dueno', 'reclutador']
     ) then
    raise exception 'No tienes permiso para ampliar el plazo de esta vacante.';
  end if;

  if p_dias is null or p_dias < 1 or p_dias > max_dias then
    raise exception
      'Cada ampliacion puede ser de 1 a % dias.', max_dias;
  end if;

  if v_extensions >= max_ampliaciones then
    raise exception
      'Esta vacante ya se amplio % veces, que es el maximo. Resuelve el proceso con los candidatos que ya tienes.',
      max_ampliaciones;
  end if;

  v_nueva_fecha := greatest(
    coalesce(v_deadline, current_date), current_date
  ) + p_dias;

  update public.jobs
  set
    resolution_deadline = v_nueva_fecha,
    deadline_extensions = deadline_extensions + 1,
    last_extended_at    = now()
  where id = p_job_id;

  return v_nueva_fecha;

end;
$$;

revoke all on function public.extend_job_deadline(uuid, integer) from public;
grant execute on function public.extend_job_deadline(uuid, integer)
  to authenticated;


-- ---------------------------------------------------------------------
-- 5. Comprobacion rapida (opcional, para correr a mano)
--
--   select title, resolution_deadline, deadline_extensions
--   from public.jobs
--   where status = 'published'
--   order by resolution_deadline;
-- ---------------------------------------------------------------------
