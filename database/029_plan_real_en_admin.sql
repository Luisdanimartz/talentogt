-- =========================================================
-- 029_plan_real_en_admin.sql
--
-- La columna "Plan" en la lista de Empresas mostraba el
-- campo viejo company_profiles.plan (texto suelto, siempre
-- "Gratis"), no el plan REAL calculado con las tarifas y
-- publicaciones gratis asignadas. Esta migracion:
--
--  1. Agrega el plan vigente real a admin_companies().
--  2. Agrega a admin_company_usage(): cuanto le queda por
--     usar, la fecha en que vence su plan de pago (si tiene),
--     y los dias que le faltan.
--
-- Requiere el 026, 027 y 028.
-- =========================================================


-- ---------------------------------------------------------------------
-- 1. Plan real en la lista de empresas
-- ---------------------------------------------------------------------

drop function if exists public.admin_companies();

create or replace function public.admin_companies()
returns table (
  id uuid,
  company_name text,
  nit text,
  email text,
  phone text,
  department_name text,
  status text,
  plan text,
  active_plan_name text,
  is_collaborator boolean,
  total_vacantes bigint,
  total_postulaciones bigint,
  unlock_credits integer,
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
    c.id,
    c.company_name::text,
    c.nit::text,
    c.email::text,
    c.phone::text,
    d.name::text,
    c.status::text,
    c.plan::text,
    (select gap.plan_name from public.get_company_active_plan(c.id) gap),
    c.is_collaborator,
    count(distinct j.id)::bigint,
    count(distinct a.id)::bigint,
    c.unlock_credits,
    c.created_at
  from public.company_profiles c
  left join public.departments d on d.id = c.department_id
  left join public.jobs j on j.company_id = c.id
  left join public.applications a on a.job_id = j.id
  group by c.id, c.company_name, c.nit, c.email, c.phone, d.name,
           c.status, c.plan, c.is_collaborator, c.unlock_credits, c.created_at
  order by c.created_at desc;

end;
$$;

revoke all on function public.admin_companies() from public;
grant execute on function public.admin_companies() to authenticated;


-- ---------------------------------------------------------------------
-- 2. Uso real + vencimiento del plan de pago (si tiene)
--    (hay que borrarla primero: cambia el tipo de fila que
--    devuelve, "create or replace" no lo permite)
-- ---------------------------------------------------------------------

drop function if exists public.admin_company_usage(uuid);

create or replace function public.admin_company_usage(p_company_id uuid)
returns table (
  vacantes_activas integer,
  job_limit integer,
  vacantes_disponibles integer,
  creditos_usados integer,
  creditos_disponibles integer,
  publicaciones_gratis_acumuladas integer,
  plan_expires_at timestamptz,
  dias_para_vencer integer
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_vacantes_activas integer;
  v_job_limit integer;
  v_vencimiento timestamptz;
begin

  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  select count(*)::integer into v_vacantes_activas
  from public.jobs
  where company_id = p_company_id
    and status in ('published', 'paused');

  select gap.job_limit into v_job_limit
  from public.get_company_active_plan(p_company_id) gap;

  -- Vencimiento del plan de PAGO vigente (si tiene uno)
  select cpa.expires_at into v_vencimiento
  from public.company_pricing_assignments cpa
  where cpa.company_id = p_company_id
    and cpa.pricing_plan_id is not null
    and (cpa.expires_at is null or cpa.expires_at > now())
  order by cpa.started_at desc
  limit 1;

  return query
  select
    v_vacantes_activas,
    v_job_limit,
    case when v_job_limit is null then null
         else greatest(0, v_job_limit - v_vacantes_activas) end,
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
    ),
    v_vencimiento,
    case when v_vencimiento is null then null
         else greatest(0, ceil(extract(epoch from (v_vencimiento - now())) / 86400))::integer end;

end;
$$;

revoke all on function public.admin_company_usage(uuid) from public;
grant execute on function public.admin_company_usage(uuid) to authenticated;
