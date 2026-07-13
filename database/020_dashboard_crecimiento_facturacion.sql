-- =====================================================================
-- 020 - Dashboard grande: crecimiento, facturacion, tendencias
--
--  1. company_pricing_assignments.price_paid: el precio se "congela"
--     al momento de vender la tarifa. Si despues cambias el precio
--     de una tarifa en el catalogo, las ventas viejas NO cambian de
--     valor retroactivamente - la facturacion historica queda exacta.
--
--  2. Funciones de tendencia (dia/mes/año) para candidatos y
--     empresas registradas - mismo patron que admin_jobs_trend.
--
--  3. Funciones de facturacion: tendencia de ingresos, ingresos por
--     empresa, tarifa mas vendida, total facturado.
--
-- Requiere 013, 017. Seguro de correr mas de una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. price_paid (congelar el precio de cada venta)
-- ---------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'company_pricing_assignments'
      and column_name = 'price_paid'
  ) then
    alter table public.company_pricing_assignments
      add column price_paid numeric(10,2);
  end if;
end $$;

-- Rellenar lo que ya se vendio antes de este cambio, con el precio
-- ACTUAL del plan (es lo mas cercano que podemos saber; de aqui en
-- adelante, admin_assign_plan ya guarda el precio congelado).
update public.company_pricing_assignments a
set price_paid = p.price
from public.pricing_plans p
where a.pricing_plan_id = p.id
  and a.price_paid is null;

-- admin_assign_plan ahora congela el precio al vender
create or replace function public.admin_assign_plan(
  p_company_id uuid,
  p_pricing_plan_id uuid,
  p_notes text default null
)
returns public.company_pricing_assignments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan public.pricing_plans;
  v_row public.company_pricing_assignments;
begin

  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  select * into v_plan from public.pricing_plans where id = p_pricing_plan_id;

  if v_plan is null then
    raise exception 'Esa tarifa no existe';
  end if;

  insert into public.company_pricing_assignments
    (company_id, pricing_plan_id, price_paid, started_at, expires_at, notes, assigned_by)
  values
    (
      p_company_id,
      p_pricing_plan_id,
      v_plan.price,
      now(),
      now() + (v_plan.duration_days || ' days')::interval,
      p_notes,
      auth.uid()
    )
  returning * into v_row;

  return v_row;

end;
$$;

revoke all on function public.admin_assign_plan(uuid, uuid, text) from public;
grant execute on function public.admin_assign_plan(uuid, uuid, text) to authenticated;


-- ---------------------------------------------------------------------
-- 2. Crecimiento: candidatos y empresas registradas por periodo
-- ---------------------------------------------------------------------

create or replace function public.admin_candidates_trend(p_granularity text default 'month')
returns table (periodo text, total bigint)
language plpgsql
security definer
set search_path = public
stable
as $$
begin

  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  if p_granularity not in ('day', 'month', 'year') then
    raise exception 'Granularidad invalida: %', p_granularity;
  end if;

  return query
  select
    to_char(
      date_trunc(p_granularity, cp.created_at),
      case p_granularity
        when 'day' then 'YYYY-MM-DD'
        when 'month' then 'YYYY-MM'
        else 'YYYY'
      end
    ) as periodo,
    count(*)::bigint as total
  from public.candidate_profiles cp
  where cp.created_at >= (
    case p_granularity
      when 'day' then now() - interval '30 days'
      when 'month' then now() - interval '12 months'
      else now() - interval '6 years'
    end
  )
  group by date_trunc(p_granularity, cp.created_at)
  order by date_trunc(p_granularity, cp.created_at);

end;
$$;

revoke all on function public.admin_candidates_trend(text) from public;
grant execute on function public.admin_candidates_trend(text) to authenticated;


create or replace function public.admin_companies_trend(p_granularity text default 'month')
returns table (periodo text, total bigint)
language plpgsql
security definer
set search_path = public
stable
as $$
begin

  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  if p_granularity not in ('day', 'month', 'year') then
    raise exception 'Granularidad invalida: %', p_granularity;
  end if;

  return query
  select
    to_char(
      date_trunc(p_granularity, c.created_at),
      case p_granularity
        when 'day' then 'YYYY-MM-DD'
        when 'month' then 'YYYY-MM'
        else 'YYYY'
      end
    ) as periodo,
    count(*)::bigint as total
  from public.company_profiles c
  where c.created_at >= (
    case p_granularity
      when 'day' then now() - interval '30 days'
      when 'month' then now() - interval '12 months'
      else now() - interval '6 years'
    end
  )
  group by date_trunc(p_granularity, c.created_at)
  order by date_trunc(p_granularity, c.created_at);

end;
$$;

revoke all on function public.admin_companies_trend(text) from public;
grant execute on function public.admin_companies_trend(text) to authenticated;


-- ---------------------------------------------------------------------
-- 3. Facturacion
-- ---------------------------------------------------------------------

/* Tendencia de ingresos por periodo (solo ventas de pago, no regalos) */
create or replace function public.admin_revenue_trend(p_granularity text default 'month')
returns table (periodo text, total numeric)
language plpgsql
security definer
set search_path = public
stable
as $$
begin

  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  if p_granularity not in ('day', 'month', 'year') then
    raise exception 'Granularidad invalida: %', p_granularity;
  end if;

  return query
  select
    to_char(
      date_trunc(p_granularity, a.started_at),
      case p_granularity
        when 'day' then 'YYYY-MM-DD'
        when 'month' then 'YYYY-MM'
        else 'YYYY'
      end
    ) as periodo,
    coalesce(sum(a.price_paid), 0) as total
  from public.company_pricing_assignments a
  where a.pricing_plan_id is not null
    and a.started_at >= (
      case p_granularity
        when 'day' then now() - interval '30 days'
        when 'month' then now() - interval '12 months'
        else now() - interval '6 years'
      end
    )
  group by date_trunc(p_granularity, a.started_at)
  order by date_trunc(p_granularity, a.started_at);

end;
$$;

revoke all on function public.admin_revenue_trend(text) from public;
grant execute on function public.admin_revenue_trend(text) to authenticated;


/* Facturacion total por empresa (todo el historico) */
create or replace function public.admin_revenue_by_company()
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
  group by c.id, c.company_name
  order by sum(a.price_paid) desc;

end;
$$;

revoke all on function public.admin_revenue_by_company() from public;
grant execute on function public.admin_revenue_by_company() to authenticated;


/* Tarifa mas vendida */
create or replace function public.admin_top_selling_plans()
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
  group by p.id, p.name
  order by count(a.id) desc;

end;
$$;

revoke all on function public.admin_top_selling_plans() from public;
grant execute on function public.admin_top_selling_plans() to authenticated;


/* Total facturado + empresas que han pagado al menos una vez */
create or replace function public.admin_revenue_overview()
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
  where a.pricing_plan_id is not null;

end;
$$;

revoke all on function public.admin_revenue_overview() from public;
grant execute on function public.admin_revenue_overview() to authenticated;
