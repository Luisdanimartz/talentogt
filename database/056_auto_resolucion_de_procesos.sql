-- =====================================================================
-- 056 - Auto-resolucion: el sistema responde cuando la empresa no
--
-- Esta es la pieza que ninguna bolsa de trabajo de Guatemala tiene.
--
--   Hasta hoy, si la empresa no entra a cambiar el estado, el
--   candidato se queda en "Enviada" para siempre. Igual que en
--   Computrabajo. Con este archivo eso deja de ser posible:
--
--     1. Cuando vence el plazo que la empresa prometio (055),
--        la vacante se cierra sola.
--     2. Toda postulacion que siga en proceso en una vacante
--        CERRADA pasa a "No seleccionado" y queda marcada como
--        auto_resolved = true.
--     3. Cada cambio se inserta en application_status_history, que
--        es exactamente lo que ya dispara el correo al candidato
--        (Database Webhook -> Edge Function "notificaciones").
--        O sea: no hay que tocar nada del sistema de correos.
--
--   Resultado: nadie se queda colgado. Nunca.
--
-- Tambien limpia lo que dejaba suelto close_expired_jobs() del
-- archivo 041: esa funcion ya cerraba vacantes a los 30 dias, pero
-- dejaba a los candidatos en el limbo. Ahora quedan resueltos.
--
-- Requiere 002 (applications), 006 (application_status_history),
-- 037 (pg_cron ya habilitado) y 055. Segura de correr mas de una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. La funcion
--
-- p_limite: cuantas postulaciones resuelve por corrida. Existe para
-- no mandarle 3,000 correos de golpe a Resend. Como la tarea corre
-- cada hora, se va poniendo al dia sola.
-- ---------------------------------------------------------------------

create or replace function public.auto_resolve_expired_jobs(
  p_limite integer default 400
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resueltas integer := 0;
begin

  -- Paso 1: cerrar las vacantes cuyo plazo prometido ya vencio.
  update public.jobs
  set status = 'closed'
  where status in ('published', 'paused')
    and resolution_deadline is not null
    and resolution_deadline < current_date;

  -- Paso 2: resolver a los candidatos que sigan en proceso en
  -- CUALQUIER vacante cerrada (la acaben de cerrar o la haya
  -- cerrado la empresa a mano hace semanas).
  with pendientes as (
    select a.id
    from public.applications a
    join public.jobs j on j.id = a.job_id
    where j.status = 'closed'
      and a.current_status not in ('hired', 'rejected')
    order by a.applied_at
    limit p_limite
  ),
  actualizadas as (
    update public.applications a
    set
      current_status = 'rejected',
      auto_resolved  = true,
      updated_at     = now()
    from pendientes p
    where a.id = p.id
    returning a.id
  ),
  historial as (
    insert into public.application_status_history (application_id, status)
    select id, 'rejected' from actualizadas
    returning 1
  )
  select count(*) into v_resueltas from historial;

  return v_resueltas;

end;
$$;

revoke all on function public.auto_resolve_expired_jobs(integer) from public;


-- ---------------------------------------------------------------------
-- 2. Tarea automatica: cada hora, en el minuto 20
--
-- Se pone en el minuto 20 para no chocar con las otras dos tareas
-- que ya tienes: publish-scheduled-jobs (cada 5 min, archivo 037) y
-- close-expired-jobs (3:10 a.m., archivo 041).
-- ---------------------------------------------------------------------

create extension if not exists pg_cron;

select cron.unschedule('auto-resolve-expired-jobs')
where exists (
  select 1 from cron.job where jobname = 'auto-resolve-expired-jobs'
);

select cron.schedule(
  'auto-resolve-expired-jobs',
  '20 * * * *',
  $$select public.auto_resolve_expired_jobs(400);$$
);


-- ---------------------------------------------------------------------
-- 3. Vista para el panel de admin: quien esta por vencer
--
-- Para que puedas ver, antes de que el sistema resuelva por ellos,
-- que empresas van a quedar mal. Es tu lista de a quien llamar.
-- ---------------------------------------------------------------------

create or replace function public.admin_deadlines_proximos(
  p_dias integer default 5
)
returns table (
  company_id   uuid,
  company_name text,
  job_id       uuid,
  job_title    text,
  deadline     date,
  dias_restantes integer,
  ampliaciones integer,
  pendientes   bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin

  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  return query
  select
    c.id,
    c.company_name,
    j.id,
    j.title,
    j.resolution_deadline,
    (j.resolution_deadline - current_date)::integer,
    j.deadline_extensions,
    count(a.id) filter (
      where a.current_status not in ('hired', 'rejected')
    )
  from public.jobs j
  join public.company_profiles c on c.id = j.company_id
  left join public.applications a on a.job_id = j.id
  where j.status = 'published'
    and j.resolution_deadline is not null
    and j.resolution_deadline <= current_date + p_dias
  group by c.id, c.company_name, j.id, j.title,
           j.resolution_deadline, j.deadline_extensions
  order by j.resolution_deadline;

end;
$$;

revoke all on function public.admin_deadlines_proximos(integer) from public;
grant execute on function public.admin_deadlines_proximos(integer)
  to authenticated;


-- ---------------------------------------------------------------------
-- 4. Prueba manual antes de dormir tranquilo
--
--   -- cuantas resolveria ahora mismo (sin ejecutar):
--   select count(*)
--   from public.applications a
--   join public.jobs j on j.id = a.job_id
--   where j.status = 'closed'
--     and a.current_status not in ('hired','rejected');
--
--   -- ejecutarla a mano una vez:
--   select public.auto_resolve_expired_jobs(400);
-- ---------------------------------------------------------------------
