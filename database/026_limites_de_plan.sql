-- =========================================================
-- 026_limites_de_plan.sql
--
-- Hasta ahora, cualquier empresa podia publicar vacantes
-- ilimitadas e invitar usuarios ilimitados sin importar si
-- tenia un plan asignado. Con el tarifario ya definido, esta
-- migracion hace cumplir esos limites:
--
--  - Vacantes: se cuentan las que estan "ocupando cupo"
--    (published o paused). Si la empresa ya tiene mas de las
--    permitidas por su plan (por ejemplo, las de antes de
--    tener un plan asignado), NO se le quitan ni se bloquean,
--    solo no puede publicar/reactivar NINGUNA MAS hasta que
--    baje de ese numero o su plan le de mas cupo.
--
--  - Usuarios de equipo: mismo criterio, contando invitados +
--    activos (una invitacion pendiente ya reserva el cupo).
--
--  - Empresa SIN ningun plan asignado (o con plan vencido):
--    limite por defecto = 0 vacantes nuevas, 1 usuario (el
--    dueno). Debe pedirte un plan para poder publicar o
--    invitar a alguien.
--
-- Requiere el 008 (company_members, is_company_member) y el
-- 017 (pricing_plans, company_pricing_assignments).
-- Idempotente y autocontenido.
-- =========================================================


-- ---------------------------------------------------------------------
-- 1. Limite de usuarios por tarifa (null = ilimitado)
-- ---------------------------------------------------------------------

alter table public.pricing_plans
  add column if not exists seat_limit integer;


-- ---------------------------------------------------------------------
-- 2. Plan vigente de una empresa: la asignacion mas reciente
--    que no haya vencido. Si no tiene ninguna, limite por
--    defecto (0 vacantes nuevas, 1 usuario).
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
  v_asignacion record;
begin

  select cpa.*, pp.name as plan_nombre, pp.job_limit as plan_job_limit,
         pp.seat_limit as plan_seat_limit
    into v_asignacion
  from public.company_pricing_assignments cpa
  left join public.pricing_plans pp on pp.id = cpa.pricing_plan_id
  where cpa.company_id = p_company_id
    and (cpa.expires_at is null or cpa.expires_at > now())
  order by cpa.started_at desc
  limit 1;

  if v_asignacion is null then
    -- Sin ninguna asignacion vigente: limite por defecto
    return query select 'Sin plan asignado'::text, 0, 1;
    return;
  end if;

  if v_asignacion.pricing_plan_id is not null then
    -- Tiene un plan de pago (o gratuito) asignado
    return query select
      coalesce(v_asignacion.plan_nombre, 'Plan'),
      v_asignacion.plan_job_limit,
      v_asignacion.plan_seat_limit;
    return;
  end if;

  -- Solo tiene publicaciones gratis regaladas (sin plan)
  return query select
    'Publicaciones gratis'::text,
    v_asignacion.free_posts_granted,
    1;

end;
$$;

revoke all on function public.get_company_active_plan(uuid) from public;
grant execute on function public.get_company_active_plan(uuid) to authenticated;


-- ---------------------------------------------------------------------
-- 3. Limite de vacantes: al crear una vacante, o al cambiar su
--    estado a published/paused (ej. reactivar), se cuenta
--    cuantas vacantes de esa empresa ya "ocupan cupo" y se
--    compara contra el limite de su plan vigente.
-- ---------------------------------------------------------------------

create or replace function public.cgt_check_job_limit()
returns trigger
language plpgsql
as $$
declare
  v_limite integer;
  v_actuales integer;
begin

  -- Solo nos interesa cuando la fila QUEDA en un estado que
  -- ocupa cupo. Si no, no hay nada que revisar.
  if new.status not in ('published', 'paused') then
    return new;
  end if;

  -- En un UPDATE, si ya estaba ocupando cupo y sigue igual,
  -- no es una vacante nueva ocupando espacio - dejar pasar.
  if TG_OP = 'UPDATE' and old.status in ('published', 'paused') then
    return new;
  end if;

  select job_limit into v_limite
  from public.get_company_active_plan(new.company_id);

  -- null = ilimitado
  if v_limite is null then
    return new;
  end if;

  select count(*) into v_actuales
  from public.jobs
  where company_id = new.company_id
    and status in ('published', 'paused')
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if v_actuales >= v_limite then
    raise exception
      'Tu plan actual permite hasta % vacante(s) activa(s). Ya alcanzaste ese límite — contacta a ChanceGT para ampliar tu plan.',
      v_limite;
  end if;

  return new;

end;
$$;

drop trigger if exists cgt_enforce_job_limit on public.jobs;

create trigger cgt_enforce_job_limit
  before insert or update on public.jobs
  for each row execute function public.cgt_check_job_limit();


-- ---------------------------------------------------------------------
-- 4. Limite de usuarios de equipo: al invitar a alguien
--    (insertar en company_members), se cuenta cuantos
--    miembros (invitados + activos) ya tiene la empresa.
-- ---------------------------------------------------------------------

create or replace function public.cgt_check_seat_limit()
returns trigger
language plpgsql
as $$
declare
  v_limite integer;
  v_actuales integer;
begin

  select seat_limit into v_limite
  from public.get_company_active_plan(new.company_id);

  -- null = ilimitado
  if v_limite is null then
    return new;
  end if;

  select count(*) into v_actuales
  from public.company_members
  where company_id = new.company_id;

  if v_actuales >= v_limite then
    raise exception
      'Tu plan actual permite hasta % usuario(s) de equipo. Ya alcanzaste ese límite — contacta a ChanceGT para ampliar tu plan.',
      v_limite;
  end if;

  return new;

end;
$$;

drop trigger if exists cgt_enforce_seat_limit on public.company_members;

create trigger cgt_enforce_seat_limit
  before insert on public.company_members
  for each row execute function public.cgt_check_seat_limit();


-- ---------------------------------------------------------------------
-- 6. Agregar el parametro de limite de usuarios a la funcion
--    que el admin ya usa para crear/editar tarifas
-- ---------------------------------------------------------------------

drop function if exists public.admin_save_pricing_plan(uuid, text, numeric, integer, integer, boolean);

create or replace function public.admin_save_pricing_plan(
  p_id uuid,
  p_name text,
  p_price numeric,
  p_duration_days integer,
  p_job_limit integer,
  p_is_active boolean,
  p_seat_limit integer default null
)
returns public.pricing_plans
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.pricing_plans;
begin

  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  if p_id is null then
    insert into public.pricing_plans
      (name, price, duration_days, job_limit, is_active, seat_limit)
    values
      (p_name, p_price, p_duration_days, p_job_limit, coalesce(p_is_active, true), p_seat_limit)
    returning * into v_row;
  else
    update public.pricing_plans
    set
      name = p_name,
      price = p_price,
      duration_days = p_duration_days,
      job_limit = p_job_limit,
      is_active = coalesce(p_is_active, is_active),
      seat_limit = p_seat_limit
    where id = p_id
    returning * into v_row;
  end if;

  return v_row;

end;
$$;

revoke all on function
  public.admin_save_pricing_plan(uuid, text, numeric, integer, integer, boolean, integer)
  from public;
grant execute on function
  public.admin_save_pricing_plan(uuid, text, numeric, integer, integer, boolean, integer)
  to authenticated;

create or replace function public.get_my_company_plan(p_company_id uuid)
returns table (
  plan_name text,
  job_limit integer,
  seat_limit integer,
  vacantes_activas integer,
  usuarios_actuales integer
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin

  if not public.is_company_member(p_company_id, array['dueno','reclutador','observador']) then
    raise exception 'No tienes permiso para ver esta información.';
  end if;

  return query
  select
    gap.plan_name,
    gap.job_limit,
    gap.seat_limit,
    (
      select count(*)::integer from public.jobs
      where company_id = p_company_id
        and status in ('published', 'paused')
    ),
    (
      select count(*)::integer from public.company_members
      where company_id = p_company_id
    )
  from public.get_company_active_plan(p_company_id) gap;

end;
$$;

revoke all on function public.get_my_company_plan(uuid) from public;
grant execute on function public.get_my_company_plan(uuid) to authenticated;
