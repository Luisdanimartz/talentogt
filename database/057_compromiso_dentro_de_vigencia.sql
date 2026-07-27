-- =====================================================================
-- 057 - El compromiso nunca se come lo que la empresa pago
--
-- Arregla dos cosas que quedaron chocando con el tarifario cuando se
-- introdujo el compromiso de respuesta (055 y 056):
--
--   PROBLEMA 1 - Vigencia comprada vs plazo de compromiso.
--     Una publicacion vale 30 dias (close_expired_jobs, archivo 041).
--     Pero nada impedia que la empresa pusiera un compromiso a 90
--     dias -- y entonces la vacante seguia abierta mas alla de lo que
--     compro -- ni que el plazo la cerrara antes de tiempo sin
--     advertencia. Aqui se fija la regla:
--
--       El compromiso vive DENTRO de la vigencia pagada.
--       Nunca despues. Nunca antes salvo que la empresa lo pida.
--
--     Cuando una empresa necesita mas tiempo del que compro, eso no
--     es un problema: es una republicacion gratis (plan Individual)
--     o un credito nuevo. La ampliacion tiene tope a proposito.
--
--   PROBLEMA 2 - republish_job_free() dejaba la vacante rota.
--     Movia published_at a hoy pero no tocaba resolution_deadline.
--     Resultado: la vacante revivia con un plazo ya vencido y la
--     tarea automatica se la cerraba a la hora siguiente, quemandole
--     a la empresa su republicacion gratis. Ahora al republicar el
--     plazo se empuja tambien.
--
-- Requiere 041, 055 y 056. Segura de correr mas de una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Dias de vigencia de una publicacion, en UN solo lugar
--
-- Hoy son 30 dias, igual que close_expired_jobs() del archivo 041.
-- Si algun dia vendes vigencias distintas por plan, este es el unico
-- lugar que hay que cambiar.
-- ---------------------------------------------------------------------

create or replace function public.cgt_dias_vigencia()
returns integer
language sql
immutable
as $$
  select 30;
$$;


-- ---------------------------------------------------------------------
-- 2. Hasta que dia puede llegar el compromiso de una vacante
--
-- Se cuenta desde el dia en que la vacante empieza a estar visible:
-- published_at si ya se publico, o scheduled_publish_at si esta
-- programada para despues.
-- ---------------------------------------------------------------------

create or replace function public.cgt_tope_compromiso(
  p_published_at timestamptz,
  p_scheduled_at timestamptz
)
returns date
language sql
immutable
as $$
  select (
    coalesce(p_published_at, p_scheduled_at, now())::date
    + public.cgt_dias_vigencia()
  );
$$;


-- ---------------------------------------------------------------------
-- 3. Validacion actualizada
--
-- Es la misma de 055 mas el tope. Ojo con un detalle importante: el
-- tope solo se revisa cuando la fecha CAMBIA. Asi las vacantes
-- viejas que quedaron con la fecha de relleno del archivo 055 (que
-- en algunos casos pasa el tope) se pueden seguir editando sin que
-- Postgres las rechace.
-- ---------------------------------------------------------------------

create or replace function public.cgt_jobs_validar_compromiso()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_tope date;
  v_cambio_fecha boolean;
begin

  v_cambio_fecha := (
    tg_op = 'INSERT'
    or new.resolution_deadline is distinct from old.resolution_deadline
  );

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

    -- El tope: la vacante no puede comprometerse mas alla de los
    -- dias que la empresa pago.
    if v_cambio_fecha then

      v_tope := public.cgt_tope_compromiso(
        new.published_at, new.scheduled_publish_at
      );

      if new.resolution_deadline > v_tope then
        raise exception
          'Tu publicacion tiene % dias de vigencia, asi que la fecha de compromiso no puede pasar del %. Si necesitas mas tiempo, republica la vacante o usa un credito nuevo.',
          public.cgt_dias_vigencia(),
          to_char(v_tope, 'DD/MM/YYYY');
      end if;

    end if;

  end if;

  if new.original_deadline is null and new.resolution_deadline is not null then
    new.original_deadline := new.resolution_deadline;
  end if;

  if tg_op = 'UPDATE'
     and new.resolution_deadline is not null
     and old.resolution_deadline is not null
     and new.resolution_deadline > old.resolution_deadline
     and new.deadline_extensions = old.deadline_extensions then

    raise exception
      'Para mover la fecha de compromiso hacia adelante usa el boton "Ampliar plazo". Adelantarla si se puede.';

  end if;

  if tg_op = 'UPDATE'
     and v_cambio_fecha
     and new.resolution_deadline < current_date
     and new.status in ('published', 'scheduled') then

    raise exception
      'La fecha de compromiso no puede quedar en el pasado.';

  end if;

  return new;

end;
$$;

-- El trigger ya existe desde 055; solo se reemplazo la funcion.


-- ---------------------------------------------------------------------
-- 4. Ampliar plazo: ahora tambien respeta el tope
--
-- Si la empresa ya llego al final de su vigencia, el mensaje no le
-- dice "no se puede" y ya: le dice que republique. Esa es la venta.
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
  v_job             public.jobs;
  v_nueva_fecha     date;
  v_tope            date;
  max_ampliaciones  constant integer := 2;
  max_dias          constant integer := 15;
begin

  select * into v_job from public.jobs where id = p_job_id;

  if v_job.id is null then
    raise exception 'La vacante no existe.';
  end if;

  if not public.is_company_member(
       v_job.company_id, array['dueno', 'reclutador']
     ) then
    raise exception 'No tienes permiso para ampliar el plazo de esta vacante.';
  end if;

  if p_dias is null or p_dias < 1 or p_dias > max_dias then
    raise exception
      'Cada ampliacion puede ser de 1 a % dias.', max_dias;
  end if;

  if v_job.deadline_extensions >= max_ampliaciones then
    raise exception
      'Esta vacante ya se amplio % veces, que es el maximo. Resuelve el proceso con los candidatos que ya tienes.',
      max_ampliaciones;
  end if;

  v_tope := public.cgt_tope_compromiso(
    v_job.published_at, v_job.scheduled_publish_at
  );

  if coalesce(v_job.resolution_deadline, current_date) >= v_tope then
    raise exception
      'Esta publicacion ya llego al final de sus % dias de vigencia (%). Para seguir recibiendo candidatos republica la vacante o usa un credito nuevo.',
      public.cgt_dias_vigencia(),
      to_char(v_tope, 'DD/MM/YYYY');
  end if;

  v_nueva_fecha := least(
    greatest(coalesce(v_job.resolution_deadline, current_date), current_date)
      + p_dias,
    v_tope
  );

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
-- 5. republish_job_free(): al revivir la vacante, revive el plazo
--
-- Es la misma funcion del archivo 041 con dos lineas nuevas: se
-- reinicia el compromiso a la nueva vigencia y se ponen las
-- ampliaciones en cero (empieza un ciclo nuevo, es justo).
-- ---------------------------------------------------------------------

create or replace function public.republish_job_free(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.jobs;
  v_autorizado boolean;
begin

  select * into v_job from public.jobs where id = p_job_id;

  if v_job.id is null then
    raise exception 'Vacante no encontrada';
  end if;

  select exists (
    select 1 from public.company_profiles c
    where c.id = v_job.company_id and c.user_id = auth.uid()
  ) or exists (
    select 1 from public.company_members m
    where m.company_id = v_job.company_id and m.user_id = auth.uid()
  ) into v_autorizado;

  if not v_autorizado then
    raise exception 'No autorizado';
  end if;

  if v_job.free_republish_used then
    raise exception 'Esta vacante ya uso su republicacion gratis.';
  end if;

  if v_job.status <> 'published' then
    raise exception 'Solo se puede republicar una vacante que sigue publicada.';
  end if;

  if v_job.published_at > now() - interval '7 days' then
    raise exception 'La republicacion gratis solo aplica despues de 7 dias sin llenar la plaza.';
  end if;

  update public.jobs
  set
    published_at        = now(),
    free_republish_used = true,
    -- Sin esto la vacante revivia con un plazo ya vencido y la
    -- tarea automatica se la cerraba a la hora siguiente.
    resolution_deadline = current_date + public.cgt_dias_vigencia(),
    deadline_extensions = 0,
    last_extended_at    = null
  where id = p_job_id;

end;
$$;

revoke all on function public.republish_job_free(uuid) from public;
grant execute on function public.republish_job_free(uuid) to authenticated;


-- ---------------------------------------------------------------------
-- 6. Comprobacion: vacantes cuyo compromiso pasa su vigencia
--
-- Deberia salir vacio despues de correr esto. Si sale algo, son
-- vacantes viejas rellenadas por el 055 -- no hay que hacerles nada,
-- la tarea automatica las va a resolver igual.
--
--   select
--     title,
--     published_at::date as publicada,
--     resolution_deadline as compromiso,
--     public.cgt_tope_compromiso(published_at, scheduled_publish_at) as tope
--   from public.jobs
--   where status in ('published','scheduled')
--     and resolution_deadline >
--         public.cgt_tope_compromiso(published_at, scheduled_publish_at);
-- ---------------------------------------------------------------------
