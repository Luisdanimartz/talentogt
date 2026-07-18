-- =====================================================================
-- Migración 052: Filtro de fecha en los reportes del admin
--
-- Agrega parámetros opcionales p_desde / p_hasta (inclusive, tipo
-- date) a las funciones de reportes. Con NULL se comportan igual que
-- antes (todo el histórico), así que nada existente se rompe.
--
-- Criterio honesto por reporte:
--   - Embudo: postulaciones CREADAS en el rango.
--   - Top empresas: vacantes creadas y postulaciones recibidas en el
--     rango (cada una cuenta por su propia fecha).
--   - Demográficos (departamento, ubicación, edad, género): por fecha
--     de REGISTRO del perfil.
--   - Vistas vs postulaciones: vistas y postulaciones en el rango.
--   - Pendientes y Empresas sin publicar NO cambian: son fotos del
--     estado actual, un filtro de fecha no aplica ahí.
--
-- IMPORTANTE: hay que DROPear las versiones viejas antes de crear las
-- nuevas. Si solo se agregaran parámetros, Postgres crearía una
-- función duplicada (sobrecarga) y PostgREST daría error de
-- ambigüedad al llamarlas.
--
-- Requiere 013 (is_admin), 014, 036 y 050. Segura de correr más de
-- una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Embudo de contratación
-- ---------------------------------------------------------------------

drop function if exists public.admin_hiring_funnel();
drop function if exists public.admin_hiring_funnel(date, date);

create or replace function public.admin_hiring_funnel(
  p_desde date default null,
  p_hasta date default null
)
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
    where (p_desde is null or a.created_at >= p_desde)
      and (p_hasta is null or a.created_at < p_hasta + 1)
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

revoke all on function public.admin_hiring_funnel(date, date) from public;
grant execute on function public.admin_hiring_funnel(date, date) to authenticated;


-- ---------------------------------------------------------------------
-- 2. Top empresas
-- ---------------------------------------------------------------------

drop function if exists public.admin_top_companies(int);
drop function if exists public.admin_top_companies(int, date, date);

create or replace function public.admin_top_companies(
  p_limit int default 10,
  p_desde date default null,
  p_hasta date default null
)
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
    count(distinct j.id) filter (
      where (p_desde is null or j.created_at >= p_desde)
        and (p_hasta is null or j.created_at < p_hasta + 1)
    ),
    count(a.id) filter (
      where (p_desde is null or a.created_at >= p_desde)
        and (p_hasta is null or a.created_at < p_hasta + 1)
    )
  from public.company_profiles c
  join public.jobs j on j.company_id = c.id
  left join public.applications a on a.job_id = j.id
  group by c.company_name
  order by 3 desc
  limit p_limit;

end;
$$;

revoke all on function public.admin_top_companies(int, date, date) from public;
grant execute on function public.admin_top_companies(int, date, date) to authenticated;


-- ---------------------------------------------------------------------
-- 3. Candidatos por departamento (por fecha de registro)
-- ---------------------------------------------------------------------

drop function if exists public.admin_candidates_by_department();
drop function if exists public.admin_candidates_by_department(date, date);

create or replace function public.admin_candidates_by_department(
  p_desde date default null,
  p_hasta date default null
)
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
  where (p_desde is null or cp.created_at >= p_desde)
    and (p_hasta is null or cp.created_at < p_hasta + 1)
  group by cp.department
  order by count(*) desc;

end;
$$;

revoke all on function public.admin_candidates_by_department(date, date) from public;
grant execute on function public.admin_candidates_by_department(date, date) to authenticated;


-- ---------------------------------------------------------------------
-- 4. Empresas por ubicación (por fecha de registro)
-- ---------------------------------------------------------------------

drop function if exists public.admin_companies_by_location();
drop function if exists public.admin_companies_by_location(date, date);

create or replace function public.admin_companies_by_location(
  p_desde date default null,
  p_hasta date default null
)
returns table (
  department_name text,
  municipality_name text,
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
    coalesce(d.name, 'Sin dato'),
    coalesce(m.name, 'Sin dato'),
    count(*)
  from public.company_profiles c
  left join public.departments d on d.id = c.department_id
  left join public.municipalities m on m.id = c.municipality_id
  where (p_desde is null or c.created_at >= p_desde)
    and (p_hasta is null or c.created_at < p_hasta + 1)
  group by d.name, m.name
  order by count(*) desc;

end;
$$;

revoke all on function public.admin_companies_by_location(date, date) from public;
grant execute on function public.admin_companies_by_location(date, date) to authenticated;


-- ---------------------------------------------------------------------
-- 5. Candidatos por ubicación (por fecha de registro)
-- ---------------------------------------------------------------------

drop function if exists public.admin_candidates_by_location();
drop function if exists public.admin_candidates_by_location(date, date);

create or replace function public.admin_candidates_by_location(
  p_desde date default null,
  p_hasta date default null
)
returns table (
  department_name text,
  municipality_name text,
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
    coalesce(nullif(trim(cp.department), ''), 'Sin dato'),
    coalesce(nullif(trim(cp.municipality), ''), 'Sin dato'),
    count(*)
  from public.candidate_profiles cp
  where (p_desde is null or cp.created_at >= p_desde)
    and (p_hasta is null or cp.created_at < p_hasta + 1)
  group by 1, 2
  order by count(*) desc;

end;
$$;

revoke all on function public.admin_candidates_by_location(date, date) from public;
grant execute on function public.admin_candidates_by_location(date, date) to authenticated;


-- ---------------------------------------------------------------------
-- 6. Candidatos por edad (por fecha de registro)
-- ---------------------------------------------------------------------

drop function if exists public.admin_candidates_by_age();
drop function if exists public.admin_candidates_by_age(date, date);

create or replace function public.admin_candidates_by_age(
  p_desde date default null,
  p_hasta date default null
)
returns table (
  rango text,
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
    case
      when cp.birth_date is null then 'Sin dato'
      when date_part('year', age(cp.birth_date)) < 18 then 'Menor de 18'
      when date_part('year', age(cp.birth_date)) between 18 and 24 then '18 a 24'
      when date_part('year', age(cp.birth_date)) between 25 and 34 then '25 a 34'
      when date_part('year', age(cp.birth_date)) between 35 and 44 then '35 a 44'
      when date_part('year', age(cp.birth_date)) between 45 and 54 then '45 a 54'
      when date_part('year', age(cp.birth_date)) between 55 and 64 then '55 a 64'
      else '65 o más'
    end as rango,
    count(*)
  from public.candidate_profiles cp
  where (p_desde is null or cp.created_at >= p_desde)
    and (p_hasta is null or cp.created_at < p_hasta + 1)
  group by 1
  order by
    case rango
      when 'Menor de 18' then 1
      when '18 a 24' then 2
      when '25 a 34' then 3
      when '35 a 44' then 4
      when '45 a 54' then 5
      when '55 a 64' then 6
      when '65 o más' then 7
      else 8
    end;

end;
$$;

revoke all on function public.admin_candidates_by_age(date, date) from public;
grant execute on function public.admin_candidates_by_age(date, date) to authenticated;


-- ---------------------------------------------------------------------
-- 7. Candidatos por género (por fecha de registro)
-- ---------------------------------------------------------------------

drop function if exists public.admin_candidates_by_gender();
drop function if exists public.admin_candidates_by_gender(date, date);

create or replace function public.admin_candidates_by_gender(
  p_desde date default null,
  p_hasta date default null
)
returns table (
  gender text,
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
    coalesce(cp.gender, 'Sin dato'),
    count(*)
  from public.candidate_profiles cp
  where (p_desde is null or cp.created_at >= p_desde)
    and (p_hasta is null or cp.created_at < p_hasta + 1)
  group by 1
  order by count(*) desc;

end;
$$;

revoke all on function public.admin_candidates_by_gender(date, date) from public;
grant execute on function public.admin_candidates_by_gender(date, date) to authenticated;


-- ---------------------------------------------------------------------
-- 8. Vistas vs postulaciones (vistas y postulaciones en el rango)
-- ---------------------------------------------------------------------

drop function if exists public.admin_job_views_vs_applications(uuid);
drop function if exists public.admin_job_views_vs_applications(uuid, date, date);

create or replace function public.admin_job_views_vs_applications(
  p_company_id uuid default null,
  p_desde date default null,
  p_hasta date default null
)
returns table (
  job_id uuid,
  job_title text,
  company_name text,
  total_views bigint,
  total_applications bigint,
  conversion_rate numeric,
  created_at timestamptz
)
security definer
set search_path = public
language plpgsql
as $$
begin

  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  return query
  select
    j.id as job_id,
    j.title as job_title,
    c.company_name as company_name,
    count(distinct jv.id) as total_views,
    count(distinct a.id) as total_applications,
    case
      when count(distinct jv.id) = 0 then 0
      else round(count(distinct a.id)::numeric / count(distinct jv.id) * 100, 1)
    end as conversion_rate,
    j.created_at
  from public.jobs j
  left join public.company_profiles c on c.id = j.company_id
  left join public.job_views jv
    on jv.job_id = j.id
   and (p_desde is null or jv.created_at >= p_desde)
   and (p_hasta is null or jv.created_at < p_hasta + 1)
  left join public.applications a
    on a.job_id = j.id
   and (p_desde is null or a.created_at >= p_desde)
   and (p_hasta is null or a.created_at < p_hasta + 1)
  where (p_company_id is null or j.company_id = p_company_id)
  group by j.id, j.title, c.company_name, j.created_at
  order by j.created_at desc;

end;
$$;

revoke all on function public.admin_job_views_vs_applications(uuid, date, date) from public;
grant execute on function public.admin_job_views_vs_applications(uuid, date, date) to authenticated;
