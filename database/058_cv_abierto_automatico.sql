-- =====================================================================
-- 058 - "CV abierto": el estado que se mueve solo
--
-- El candidato en Computrabajo ve "Postulado" durante semanas sin
-- saber si alguien siquiera abrio su CV. Aqui eso se acaba, y sin
-- pedirle un clic extra al reclutador: cuando abre el CV de un
-- candidato, el sistema lo registra solo.
--
-- DECISION IMPORTANTE - abrir un CV NO cuenta como responder.
--
--   La reputacion publica de la empresa (archivos 005 y 032) cuenta
--   como "respondida" toda postulacion con current_status distinto
--   de 'applied'. Si abrir el CV cambiara el estado, cualquier
--   empresa subiria su reputacion nada mas por curiosear, sin
--   haberle resuelto nada a nadie. Eso vaciaria de sentido la
--   insignia, que es justo lo que nos diferencia.
--
--   Por eso el dato vive aparte, en applications.cv_viewed_at:
--   se le muestra al candidato como señal de vida, pero la empresa
--   sigue debiendo su respuesta.
--
-- Tampoco se manda correo: el candidato lo ve al entrar a su panel.
-- Un correo por cada CV abierto seria ruido, no informacion.
--
-- Requiere 002 y 008 (is_company_member). Segura de correr mas de
-- una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Columna nueva
--
-- Guarda la PRIMERA vez que alguien de la empresa abrio el CV. No se
-- sobreescribe: al candidato le importa desde cuando lo vieron, no
-- cuantas veces.
-- ---------------------------------------------------------------------

alter table public.applications
  add column if not exists cv_viewed_at timestamptz;


-- ---------------------------------------------------------------------
-- 2. Marcar el CV como abierto
--
-- Es "security definer" porque escribe en applications, pero valida
-- que quien llama sea de la empresa dueña de esa vacante. El
-- observador tambien puede abrir CVs, asi que los tres roles cuentan.
-- ---------------------------------------------------------------------

create or replace function public.mark_application_cv_viewed(
  p_application_id uuid
)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_visto      timestamptz;
begin

  select j.company_id, a.cv_viewed_at
    into v_company_id, v_visto
  from public.applications a
  join public.jobs j on j.id = a.job_id
  where a.id = p_application_id;

  if v_company_id is null then
    return null;
  end if;

  if not public.is_company_member(
       v_company_id, array['dueno', 'reclutador', 'observador']
     ) then
    return null;
  end if;

  -- Ya estaba marcado: se respeta la primera vez.
  if v_visto is not null then
    return v_visto;
  end if;

  update public.applications
  set cv_viewed_at = now()
  where id = p_application_id;

  return now();

end;
$$;

revoke all on function public.mark_application_cv_viewed(uuid) from public;
grant execute on function public.mark_application_cv_viewed(uuid)
  to authenticated;


-- ---------------------------------------------------------------------
-- 3. Comprobacion
--
--   select
--     count(*) filter (where cv_viewed_at is not null) as vistos,
--     count(*) as total
--   from public.applications;
-- ---------------------------------------------------------------------
