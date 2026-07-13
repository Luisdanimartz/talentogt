-- =====================================================================
-- 022 - Filtro de rango personalizado en KPIs generales y Crecimiento
--
-- El rango exacto (ej. 1 al 15 de julio) que ya funcionaba en
-- Facturacion ahora tambien aplica a:
--   - admin_overview(): candidatos/empresas/vacantes/postulaciones
--     registrados DENTRO del rango, y tiempo de respuesta de esas
--     postulaciones.
--   - admin_jobs_trend / admin_candidates_trend / admin_companies_trend:
--     agrupan por dia si se manda un rango personalizado.
--
-- OJO: empresas_vip, empresas_suspendidas y candidatos_suspendidos
-- son ESTADO ACTUAL (no historico) - no se puede saber "cuantas
-- empresas eran VIP el 1 de julio" sin guardar ese historial, asi
-- que esos 3 numeros siempre muestran el presente, con o sin
-- filtro. Se explica esto en el frontend para que no confunda.
--
-- Requiere 013, 016. Seguro de correr mas de una vez.
-- =====================================================================


drop function if exists public.admin_overview();
drop function if exists public.admin_jobs_trend(text);
drop function if exists public.admin_candidates_trend(text);
drop function if exists public.admin_companies_trend(text);


-- ---------------------------------------------------------------------
-- 1. admin_overview con rango opcional
-- ---------------------------------------------------------------------

create or replace function public.admin_overview(
  p_desde timestamptz default null,
  p_hasta timestamptz default null
)
returns table (
  total_candidatos bigint,
  total_empresas bigint,
  total_vacantes_publicadas bigint,
  total_postulaciones bigint,
  empresas_vip bigint,
  empresas_suspendidas bigint,
  candidatos_suspendidos bigint,
  horas_respuesta_promedio numeric
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
    (
      select count(*) from public.candidate_profiles cp
      where (p_desde is null or cp.created_at >= p_desde)
        and (p_hasta is null or cp.created_at < p_hasta)
    ),
    (
      select count(*) from public.company_profiles c
      where (p_desde is null or c.created_at >= p_desde)
        and (p_hasta is null or c.created_at < p_hasta)
    ),
    (
      select count(*) from public.jobs j
      where j.status = 'published'
        and (p_desde is null or j.published_at >= p_desde)
        and (p_hasta is null or j.published_at < p_hasta)
    ),
    (
      select count(*) from public.applications a
      where (p_desde is null or a.applied_at >= p_desde)
        and (p_hasta is null or a.applied_at < p_hasta)
    ),
    -- Estado ACTUAL, no se filtra por fecha (no hay historico)
    (select count(*) from public.company_profiles where plan = 'vip'),
    (select count(*) from public.company_profiles where status = 'suspendida'),
    (select count(*) from public.candidate_profiles where status = 'suspendida'),
    (
      select avg(
        extract(epoch from (pr.respondido_en - a.applied_at)) / 3600.0
      )
      from public.applications a
      join (
        select h.application_id, min(h.created_at) as respondido_en
        from public.application_status_history h
        where h.status <> 'applied'
        group by h.application_id
      ) pr on pr.application_id = a.id
      where (p_desde is null or a.applied_at >= p_desde)
        and (p_hasta is null or a.applied_at < p_hasta)
    );

end;
$$;

revoke all on function
  public.admin_overview(timestamptz, timestamptz) from public;
grant execute on function
  public.admin_overview(timestamptz, timestamptz) to authenticated;


-- ---------------------------------------------------------------------
-- 2. Tendencias de Crecimiento con rango opcional
-- ---------------------------------------------------------------------

create or replace function public.admin_jobs_trend(
  p_granularity text default 'month',
  p_desde timestamptz default null,
  p_hasta timestamptz default null
)
returns table (periodo text, total bigint)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_agrupa_por text;
begin

  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  if p_granularity not in ('day', 'month', 'year') then
    raise exception 'Granularidad invalida: %', p_granularity;
  end if;

  v_agrupa_por := case when p_desde is not null then 'day' else p_granularity end;

  return query
  select
    to_char(
      date_trunc(v_agrupa_por, j.published_at),
      case v_agrupa_por
        when 'day' then 'YYYY-MM-DD' when 'month' then 'YYYY-MM' else 'YYYY'
      end
    ) as periodo,
    count(*)::bigint as total
  from public.jobs j
  where j.published_at is not null
    and (
      (p_desde is not null and j.published_at >= p_desde and j.published_at < coalesce(p_hasta, now() + interval '1 day'))
      or
      (p_desde is null and j.published_at >= (
        case p_granularity
          when 'day' then now() - interval '30 days'
          when 'month' then now() - interval '12 months'
          else now() - interval '6 years'
        end
      ))
    )
  group by date_trunc(v_agrupa_por, j.published_at)
  order by date_trunc(v_agrupa_por, j.published_at);

end;
$$;

revoke all on function
  public.admin_jobs_trend(text, timestamptz, timestamptz) from public;
grant execute on function
  public.admin_jobs_trend(text, timestamptz, timestamptz) to authenticated;


create or replace function public.admin_candidates_trend(
  p_granularity text default 'month',
  p_desde timestamptz default null,
  p_hasta timestamptz default null
)
returns table (periodo text, total bigint)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_agrupa_por text;
begin

  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  if p_granularity not in ('day', 'month', 'year') then
    raise exception 'Granularidad invalida: %', p_granularity;
  end if;

  v_agrupa_por := case when p_desde is not null then 'day' else p_granularity end;

  return query
  select
    to_char(
      date_trunc(v_agrupa_por, cp.created_at),
      case v_agrupa_por
        when 'day' then 'YYYY-MM-DD' when 'month' then 'YYYY-MM' else 'YYYY'
      end
    ) as periodo,
    count(*)::bigint as total
  from public.candidate_profiles cp
  where (
      (p_desde is not null and cp.created_at >= p_desde and cp.created_at < coalesce(p_hasta, now() + interval '1 day'))
      or
      (p_desde is null and cp.created_at >= (
        case p_granularity
          when 'day' then now() - interval '30 days'
          when 'month' then now() - interval '12 months'
          else now() - interval '6 years'
        end
      ))
    )
  group by date_trunc(v_agrupa_por, cp.created_at)
  order by date_trunc(v_agrupa_por, cp.created_at);

end;
$$;

revoke all on function
  public.admin_candidates_trend(text, timestamptz, timestamptz) from public;
grant execute on function
  public.admin_candidates_trend(text, timestamptz, timestamptz) to authenticated;


create or replace function public.admin_companies_trend(
  p_granularity text default 'month',
  p_desde timestamptz default null,
  p_hasta timestamptz default null
)
returns table (periodo text, total bigint)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_agrupa_por text;
begin

  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  if p_granularity not in ('day', 'month', 'year') then
    raise exception 'Granularidad invalida: %', p_granularity;
  end if;

  v_agrupa_por := case when p_desde is not null then 'day' else p_granularity end;

  return query
  select
    to_char(
      date_trunc(v_agrupa_por, c.created_at),
      case v_agrupa_por
        when 'day' then 'YYYY-MM-DD' when 'month' then 'YYYY-MM' else 'YYYY'
      end
    ) as periodo,
    count(*)::bigint as total
  from public.company_profiles c
  where (
      (p_desde is not null and c.created_at >= p_desde and c.created_at < coalesce(p_hasta, now() + interval '1 day'))
      or
      (p_desde is null and c.created_at >= (
        case p_granularity
          when 'day' then now() - interval '30 days'
          when 'month' then now() - interval '12 months'
          else now() - interval '6 years'
        end
      ))
    )
  group by date_trunc(v_agrupa_por, c.created_at)
  order by date_trunc(v_agrupa_por, c.created_at);

end;
$$;

revoke all on function
  public.admin_companies_trend(text, timestamptz, timestamptz) from public;
grant execute on function
  public.admin_companies_trend(text, timestamptz, timestamptz) to authenticated;
