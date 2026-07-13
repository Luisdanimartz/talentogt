-- =====================================================================
-- 021 - Facturacion con rango de fechas personalizado
--
-- Antes solo se podia ver "ultimos 30 dias / 12 meses / por año".
-- Ahora se puede pedir un rango exacto (ej. 1 al 15 de julio 2026)
-- pasando p_desde/p_hasta. Si no se manda nada, sigue funcionando
-- igual que antes (retrocompatible).
--
-- Requiere 020. Seguro de correr mas de una vez.
-- =====================================================================


drop function if exists public.admin_revenue_trend(text);
drop function if exists public.admin_revenue_by_company();
drop function if exists public.admin_top_selling_plans();
drop function if exists public.admin_revenue_overview();


-- ---------------------------------------------------------------------
-- 1. Tendencia de ingresos (agrupa por dia dentro del rango si se
--    manda un rango personalizado; si no, usa la granularidad de
--    siempre con su ventana fija)
-- ---------------------------------------------------------------------

create or replace function public.admin_revenue_trend(
  p_granularity text default 'month',
  p_desde timestamptz default null,
  p_hasta timestamptz default null
)
returns table (periodo text, total numeric)
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

  -- Con rango personalizado, siempre se agrupa por dia (tiene mas
  -- sentido para un rango corto tipo "del 1 al 15")
  v_agrupa_por := case when p_desde is not null then 'day' else p_granularity end;

  return query
  select
    to_char(
      date_trunc(v_agrupa_por, a.started_at),
      case v_agrupa_por
        when 'day' then 'YYYY-MM-DD'
        when 'month' then 'YYYY-MM'
        else 'YYYY'
      end
    ) as periodo,
    coalesce(sum(a.price_paid), 0) as total
  from public.company_pricing_assignments a
  where a.pricing_plan_id is not null
    and (
      (p_desde is not null and a.started_at >= p_desde and a.started_at < coalesce(p_hasta, now() + interval '1 day'))
      or
      (p_desde is null and a.started_at >= (
        case p_granularity
          when 'day' then now() - interval '30 days'
          when 'month' then now() - interval '12 months'
          else now() - interval '6 years'
        end
      ))
    )
  group by date_trunc(v_agrupa_por, a.started_at)
  order by date_trunc(v_agrupa_por, a.started_at);

end;
$$;

revoke all on function
  public.admin_revenue_trend(text, timestamptz, timestamptz) from public;
grant execute on function
  public.admin_revenue_trend(text, timestamptz, timestamptz) to authenticated;


-- ---------------------------------------------------------------------
-- 2. Facturacion por empresa (con rango opcional)
-- ---------------------------------------------------------------------

create or replace function public.admin_revenue_by_company(
  p_desde timestamptz default null,
  p_hasta timestamptz default null
)
returns table (
  company_name text,
  total_facturado numeric,
  compras integer,
  ultima_compra timestamptz
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
    c.company_name::text,
    coalesce(sum(a.price_paid), 0),
    count(a.id)::integer,
    max(a.started_at)
  from public.company_profiles c
  join public.company_pricing_assignments a on a.company_id = c.id
  where a.pricing_plan_id is not null
    and (p_desde is null or a.started_at >= p_desde)
    and (p_hasta is null or a.started_at < p_hasta)
  group by c.id, c.company_name
  order by sum(a.price_paid) desc;

end;
$$;

revoke all on function
  public.admin_revenue_by_company(timestamptz, timestamptz) from public;
grant execute on function
  public.admin_revenue_by_company(timestamptz, timestamptz) to authenticated;


-- ---------------------------------------------------------------------
-- 3. Tarifa mas vendida (con rango opcional)
-- ---------------------------------------------------------------------

create or replace function public.admin_top_selling_plans(
  p_desde timestamptz default null,
  p_hasta timestamptz default null
)
returns table (
  plan_name text,
  veces_vendida bigint,
  total_facturado numeric
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
    p.name::text,
    count(a.id)::bigint,
    coalesce(sum(a.price_paid), 0)
  from public.pricing_plans p
  join public.company_pricing_assignments a on a.pricing_plan_id = p.id
  where (p_desde is null or a.started_at >= p_desde)
    and (p_hasta is null or a.started_at < p_hasta)
  group by p.id, p.name
  order by count(a.id) desc;

end;
$$;

revoke all on function
  public.admin_top_selling_plans(timestamptz, timestamptz) from public;
grant execute on function
  public.admin_top_selling_plans(timestamptz, timestamptz) to authenticated;


-- ---------------------------------------------------------------------
-- 4. Total facturado + empresas facturando (con rango opcional)
-- ---------------------------------------------------------------------

create or replace function public.admin_revenue_overview(
  p_desde timestamptz default null,
  p_hasta timestamptz default null
)
returns table (
  total_facturado numeric,
  empresas_facturando bigint,
  total_ventas bigint
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
    coalesce(sum(a.price_paid), 0),
    count(distinct a.company_id)::bigint,
    count(a.id)::bigint
  from public.company_pricing_assignments a
  where a.pricing_plan_id is not null
    and (p_desde is null or a.started_at >= p_desde)
    and (p_hasta is null or a.started_at < p_hasta);

end;
$$;

revoke all on function
  public.admin_revenue_overview(timestamptz, timestamptz) from public;
grant execute on function
  public.admin_revenue_overview(timestamptz, timestamptz) to authenticated;
