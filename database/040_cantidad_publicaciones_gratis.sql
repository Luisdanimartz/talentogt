-- =====================================================================
-- 040 - Cantidad de publicaciones gratis visible en Empresas (admin)
--
-- admin_companies() ya mostraba el NOMBRE del plan vigente
-- ("Publicaciones gratis", "Plan Pro", etc. via 029) pero no la
-- CANTIDAD (cuántas vacantes le quedan permitidas). Se agrega
-- active_plan_job_limit para que el admin vea, por ejemplo,
-- "Publicaciones gratis (2)".
--
-- Cambia el tipo de retorno, por eso hay que hacer drop primero.
-- Requiere 026/027/029. Segura de correr más de una vez.
-- =====================================================================

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
  active_plan_job_limit integer,
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
    (select gap.job_limit from public.get_company_active_plan(c.id) gap),
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
-- Bonus: reporte directo de quién tiene publicaciones gratis y
-- cuántas le quedan (por si lo quieres ver aparte, sin filtrar la
-- tabla completa de empresas).
-- ---------------------------------------------------------------------

create or replace function public.admin_free_posts_summary()
returns table (
  company_id uuid,
  company_name text,
  free_posts_total integer,
  vacantes_activas integer
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
    (
      select coalesce(sum(cpa.free_posts_granted), 0)::integer
      from public.company_pricing_assignments cpa
      where cpa.company_id = c.id
        and cpa.pricing_plan_id is null
        and (cpa.expires_at is null or cpa.expires_at > now())
    ),
    (
      select count(*)::integer
      from public.jobs j
      where j.company_id = c.id
        and j.status in ('published', 'paused')
    )
  from public.company_profiles c
  where exists (
    select 1
    from public.company_pricing_assignments cpa
    where cpa.company_id = c.id
      and cpa.pricing_plan_id is null
      and cpa.free_posts_granted > 0
      and (cpa.expires_at is null or cpa.expires_at > now())
  )
  -- Solo si NO tiene ademas un plan de pago vigente (ese manda)
  and not exists (
    select 1
    from public.company_pricing_assignments cpa2
    where cpa2.company_id = c.id
      and cpa2.pricing_plan_id is not null
      and (cpa2.expires_at is null or cpa2.expires_at > now())
  )
  order by c.company_name;

end;
$$;

revoke all on function public.admin_free_posts_summary() from public;
grant execute on function public.admin_free_posts_summary() to authenticated;
