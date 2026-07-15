-- =====================================================================
-- 032 - Visibilidad de respuesta: admin + candidato
--
-- Dos cosas en un solo archivo porque van de la mano (mismo criterio
-- de "responder" que 005_reputacion_de_respuesta.sql: cualquier
-- estado distinto de 'applied' cuenta como respuesta):
--
--   1. admin_pending_responses(): para el ADMIN. Por empresa y
--      vacante, cuantos candidatos siguen sin respuesta y desde hace
--      cuantos dias. Para encontrar quien esta bajando el % general.
--
--   2. company_response_stats(cid): se le agrega avg_response_days,
--      el promedio de dias que tarda esa empresa en dar el PRIMER
--      cambio de estado a un candidato. Esto se muestra en el badge
--      publico de la vacante (CompanyResponseBadge.jsx), para que el
--      candidato sepa que esperar ANTES de postularse.
--
-- Requiere 005 (company_response_stats), 006 (application_status_
-- history), 013 (is_admin) y 014 (esquema admin). Seguro de correr
-- mas de una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. admin_pending_responses()
-- ---------------------------------------------------------------------

create or replace function public.admin_pending_responses()
returns table (
  company_id uuid,
  company_name text,
  job_id uuid,
  job_title text,
  total_postulaciones bigint,
  pendientes bigint,
  pct_respuesta numeric,
  dias_pendiente_mas_antiguo integer
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
    count(a.id) as total,
    count(a.id) filter (where a.current_status = 'applied') as pendientes,
    case
      when count(a.id) = 0 then 0
      else round(
        100.0 * count(a.id) filter (where a.current_status is distinct from 'applied')
        / count(a.id),
        0
      )
    end as pct_respuesta,
    coalesce(
      extract(
        day from now() - min(a.applied_at) filter (where a.current_status = 'applied')
      )::integer,
      0
    ) as dias_pendiente_mas_antiguo
  from public.jobs j
  join public.company_profiles c on c.id = j.company_id
  left join public.applications a on a.job_id = j.id
  group by c.id, c.company_name, j.id, j.title
  having count(a.id) > 0
  order by
    count(a.id) filter (where a.current_status = 'applied') desc,
    dias_pendiente_mas_antiguo desc;

end;
$$;

revoke all on function public.admin_pending_responses() from public;
grant execute on function public.admin_pending_responses() to authenticated;


-- ---------------------------------------------------------------------
-- 2. company_response_stats(): se agrega avg_response_days.
--
--    "Primera respuesta" = la fecha del primer registro en
--    application_status_history con un status distinto de 'applied'
--    para esa postulacion. Se compara contra applications.applied_at.
-- ---------------------------------------------------------------------

create or replace function public.company_response_stats(cid uuid)
returns table (total bigint, responded bigint, avg_response_days numeric)
language sql
security definer
set search_path = public
stable
as $$
  with primera_respuesta as (
    select
      h.application_id,
      min(h.created_at) as respondido_en
    from public.application_status_history h
    where h.status <> 'applied'
    group by h.application_id
  )
  select
    count(*) as total,
    count(*) filter (where a.current_status is distinct from 'applied')
      as responded,
    round(
      (
        avg(
          extract(epoch from (pr.respondido_en - a.applied_at)) / 86400.0
        ) filter (where pr.respondido_en is not null)
      )::numeric,
      1
    ) as avg_response_days
  from public.applications a
  join public.jobs j on j.id = a.job_id
  left join primera_respuesta pr on pr.application_id = a.id
  where j.company_id = cid;
$$;

grant execute on function public.company_response_stats(uuid)
  to anon, authenticated;
