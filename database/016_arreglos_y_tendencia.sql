-- =====================================================================
-- 016 - Arreglos de tipo + Dashboard de tendencias
--
--  1. Arregla "structure of query does not match function result
--     type" en admin_candidates() y admin_list_admins(): en Postgres,
--     auth.users.email es "character varying", no "text", y una
--     funcion que declara RETURNS TABLE(... text) es estricta con
--     eso. La correccion es forzar ::text en cada columna de texto
--     que sale de auth.users o de tablas que puedan tener varchar.
--
--  2. admin_overview() ahora TAMBIEN trae el tiempo promedio de
--     primera respuesta de todos los reclutadores (mismo criterio
--     que el reporte de empresa, pero de toda la plataforma).
--
--  3. admin_jobs_trend(): vacantes publicadas por dia / mes / año,
--     para el dashboard de crecimiento. Con pocos datos hoy se ve
--     chico, pero la funcion ya queda lista para cuando haya mas.
--
-- Requiere 013/014. Seguro de correr mas de una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. admin_candidates() con casts explicitos a text
-- ---------------------------------------------------------------------

drop function if exists public.admin_candidates();

create or replace function public.admin_candidates()
returns table (
  id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  email text,
  phone text,
  profession text,
  department text,
  municipality text,
  status text,
  total_postulaciones bigint,
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
    cp.id,
    cp.user_id,
    cp.first_name::text,
    cp.last_name::text,
    u.email::text,
    cp.phone::text,
    cp.profession::text,
    cp.department::text,
    cp.municipality::text,
    cp.status::text,
    count(a.id)::bigint,
    cp.created_at
  from public.candidate_profiles cp
  join auth.users u on u.id = cp.user_id
  left join public.applications a on a.candidate_profile_id = cp.id
  group by cp.id, cp.user_id, cp.first_name, cp.last_name, u.email,
           cp.phone, cp.profession, cp.department, cp.municipality,
           cp.status, cp.created_at
  order by cp.created_at desc;

end;
$$;

revoke all on function public.admin_candidates() from public;
grant execute on function public.admin_candidates() to authenticated;


-- ---------------------------------------------------------------------
-- 2. admin_list_admins() con casts explicitos a text
-- ---------------------------------------------------------------------

drop function if exists public.admin_list_admins();

create or replace function public.admin_list_admins()
returns table (
  user_id uuid,
  email text,
  first_name text,
  last_name text
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
    u.id,
    u.email::text,
    (u.raw_user_meta_data ->> 'names')::text,
    (u.raw_user_meta_data ->> 'lastname')::text
  from auth.users u
  where u.raw_user_meta_data ->> 'role' = 'admin'
  order by u.email;

end;
$$;

revoke all on function public.admin_list_admins() from public;
grant execute on function public.admin_list_admins() to authenticated;


-- ---------------------------------------------------------------------
-- 3. admin_companies() y admin_jobs(): mismos casts, por seguridad
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
  total_vacantes bigint,
  total_postulaciones bigint,
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
    count(distinct j.id)::bigint,
    count(distinct a.id)::bigint,
    c.created_at
  from public.company_profiles c
  left join public.departments d on d.id = c.department_id
  left join public.jobs j on j.company_id = c.id
  left join public.applications a on a.job_id = j.id
  group by c.id, c.company_name, c.nit, c.email, c.phone, d.name,
           c.status, c.plan, c.created_at
  order by c.created_at desc;

end;
$$;

revoke all on function public.admin_companies() from public;
grant execute on function public.admin_companies() to authenticated;


drop function if exists public.admin_jobs();

create or replace function public.admin_jobs()
returns table (
  id uuid,
  title text,
  company_name text,
  status text,
  total_postulaciones bigint,
  published_at timestamptz,
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
    j.id,
    j.title::text,
    c.company_name::text,
    j.status::text,
    count(a.id)::bigint,
    j.published_at,
    j.created_at
  from public.jobs j
  join public.company_profiles c on c.id = j.company_id
  left join public.applications a on a.job_id = j.id
  group by j.id, j.title, c.company_name, j.status, j.published_at, j.created_at
  order by j.created_at desc;

end;
$$;

revoke all on function public.admin_jobs() from public;
grant execute on function public.admin_jobs() to authenticated;


-- ---------------------------------------------------------------------
-- 4. admin_overview() + tiempo de primera respuesta
-- ---------------------------------------------------------------------

drop function if exists public.admin_overview();

create or replace function public.admin_overview()
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
    (select count(*) from public.candidate_profiles),
    (select count(*) from public.company_profiles),
    (select count(*) from public.jobs where status = 'published'),
    (select count(*) from public.applications),
    (select count(*) from public.company_profiles where plan = 'vip'),
    (select count(*) from public.company_profiles where status = 'suspendida'),
    (select count(*) from public.candidate_profiles where status = 'suspendida'),
    (
      -- Tiempo promedio entre que alguien se postula y recibe el
      -- PRIMER cambio de estado (el mismo criterio que en el
      -- reporte de cada empresa, aqui a nivel de toda la plataforma)
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
    );

end;
$$;

revoke all on function public.admin_overview() from public;
grant execute on function public.admin_overview() to authenticated;


-- ---------------------------------------------------------------------
-- 5. admin_jobs_trend(): vacantes publicadas por dia / mes / año
-- ---------------------------------------------------------------------

create or replace function public.admin_jobs_trend(p_granularity text default 'month')
returns table (
  periodo text,
  total bigint
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

  if p_granularity not in ('day', 'month', 'year') then
    raise exception 'Granularidad invalida: %', p_granularity;
  end if;

  return query
  select
    to_char(
      date_trunc(p_granularity, j.published_at),
      case p_granularity
        when 'day' then 'YYYY-MM-DD'
        when 'month' then 'YYYY-MM'
        else 'YYYY'
      end
    ) as periodo,
    count(*)::bigint as total
  from public.jobs j
  where j.published_at is not null
    and j.published_at >= (
      case p_granularity
        when 'day' then now() - interval '30 days'
        when 'month' then now() - interval '12 months'
        else now() - interval '6 years'
      end
    )
  group by date_trunc(p_granularity, j.published_at)
  order by date_trunc(p_granularity, j.published_at);

end;
$$;

revoke all on function public.admin_jobs_trend(text) from public;
grant execute on function public.admin_jobs_trend(text) to authenticated;
