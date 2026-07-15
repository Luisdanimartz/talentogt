-- =====================================================================
-- 033 - Empresas sin publicar + corrección del % de respuesta real
--
-- Dos cambios relacionados, por eso van juntos:
--
--   1. admin_companies_without_jobs(): para el ADMIN. Empresas
--      registradas que nunca publicaron ninguna vacante, ordenadas
--      por antigüedad. Esto es un problema de ACTIVACIÓN, no de
--      servicio al candidato.
--
--   2. platform_public_stats(): se corrige el % de "empresas
--      responden" de la landing page. Antes se calculaba sobre
--      TODAS las empresas activas, castigando por igual a la que
--      nunca publicó nada y a la que sí publicó y dejó candidatos
--      sin respuesta. Ahora se calcula SOLO entre empresas que ya
--      recibieron al menos una postulación — así el número refleja
--      calidad real de servicio, no activación.
--
-- Requiere 013 (is_admin), 014 (esquema admin) y 018
-- (platform_public_stats original). Segura de correr mas de una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. admin_companies_without_jobs()
-- ---------------------------------------------------------------------

create or replace function public.admin_companies_without_jobs()
returns table (
  id uuid,
  company_name text,
  nit text,
  email text,
  department_name text,
  status text,
  plan text,
  dias_registrada integer,
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
    extract(day from now() - c.created_at)::integer,
    c.created_at
  from public.company_profiles c
  left join public.departments d on d.id = c.department_id
  where not exists (
    select 1 from public.jobs j where j.company_id = c.id
  )
  order by c.created_at asc;

end;
$$;

revoke all on function public.admin_companies_without_jobs() from public;
grant execute on function public.admin_companies_without_jobs()
  to authenticated;


-- ---------------------------------------------------------------------
-- 2. platform_public_stats(): % de respuesta calculado solo entre
--    empresas que ya recibieron al menos una postulación.
--
--    El tipo de retorno no cambia (mismas 4 columnas), asi que
--    CREATE OR REPLACE funciona sin necesidad de DROP.
-- ---------------------------------------------------------------------

create or replace function public.platform_public_stats()
returns table (
  vacantes_activas bigint,
  empresas_registradas bigint,
  candidatos_activos bigint,
  porcentaje_empresas_responden numeric
)
language sql
security definer
set search_path = public
stable
as $$
  select
    (select count(*) from public.jobs where status = 'published'),
    (select count(*) from public.company_profiles where status = 'activa'),
    (select count(*) from public.candidate_profiles where status = 'activa'),
    (
      select case
        when count(*) = 0 then 0
        else round(
          100.0 * count(*) filter (
            where exists (
              select 1
              from public.applications a
              join public.jobs j on j.id = a.job_id
              where j.company_id = c.id
                and a.current_status <> 'applied'
            )
          ) / count(*)
        )
      end
      -- Solo empresas que YA recibieron al menos una postulación.
      -- Una empresa que nunca publicó nada no puede "responder",
      -- y no debe contar en contra de este número.
      from public.company_profiles c
      where c.status = 'activa'
        and exists (
          select 1
          from public.applications a
          join public.jobs j on j.id = a.job_id
          where j.company_id = c.id
        )
    );
$$;

revoke all on function public.platform_public_stats() from public;
grant execute on function public.platform_public_stats() to anon, authenticated;
