-- =====================================================================
-- 043 - Individual y Empresarial asignables desde "Asignar tarifa"
--
-- Ya habías visto Reclutador ahí, pero Individual/Empresarial no
-- aparecían porque funcionan distinto (créditos que se consumen, no
-- un plan con vencimiento). Esta migración los deja aparecer en el
-- mismo selector, con un clic — por dentro, cuando asignas uno de
-- estos, en vez de crear un "plan vigente" normal, carga créditos y
-- límite de usuarios de una sola vez (lo mismo que ya hacían los
-- botones de "regalar", pero ahora también desde aquí).
--
-- También limpia de una vez por todas cualquier plan viejo de
-- pruebas que no sea parte de tu estructura real (Individual,
-- Empresarial 5, Empresarial 10, Reclutador Trimestral/Semestral/
-- Anual) — se desactiva, no se borra, por el historial.
--
-- Requiere 017 (tarifario), 026/027 (limites), 041 (creditos),
-- 042 (reclutador). Segura de correr más de una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Columna nueva: marca qué planes son "paquete de créditos"
--    (Individual/Empresarial) en vez de un plan con vencimiento
--    (Reclutador).
-- ---------------------------------------------------------------------

alter table public.pricing_plans
  add column if not exists is_credit_pack boolean not null default false;


-- ---------------------------------------------------------------------
-- 2. Desactiva CUALQUIER plan que no sea parte de tu estructura
--    real de hoy — así ya no importa el nombre exacto de planes
--    viejos de prueba, con acentos o mayúsculas distintas.
-- ---------------------------------------------------------------------

update public.pricing_plans
set is_active = false
where name not in (
  'Individual',
  'Empresarial 5 créditos',
  'Empresarial 10 créditos',
  'Reclutador Trimestral',
  'Reclutador Semestral',
  'Reclutador Anual'
);


-- ---------------------------------------------------------------------
-- 3. Individual y Empresarial como paquetes de créditos
-- ---------------------------------------------------------------------

insert into public.pricing_plans
  (name, price, currency, duration_days, job_limit, is_active, seat_limit, is_credit_pack)
select 'Individual', 224.00, 'GTQ', 1, 1, true, 1, true
where not exists (select 1 from public.pricing_plans where name = 'Individual');

insert into public.pricing_plans
  (name, price, currency, duration_days, job_limit, is_active, seat_limit, is_credit_pack)
select 'Empresarial 5 créditos', 728.00, 'GTQ', 1, 5, true, 3, true
where not exists (select 1 from public.pricing_plans where name = 'Empresarial 5 créditos');

insert into public.pricing_plans
  (name, price, currency, duration_days, job_limit, is_active, seat_limit, is_credit_pack)
select 'Empresarial 10 créditos', 1344.00, 'GTQ', 1, 10, true, 3, true
where not exists (select 1 from public.pricing_plans where name = 'Empresarial 10 créditos');


-- ---------------------------------------------------------------------
-- 4. admin_assign_plan(): si el plan es un paquete de créditos,
--    carga créditos + límite de usuarios de una vez, en vez de
--    crear un plan con vencimiento. Reclutador sigue funcionando
--    exactamente igual que antes.
-- ---------------------------------------------------------------------

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

  -- Individual / Empresarial: cargar creditos + limite de usuarios,
  -- sin crear un "plan vigente" con vencimiento.
  if v_plan.is_credit_pack then

    update public.company_profiles
    set job_credits_remaining = job_credits_remaining + coalesce(v_plan.job_limit, 0)
    where id = p_company_id;

    insert into public.company_pricing_assignments
      (company_id, pricing_plan_id, free_posts_granted, seat_limit_override,
       started_at, expires_at, notes, assigned_by)
    values
      (
        p_company_id,
        null,
        coalesce(v_plan.job_limit, 0),
        v_plan.seat_limit,
        now(),
        null,
        coalesce(p_notes, format('Tarifa "%s" asignada desde el Tarifario', v_plan.name)),
        auth.uid()
      )
    returning * into v_row;

    return v_row;

  end if;

  -- Reclutador: exactamente el mismo comportamiento de siempre.
  insert into public.company_pricing_assignments
    (company_id, pricing_plan_id, started_at, expires_at, notes, assigned_by)
  values
    (
      p_company_id,
      p_pricing_plan_id,
      now(),
      now() + (v_plan.duration_days || ' days')::interval,
      p_notes,
      auth.uid()
    )
  returning * into v_row;

  return v_row;

end;
$$;
