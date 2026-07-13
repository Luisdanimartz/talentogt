-- =====================================================================
-- 014 - Panel de administrador: funciones de datos
--
-- Todas verifican is_admin() adentro (no confian en que el
-- frontend oculte el menu - cualquiera podria llamarlas por API
-- directamente).
--
-- Requiere el 013. Seguro de correr mas de una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Numeros generales de la plataforma
-- ---------------------------------------------------------------------

create or replace function public.admin_overview()
returns table (
  total_candidatos bigint,
  total_empresas bigint,
  total_vacantes_publicadas bigint,
  total_postulaciones bigint,
  empresas_vip bigint,
  empresas_suspendidas bigint,
  candidatos_suspendidos bigint
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
    (select count(*) from public.candidate_profiles where status = 'suspendida');

end;
$$;

revoke all on function public.admin_overview() from public;
grant execute on function public.admin_overview() to authenticated;


-- ---------------------------------------------------------------------
-- 2. Empresas (con vacantes y postulaciones reales)
-- ---------------------------------------------------------------------

create or replace function public.admin_companies()
returns table (
  id uuid,
  company_name text,
  nit text,
  email text,
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
    c.company_name,
    c.nit,
    c.email,
    d.name,
    c.status,
    c.plan,
    count(distinct j.id),
    count(distinct a.id),
    c.created_at
  from public.company_profiles c
  left join public.departments d on d.id = c.department_id
  left join public.jobs j on j.company_id = c.id
  left join public.applications a on a.job_id = j.id
  group by c.id, c.company_name, c.nit, c.email, d.name, c.status, c.plan, c.created_at
  order by c.created_at desc;

end;
$$;

revoke all on function public.admin_companies() from public;
grant execute on function public.admin_companies() to authenticated;


-- ---------------------------------------------------------------------
-- 3. Candidatos (con correo real y postulaciones)
-- ---------------------------------------------------------------------

create or replace function public.admin_candidates()
returns table (
  id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  email text,
  profession text,
  department text,
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
    cp.first_name,
    cp.last_name,
    u.email,
    cp.profession,
    cp.department,
    cp.status,
    count(a.id),
    cp.created_at
  from public.candidate_profiles cp
  join auth.users u on u.id = cp.user_id
  left join public.applications a on a.candidate_profile_id = cp.id
  group by cp.id, cp.user_id, cp.first_name, cp.last_name, u.email,
           cp.profession, cp.department, cp.status, cp.created_at
  order by cp.created_at desc;

end;
$$;

revoke all on function public.admin_candidates() from public;
grant execute on function public.admin_candidates() to authenticated;


-- ---------------------------------------------------------------------
-- 4. Vacantes (todas, con empresa y postulantes)
-- ---------------------------------------------------------------------

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
    j.title,
    c.company_name,
    j.status,
    count(a.id),
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
-- 5. Embudo de TODA la plataforma (mismo criterio que el 011/012,
--    pero sin filtrar por empresa)
-- ---------------------------------------------------------------------

create or replace function public.admin_hiring_funnel()
returns table (
  total_postulaciones bigint,
  en_revision bigint,
  en_entrevista bigint,
  contratados bigint,
  rechazados bigint
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
  with etapas as (
    select
      a.id as application_id,
      a.current_status,
      greatest(
        coalesce(max(
          case h.status
            when 'applied'   then 0
            when 'reviewing' then 1
            when 'interview' then 2
            when 'hired'     then 3
            else -1
          end
        ), -1),
        case a.current_status
          when 'applied'   then 0
          when 'reviewing' then 1
          when 'interview' then 2
          when 'hired'     then 3
          else -1
        end
      ) as etapa_maxima
    from public.applications a
    left join public.application_status_history h
      on h.application_id = a.id
    group by a.id, a.current_status
  )
  select
    (select count(*) from etapas)::bigint,
    (select count(*) from etapas where etapa_maxima >= 1)::bigint,
    (select count(*) from etapas where etapa_maxima >= 2)::bigint,
    (select count(*) from etapas where etapa_maxima >= 3)::bigint,
    (select count(*) from etapas where current_status = 'rejected')::bigint;

end;
$$;

revoke all on function public.admin_hiring_funnel() from public;
grant execute on function public.admin_hiring_funnel() to authenticated;


-- ---------------------------------------------------------------------
-- 6. Top empresas por postulaciones recibidas (para Reportes)
-- ---------------------------------------------------------------------

create or replace function public.admin_top_companies(p_limit int default 10)
returns table (
  company_name text,
  total_vacantes bigint,
  total_postulaciones bigint
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
    c.company_name,
    count(distinct j.id),
    count(a.id)
  from public.company_profiles c
  join public.jobs j on j.company_id = c.id
  left join public.applications a on a.job_id = j.id
  group by c.company_name
  order by count(a.id) desc
  limit p_limit;

end;
$$;

revoke all on function public.admin_top_companies(int) from public;
grant execute on function public.admin_top_companies(int) to authenticated;


-- ---------------------------------------------------------------------
-- 7. Candidatos por departamento (para Reportes)
-- ---------------------------------------------------------------------

create or replace function public.admin_candidates_by_department()
returns table (
  department text,
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

  return query
  select
    coalesce(cp.department, 'Sin especificar'),
    count(*)
  from public.candidate_profiles cp
  group by cp.department
  order by count(*) desc;

end;
$$;

revoke all on function public.admin_candidates_by_department() from public;
grant execute on function public.admin_candidates_by_department() to authenticated;


-- ---------------------------------------------------------------------
-- 8. Gestion de administradores (asignar / quitar el rol admin)
-- ---------------------------------------------------------------------

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

  -- Sin tabla "profiles": el nombre tambien vive en user_metadata
  -- (asi lo guarda registerUser: "names" y "lastname").
  return query
  select
    u.id,
    u.email,
    u.raw_user_meta_data ->> 'names',
    u.raw_user_meta_data ->> 'lastname'
  from auth.users u
  where u.raw_user_meta_data ->> 'role' = 'admin'
  order by u.email;

end;
$$;

revoke all on function public.admin_list_admins() from public;
grant execute on function public.admin_list_admins() to authenticated;


create or replace function public.admin_set_role_by_email(
  p_email text,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin

  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  if p_role not in ('admin', 'empresa', 'candidato') then
    raise exception 'Rol invalido: %', p_role;
  end if;

  select id into v_user_id
  from auth.users
  where lower(email) = lower(trim(p_email));

  if v_user_id is null then
    raise exception
      'No existe ningun usuario registrado con el correo %', p_email;
  end if;

  -- Sin tabla "profiles": el rol vive en user_metadata, que es lo
  -- que ya lee handlePostLoginRedirect y ProtectedRoute en la app.
  update auth.users
  set raw_user_meta_data =
    coalesce(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', p_role)
  where id = v_user_id;

end;
$$;

revoke all on function public.admin_set_role_by_email(text, text) from public;
grant execute on function public.admin_set_role_by_email(text, text)
  to authenticated;
