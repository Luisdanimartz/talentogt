-- =====================================================================
-- 045 - Activar/desactivar una tarifa asignada, a mano o automático
--
-- 1. Columna is_active en company_pricing_assignments: para poder
--    cortar el acceso de una empresa antes de que se le venza el
--    plan (por ejemplo, si deja de pagar a medias del período).
--
-- 2. get_company_active_plan() ya ignoraba los planes vencidos por
--    fecha (eso seguía funcionando solo, sin necesidad de cron) —
--    ahora también respeta si se desactivó a mano.
--
-- 3. Tarea automática diaria que marca is_active = false en
--    cualquier asignación cuya fecha ya se cumplió, para que se vea
--    reflejado como "Inactivo" en el historial (antes solo dejaba
--    de contar por dentro, pero no se veía así en pantalla).
--
-- 4. admin_set_assignment_active(): para prender/apagar cualquier
--    fila del historial de una empresa, a mano.
--
-- Requiere 017 (tarifario), 026/027/041 (créditos). Segura de correr
-- más de una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Columna nueva
-- ---------------------------------------------------------------------

alter table public.company_pricing_assignments
  add column if not exists is_active boolean not null default true;


-- ---------------------------------------------------------------------
-- 2. get_company_active_plan(): también respeta is_active
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
  v_seat_override integer;
begin

  -- 1. ¿Tiene un plan de PAGO vigente (Reclutador)? Ese manda sobre todo.
  select cpa.*, pp.name as plan_nombre, pp.job_limit as plan_job_limit,
         pp.seat_limit as plan_seat_limit
    into v_plan_pago
  from public.company_pricing_assignments cpa
  join public.pricing_plans pp on pp.id = cpa.pricing_plan_id
  where cpa.company_id = p_company_id
    and cpa.is_active = true
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

  -- 2. Sin plan de pago: usuarios permitidos = el mas reciente que
  --    se le haya asignado a mano (Individual=1, Empresarial=3...).
  select seat_limit_override into v_seat_override
  from public.company_pricing_assignments
  where company_id = p_company_id
    and pricing_plan_id is null
    and seat_limit_override is not null
    and is_active = true
    and (expires_at is null or expires_at > now())
  order by started_at desc
  limit 1;

  select coalesce(sum(free_posts_granted), 0) into v_gratis_acumuladas
  from public.company_pricing_assignments
  where company_id = p_company_id
    and pricing_plan_id is null
    and free_posts_granted is not null
    and is_active = true
    and (expires_at is null or expires_at > now());

  if v_gratis_acumuladas > 0 then
    return query select
      'Créditos'::text,
      v_gratis_acumuladas,
      coalesce(v_seat_override, 1);
    return;
  end if;

  return query select
    'Sin plan asignado'::text,
    0,
    coalesce(v_seat_override, 1);

end;
$$;


-- ---------------------------------------------------------------------
-- 3. admin_company_pricing_history(): ahora también muestra is_active
-- ---------------------------------------------------------------------

drop function if exists public.admin_company_pricing_history(uuid);

create or replace function public.admin_company_pricing_history(p_company_id uuid)
returns table (
  id uuid,
  plan_name text,
  price numeric,
  free_posts_granted integer,
  started_at timestamptz,
  expires_at timestamptz,
  notes text,
  created_at timestamptz,
  is_active boolean
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
    a.id,
    p.name::text,
    p.price,
    a.free_posts_granted,
    a.started_at,
    a.expires_at,
    a.notes,
    a.created_at,
    a.is_active
  from public.company_pricing_assignments a
  left join public.pricing_plans p on p.id = a.pricing_plan_id
  where a.company_id = p_company_id
  order by a.created_at desc;

end;
$$;

revoke all on function public.admin_company_pricing_history(uuid) from public;
grant execute on function public.admin_company_pricing_history(uuid) to authenticated;


-- ---------------------------------------------------------------------
-- 4. admin_set_assignment_active(): prender/apagar una fila puntual
-- ---------------------------------------------------------------------

create or replace function public.admin_set_assignment_active(
  p_assignment_id uuid,
  p_active boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin

  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  update public.company_pricing_assignments
  set is_active = p_active
  where id = p_assignment_id;

end;
$$;

revoke all on function public.admin_set_assignment_active(uuid, boolean) from public;
grant execute on function public.admin_set_assignment_active(uuid, boolean) to authenticated;


-- ---------------------------------------------------------------------
-- 5. Tarea diaria: apaga solas las asignaciones ya vencidas
-- ---------------------------------------------------------------------

create or replace function public.deactivate_expired_assignments()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin

  update public.company_pricing_assignments
  set is_active = false
  where is_active = true
    and expires_at is not null
    and expires_at <= now();

end;
$$;

select cron.unschedule('deactivate-expired-assignments')
where exists (
  select 1 from cron.job where jobname = 'deactivate-expired-assignments'
);

select cron.schedule(
  'deactivate-expired-assignments',
  '20 3 * * *',
  $$select public.deactivate_expired_assignments();$$
);
