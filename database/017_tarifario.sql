-- =====================================================================
-- 017 - Tarifario de empresas
--
--  1. pricing_plans: hasta 10 tipos de tarifa que el admin define
--     (nombre, precio, duracion en dias, limite de publicaciones
--     o ilimitado). Editable, no se borra (se desactiva) para no
--     perder el historial de quien tuvo cada plan.
--
--  2. company_pricing_assignments: el historial de que tarifa (o
--     publicaciones gratis) se le asigno a cada empresa y cuando
--     vence. La ASIGNACION MAS RECIENTE es la vigente.
--
-- OJO - alcance de esta version: esto es la capa de ADMINISTRACION
-- (asignar, ver, vencer). Bloquear que una empresa publique cuando
-- se le acaben las publicaciones o venza su plan es un cambio aparte
-- al formulario de "Nueva vacante" que toca despues si lo quieres.
--
-- Requiere el 013 (is_admin). Seguro de correr mas de una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Tarifas
-- ---------------------------------------------------------------------

create table if not exists public.pricing_plans (
  id uuid primary key default gen_random_uuid(),

  name text not null,

  price numeric(10,2) not null default 0,
  currency text not null default 'GTQ',

  duration_days integer not null default 30,

  -- null = publicaciones ilimitadas durante la vigencia del plan
  job_limit integer,

  is_active boolean not null default true,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_pricing_plans_updated_at on public.pricing_plans;

create trigger set_pricing_plans_updated_at
  before update on public.pricing_plans
  for each row execute function public.set_updated_at();

-- Maximo 10 tarifas (activas o no - asi el admin no pierde el
-- control del catalogo). Se revisa con un trigger, no un check
-- simple, porque hay que CONTAR filas de la tabla.
create or replace function public.cgt_check_max_pricing_plans()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.pricing_plans) >= 10 then
    raise exception
      'Ya existen 10 tarifas. Desactiva o edita una existente antes de crear otra.';
  end if;
  return new;
end;
$$;

drop trigger if exists cgt_limit_pricing_plans on public.pricing_plans;

create trigger cgt_limit_pricing_plans
  before insert on public.pricing_plans
  for each row execute function public.cgt_check_max_pricing_plans();

alter table public.pricing_plans enable row level security;

drop policy if exists cgt_admin_manages_pricing_plans on public.pricing_plans;
create policy cgt_admin_manages_pricing_plans
  on public.pricing_plans
  for all
  using (public.is_admin())
  with check (public.is_admin());


-- ---------------------------------------------------------------------
-- 2. Asignaciones (historial de tarifas y publicaciones gratis)
-- ---------------------------------------------------------------------

create table if not exists public.company_pricing_assignments (
  id uuid primary key default gen_random_uuid(),

  company_id uuid not null
    references public.company_profiles(id)
    on delete cascade,

  -- null si esta fila es SOLO publicaciones gratis (sin plan de pago)
  pricing_plan_id uuid
    references public.pricing_plans(id),

  free_posts_granted integer not null default 0,

  started_at timestamptz not null default now(),

  -- se calcula al asignar: started_at + duration_days del plan.
  -- null = sin vencimiento (ej. publicaciones gratis sueltas)
  expires_at timestamptz,

  notes text,

  assigned_by uuid references auth.users(id),

  created_at timestamptz not null default now()
);

create index if not exists company_pricing_assignments_company_idx
  on public.company_pricing_assignments(company_id);

alter table public.company_pricing_assignments enable row level security;

drop policy if exists cgt_admin_manages_assignments
  on public.company_pricing_assignments;

create policy cgt_admin_manages_assignments
  on public.company_pricing_assignments
  for all
  using (public.is_admin())
  with check (public.is_admin());


-- ---------------------------------------------------------------------
-- 3. Funciones
-- ---------------------------------------------------------------------

create or replace function public.admin_list_pricing_plans()
returns setof public.pricing_plans
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
  select * from public.pricing_plans
  order by sort_order, created_at;
end;
$$;

revoke all on function public.admin_list_pricing_plans() from public;
grant execute on function public.admin_list_pricing_plans() to authenticated;


create or replace function public.admin_save_pricing_plan(
  p_id uuid,
  p_name text,
  p_price numeric,
  p_duration_days integer,
  p_job_limit integer,
  p_is_active boolean
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
      (name, price, duration_days, job_limit, is_active)
    values
      (p_name, p_price, p_duration_days, p_job_limit, coalesce(p_is_active, true))
    returning * into v_row;
  else
    update public.pricing_plans
    set
      name = p_name,
      price = p_price,
      duration_days = p_duration_days,
      job_limit = p_job_limit,
      is_active = coalesce(p_is_active, is_active)
    where id = p_id
    returning * into v_row;
  end if;

  return v_row;

end;
$$;

revoke all on function
  public.admin_save_pricing_plan(uuid, text, numeric, integer, integer, boolean)
  from public;
grant execute on function
  public.admin_save_pricing_plan(uuid, text, numeric, integer, integer, boolean)
  to authenticated;


/* Asignar una tarifa de pago a una empresa */
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

revoke all on function public.admin_assign_plan(uuid, uuid, text) from public;
grant execute on function public.admin_assign_plan(uuid, uuid, text) to authenticated;


/* Regalar N publicaciones gratis, sin asociarlas a un plan de pago */
create or replace function public.admin_grant_free_posts(
  p_company_id uuid,
  p_cantidad integer,
  p_notes text default null
)
returns public.company_pricing_assignments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.company_pricing_assignments;
begin

  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'La cantidad de publicaciones debe ser mayor a 0';
  end if;

  insert into public.company_pricing_assignments
    (company_id, pricing_plan_id, free_posts_granted, started_at, expires_at, notes, assigned_by)
  values
    (p_company_id, null, p_cantidad, now(), null, p_notes, auth.uid())
  returning * into v_row;

  return v_row;

end;
$$;

revoke all on function public.admin_grant_free_posts(uuid, integer, text) from public;
grant execute on function public.admin_grant_free_posts(uuid, integer, text) to authenticated;


/* Historial completo de tarifas/regalos de UNA empresa (mas reciente primero) */
create or replace function public.admin_company_pricing_history(p_company_id uuid)
returns table (
  id uuid,
  plan_name text,
  price numeric,
  free_posts_granted integer,
  started_at timestamptz,
  expires_at timestamptz,
  notes text,
  created_at timestamptz
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
    a.created_at
  from public.company_pricing_assignments a
  left join public.pricing_plans p on p.id = a.pricing_plan_id
  where a.company_id = p_company_id
  order by a.created_at desc;

end;
$$;

revoke all on function public.admin_company_pricing_history(uuid) from public;
grant execute on function public.admin_company_pricing_history(uuid) to authenticated;
