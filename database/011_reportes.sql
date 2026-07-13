-- =====================================================================
-- 011 - Reportes de la empresa (embudo, tiempos, por vacante)
--
-- Todo numero sale de datos reales ya existentes:
--   applications, application_status_history, jobs.
-- Nada inventado, nada estimado, nada que la empresa no pueda
-- verificar viendo su propio panel de Candidatos.
--
--  1. company_hiring_funnel(cid): numeros generales de la empresa
--     - total de postulaciones
--     - cuantas llegaron a revision / entrevista / contratacion
--       (el maximo que CADA postulacion alcanzo alguna vez, aunque
--        despues haya sido rechazada - asi el embudo es honesto)
--     - rechazadas
--     - horas promedio de primera respuesta
--     - dias promedio para contratar
--
--  2. company_jobs_report(cid): lo mismo pero desglosado por vacante,
--     mas los dias que lleva abierta cada una.
--
-- Seguridad: ambas funciones verifican que quien llama sea parte
-- del equipo de esa empresa (is_company_member). Sin eso, cualquier
-- usuario autenticado podria pedir el reporte de OTRA empresa con
-- solo cambiar el id - por eso van "language plpgsql" con el chequeo
-- adentro, no "language sql" como las funciones publicas anteriores.
--
-- Requiere el 008 (usa is_company_member). Seguro de correr mas de
-- una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Embudo general de la empresa
-- ---------------------------------------------------------------------

create or replace function public.company_hiring_funnel(cid uuid)
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
    group by a.id, a.applied_at, a.current_status
  ),
  primera_respuesta as (
    select
      h.application_id,
      min(h.created_at) as respondido_en
    from public.application_status_history h
    join public.applications a on a.id = h.application_id
    join public.jobs j on j.id = a.job_id
    where j.company_id = cid
      and h.status <> 'applied'
    group by h.application_id
  ),
  contratacion as (
    select
      h.application_id,
      max(h.created_at) as contratado_en
    from public.application_status_history h
    join public.applications a on a.id = h.application_id
    join public.jobs j on j.id = a.job_id
    where j.company_id = cid
      and h.status = 'hired'
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

revoke all on function public.company_hiring_funnel(uuid) from public;
grant execute on function public.company_hiring_funnel(uuid) to authenticated;


-- ---------------------------------------------------------------------
-- 2. Reporte desglosado por vacante
-- ---------------------------------------------------------------------

create or replace function public.company_jobs_report(cid uuid)
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
    group by a.id, a.job_id, a.applied_at, a.current_status
  ),
  contratacion as (
    select
      h.application_id,
      max(h.created_at) as contratado_en
    from public.application_status_history h
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

revoke all on function public.company_jobs_report(uuid) from public;
grant execute on function public.company_jobs_report(uuid) to authenticated;
