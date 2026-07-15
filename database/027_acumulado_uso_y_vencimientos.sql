-- =========================================================
-- 027_acumulado_uso_y_vencimientos.sql
--
--  1. Las publicaciones gratis ahora se ACUMULAN (si regalas
--     1 y despues 1 mas, la empresa tiene 2, no 1). Solo
--     aplica cuando la empresa no tiene un plan de pago
--     vigente; un plan de pago siempre manda sobre los
--     regalos sueltos.
--
--  2. Nueva funcion para que TU (admin) veas, de una empresa:
--     vacantes activas usadas y creditos de busqueda ya
--     gastados (contados de verdad, no solo el saldo).
--
--  3. Registrar cada vez que agregas creditos como una fila
--     mas en el historial (igual que ya pasa con tarifas y
--     publicaciones gratis), para que quede visible ahi.
--
--  4. Nueva funcion para ver que planes de pago vencen pronto,
--     y asi tu sepas a quien llamar para renovar.
--
-- Requiere el 017 (tarifario) y el 026 (limites de plan).
-- Idempotente y autocontenido.
-- =========================================================


-- ---------------------------------------------------------------------
-- 1. Publicaciones gratis acumuladas (reemplaza la logica del 026)
-- ---------------------------------------------------------------------

create or replace function public.get_company_active_plan(p_company_id uuid)
returns table (
  plan_name text,
  job_limit integer,
  seat_limit integer
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_plan_pago record;
  v_gratis_acumuladas integer;
begin

  -- 1. ¿Tiene un plan de PAGO vigente? Ese manda sobre todo.
  select cpa.*, pp.name as plan_nombre, pp.job_limit as plan_job_limit,
         pp.seat_limit as plan_seat_limit
    into v_plan_pago
  from public.company_pricing_assignments cpa
  join public.pricing_plans pp on pp.id = cpa.pricing_plan_id
  where cpa.company_id = p_company_id
    and (cpa.expires_at is null or cpa.expires_at > now())
  order by cpa.started_at desc
  limit 1;

  if v_plan_pago is not null then
    return query select
      coalesce(v_plan_pago.plan_nombre, 'Plan'),
      v_plan_pago.plan_job_limit,
      v_plan_pago.plan_seat_limit;
    return;
  end if;

  -- 2. Sin plan de pago: sumar TODAS las publicaciones gratis
  --    vigentes (acumuladas), no solo la ultima.
  select coalesce(sum(free_posts_granted), 0) into v_gratis_acumuladas
  from public.company_pricing_assignments
  where company_id = p_company_id
    and pricing_plan_id is null
    and free_posts_granted is not null
    and (expires_at is null or expires_at > now());

  if v_gratis_acumuladas > 0 then
    return query select
      'Publicaciones gratis'::text,
      v_gratis_acumuladas,
      1;
    return;
  end if;

  -- 3. Nada de nada: limite por defecto
  return query select 'Sin plan asignado'::text, 0, 1;

end;
$$;


-- ---------------------------------------------------------------------
-- 2. Uso real de una empresa (para que tu lo veas en el panel)
-- ---------------------------------------------------------------------

create or replace function public.admin_company_usage(p_company_id uuid)
returns table (
  vacantes_activas integer,
  creditos_usados integer,
  creditos_disponibles integer,
  publicaciones_gratis_acumuladas integer
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
      select count(*)::integer from public.jobs
      where company_id = p_company_id
        and status in ('published', 'paused')
    ),
    (
      select count(*)::integer from public.candidate_unlocks
      where company_id = p_company_id
    ),
    (
      select coalesce(unlock_credits, 0) from public.company_profiles
      where id = p_company_id
    ),
    (
      select coalesce(sum(free_posts_granted), 0)::integer
      from public.company_pricing_assignments
      where company_id = p_company_id
        and pricing_plan_id is null
        and free_posts_granted is not null
        and (expires_at is null or expires_at > now())
    );

end;
$$;

revoke all on function public.admin_company_usage(uuid) from public;
grant execute on function public.admin_company_usage(uuid) to authenticated;


-- ---------------------------------------------------------------------
-- 3. Registrar en el historial cada vez que agregas creditos
--    (mismo patron que tarifas y publicaciones gratis)
-- ---------------------------------------------------------------------

create or replace function public.admin_add_unlock_credits(
  p_company_id uuid,
  p_amount integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nuevo_total integer;
begin

  if not public.is_admin() then
    raise exception 'Solo un administrador puede agregar créditos.';
  end if;

  update public.company_profiles
  set unlock_credits = greatest(0, unlock_credits + p_amount)
  where id = p_company_id
  returning unlock_credits into v_nuevo_total;

  if v_nuevo_total is null then
    raise exception 'No se encontró esa empresa.';
  end if;

  -- Dejar rastro en el historial, para que se vea junto a
  -- tarifas y publicaciones gratis.
  insert into public.company_pricing_assignments
    (company_id, pricing_plan_id, free_posts_granted, started_at, expires_at, notes, assigned_by)
  values
    (
      p_company_id, null, null, now(), now(),
      p_amount || ' crédito(s) de búsqueda agregados (saldo: ' || v_nuevo_total || ')',
      auth.uid()
    );

  return v_nuevo_total;

end;
$$;


-- ---------------------------------------------------------------------
-- 4. Planes de pago que vencen pronto, para que sepas a quien
--    llamarle a renovar.
-- ---------------------------------------------------------------------

create or replace function public.admin_upcoming_plan_expirations(p_dias integer default 14)
returns table (
  company_id uuid,
  company_name text,
  plan_name text,
  expires_at timestamptz,
  dias_restantes integer
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
  select distinct on (cpa.company_id)
    cpa.company_id,
    c.company_name::text,
    pp.name::text,
    cpa.expires_at,
    greatest(0, ceil(extract(epoch from (cpa.expires_at - now())) / 86400))::integer
  from public.company_pricing_assignments cpa
  join public.company_profiles c on c.id = cpa.company_id
  join public.pricing_plans pp on pp.id = cpa.pricing_plan_id
  where cpa.expires_at is not null
    and cpa.expires_at > now()
    and cpa.expires_at <= now() + (p_dias || ' days')::interval
  order by cpa.company_id, cpa.started_at desc;

end;
$$;

revoke all on function public.admin_upcoming_plan_expirations(integer) from public;
grant execute on function public.admin_upcoming_plan_expirations(integer) to authenticated;
