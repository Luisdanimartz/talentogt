-- =====================================================================
-- 012 - Reportes con filtro de fecha (mes/año)
--
-- Agrega parametros opcionales p_desde / p_hasta a las 2 funciones
-- del 011. Si se mandan null (o no se mandan), el reporte sigue
-- mostrando TODO el historico, igual que antes - por eso es
-- retrocompatible con cualquier llamada vieja.
--
-- El filtro se aplica sobre applications.applied_at: "postulaciones
-- que llegaron durante ese mes/año", el mismo criterio con el que
-- una empresa pensaria "el reporte de julio".
--
-- Se hace DROP + CREATE (no solo "or replace") porque el numero de
-- parametros cambia; asi evitamos dejar dos versiones de la misma
-- funcion coexistiendo en Postgres.
--
-- Requiere el 011. Seguro de correr mas de una vez.
-- =====================================================================


drop function if exists public.company_hiring_funnel(uuid);
drop function if exists public.company_jobs_report(uuid);


-- ---------------------------------------------------------------------
-- 1. Embudo general de la empresa (con filtro de fecha opcional)
-- ---------------------------------------------------------------------

create or replace function public.company_hiring_funnel(
  cid uuid,
  p_desde timestamptz default null,
  p_hasta timestamptz default null
)
returns table (
  total_postulaciones bigint,
  en_revision bigint,
  en_entrevista bigint,
  contratados bigint,
  rechazados bigint,
  horas_respuesta_promedio numeric,
  dias_contratacion_promedio numeric
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin

  if not public.is_company_member(
    cid, array['dueno', 'reclutador', 'observador']
  ) then
    raise exception 'No autorizado para ver el reporte de esta empresa';
  end if;

  return query
  with etapas as (
    select
      a.id as application_id,
      a.applied_at,
      a.current_status,
      greatest(
        coalesce(max(
          case h.status
            when 'applied'   then 0
            when 'reviewing' then 1
            when 'interview' then 2
            when 'hired'     then 3
            else -1
          end
        ), -1),
        case a.current_status
          when 'applied'   then 0
          when 'reviewing' then 1
          when 'interview' then 2
          when 'hired'     then 3
          else -1
        end
      ) as etapa_maxima
    from public.applications a
    join public.jobs j on j.id = a.job_id
    left join public.application_status_history h
      on h.application_id = a.id
    where j.company_id = cid
      and (p_desde is null or a.applied_at >= p_desde)
      and (p_hasta is null or a.applied_at < p_hasta)
    group by a.id, a.applied_at, a.current_status
  ),
  primera_respuesta as (
    select
      h.application_id,
      min(h.created_at) as respondido_en
    from public.application_status_history h
    join etapas e on e.application_id = h.application_id
    where h.status <> 'applied'
    group by h.application_id
  ),
  contratacion as (
    select
      h.application_id,
      max(h.created_at) as contratado_en
    from public.application_status_history h
    join etapas e on e.application_id = h.application_id
    where h.status = 'hired'
    group by h.application_id
  )
  select
    (select count(*) from etapas)::bigint,
    (select count(*) from etapas where etapa_maxima >= 1)::bigint,
    (select count(*) from etapas where etapa_maxima >= 2)::bigint,
    (select count(*) from etapas where etapa_maxima >= 3)::bigint,
    (select count(*) from etapas where current_status = 'rejected')::bigint,
    (
      select avg(
        extract(epoch from (pr.respondido_en - e.applied_at)) / 3600.0
      )
      from primera_respuesta pr
      join etapas e on e.application_id = pr.application_id
    ),
    (
      select avg(
        extract(epoch from (c.contratado_en - e.applied_at)) / 86400.0
      )
      from contratacion c
      join etapas e on e.application_id = c.application_id
    );

end;
$$;

revoke all on function
  public.company_hiring_funnel(uuid, timestamptz, timestamptz)
  from public;

grant execute on function
  public.company_hiring_funnel(uuid, timestamptz, timestamptz)
  to authenticated;


-- ---------------------------------------------------------------------
-- 2. Reporte desglosado por vacante (con filtro de fecha opcional)
-- ---------------------------------------------------------------------

create or replace function public.company_jobs_report(
  cid uuid,
  p_desde timestamptz default null,
  p_hasta timestamptz default null
)
returns table (
  job_id uuid,
  title text,
  published_at timestamptz,
  total_postulaciones bigint,
  en_revision bigint,
  en_entrevista bigint,
  contratados bigint,
  rechazados bigint,
  dias_contratacion_promedio numeric,
  dias_abierta integer
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin

  if not public.is_company_member(
    cid, array['dueno', 'reclutador', 'observador']
  ) then
    raise exception 'No autorizado para ver el reporte de esta empresa';
  end if;

  return query
  with etapas as (
    select
      a.id as application_id,
      a.job_id,
      a.applied_at,
      a.current_status,
      greatest(
        coalesce(max(
          case h.status
            when 'applied'   then 0
            when 'reviewing' then 1
            when 'interview' then 2
            when 'hired'     then 3
            else -1
          end
        ), -1),
        case a.current_status
          when 'applied'   then 0
          when 'reviewing' then 1
          when 'interview' then 2
          when 'hired'     then 3
          else -1
        end
      ) as etapa_maxima
    from public.applications a
    join public.jobs j on j.id = a.job_id
    left join public.application_status_history h
      on h.application_id = a.id
    where j.company_id = cid
      and (p_desde is null or a.applied_at >= p_desde)
      and (p_hasta is null or a.applied_at < p_hasta)
    group by a.id, a.job_id, a.applied_at, a.current_status
  ),
  contratacion as (
    select
      h.application_id,
      max(h.created_at) as contratado_en
    from public.application_status_history h
    join etapas e on e.application_id = h.application_id
    where h.status = 'hired'
    group by h.application_id
  )
  select
    j.id,
    j.title,
    j.published_at,

    count(e.application_id)::bigint,
    count(e.application_id) filter (where e.etapa_maxima >= 1)::bigint,
    count(e.application_id) filter (where e.etapa_maxima >= 2)::bigint,
    count(e.application_id) filter (where e.etapa_maxima >= 3)::bigint,
    count(e.application_id)
      filter (where e.current_status = 'rejected')::bigint,

    avg(
      extract(epoch from (c.contratado_en - e.applied_at)) / 86400.0
    ) filter (where c.contratado_en is not null),

    case
      when j.published_at is not null
        then extract(day from (now() - j.published_at))::int
      else null
    end

  from public.jobs j
  left join etapas e on e.job_id = j.id
  left join contratacion c on c.application_id = e.application_id
  where j.company_id = cid
  group by j.id, j.title, j.published_at
  order by j.published_at desc nulls last;

end;
$$;

revoke all on function
  public.company_jobs_report(uuid, timestamptz, timestamptz)
  from public;

grant execute on function
  public.company_jobs_report(uuid, timestamptz, timestamptz)
  to authenticated;
