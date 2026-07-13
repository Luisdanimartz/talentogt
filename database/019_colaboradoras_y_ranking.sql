-- =====================================================================
-- 019 - Empresas colaboradoras + ranking real de tiempo de respuesta
--
--  1. company_profiles.is_collaborator: bandera NUEVA, separada del
--     plan VIP. Son empresas que ayudan dando retroalimentacion de
--     la plataforma - no necesariamente pagan.
--
--  2. Se amplia la politica de lectura publica (018) para que
--     tambien se puedan ver nombre + logo de las colaboradoras.
--
--  3. platform_top_response_companies(): top empresas por tiempo
--     de respuesta MAS RAPIDO. Solo entran empresas con al menos
--     3 postulaciones respondidas (para que el promedio signifique
--     algo, no sea un caso aislado).
--
-- Requiere 013, 018. Seguro de correr mas de una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Columna nueva
-- ---------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'company_profiles'
      and column_name = 'is_collaborator'
  ) then
    alter table public.company_profiles
      add column is_collaborator boolean not null default false;
  end if;
end $$;


-- ---------------------------------------------------------------------
-- 2. Ampliar la lectura publica (reemplaza la politica del 018)
-- ---------------------------------------------------------------------

drop policy if exists cgt_public_reads_vip_companies on public.company_profiles;

create policy cgt_public_reads_vip_companies
  on public.company_profiles
  for select
  to anon, authenticated
  using (
    status = 'activa'
    and (plan = 'vip' or is_collaborator = true)
  );


-- ---------------------------------------------------------------------
-- 3. admin_companies() ahora tambien trae is_collaborator
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
  is_collaborator boolean,
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
    c.is_collaborator,
    count(distinct j.id)::bigint,
    count(distinct a.id)::bigint,
    c.created_at
  from public.company_profiles c
  left join public.departments d on d.id = c.department_id
  left join public.jobs j on j.company_id = c.id
  left join public.applications a on a.job_id = j.id
  group by c.id, c.company_name, c.nit, c.email, c.phone, d.name,
           c.status, c.plan, c.is_collaborator, c.created_at
  order by c.created_at desc;

end;
$$;

revoke all on function public.admin_companies() from public;
grant execute on function public.admin_companies() to authenticated;


-- ---------------------------------------------------------------------
-- 4. Top empresas por tiempo de respuesta (mas rapido primero)
-- ---------------------------------------------------------------------

create or replace function public.platform_top_response_companies(
  p_limit int default 10,
  p_min_postulaciones int default 3
)
returns table (
  company_name text,
  logo text,
  horas_respuesta_promedio numeric,
  total_postulaciones bigint
)
language sql
security definer
set search_path = public
stable
as $$
  with respondidas as (
    select
      a.id as application_id,
      a.job_id,
      a.applied_at,
      pr.respondido_en
    from public.applications a
    join (
      select h.application_id, min(h.created_at) as respondido_en
      from public.application_status_history h
      where h.status <> 'applied'
      group by h.application_id
    ) pr on pr.application_id = a.id
  )
  select
    c.company_name::text,
    c.logo::text,
    avg(
      extract(epoch from (r.respondido_en - r.applied_at)) / 3600.0
    ) as horas_respuesta_promedio,
    count(r.application_id)::bigint as total_postulaciones
  from public.company_profiles c
  join public.jobs j on j.company_id = c.id
  join respondidas r on r.job_id = j.id
  where c.status = 'activa'
  group by c.id, c.company_name, c.logo
  having count(r.application_id) >= p_min_postulaciones
  order by avg(
    extract(epoch from (r.respondido_en - r.applied_at)) / 3600.0
  ) asc
  limit p_limit;
$$;

revoke all on function
  public.platform_top_response_companies(int, int)
  from public;

grant execute on function
  public.platform_top_response_companies(int, int)
  to anon, authenticated;
