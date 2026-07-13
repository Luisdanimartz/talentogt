-- =====================================================================
-- 018 - Carrusel de empresas VIP + numeros reales del Hero
--
--  1. Politica de lectura publica NUEVA y acotada: cualquiera (ni
--     siquiera con sesion) puede ver nombre + logo de empresas
--     ACTIVAS y VIP. No expone nada mas (nit, telefono, direccion
--     siguen protegidos por las politicas de siempre).
--
--  2. platform_public_stats(): los numeros reales para reemplazar
--     los inventados del Hero ("5,000+ vacantes", etc.)
--
-- Seguro de correr mas de una vez.
-- =====================================================================

drop policy if exists cgt_public_reads_vip_companies on public.company_profiles;

create policy cgt_public_reads_vip_companies
  on public.company_profiles
  for select
  to anon, authenticated
  using (
    status = 'activa'
    and plan = 'vip'
  );


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
      from public.company_profiles c
      where c.status = 'activa'
    );
$$;

revoke all on function public.platform_public_stats() from public;
grant execute on function public.platform_public_stats() to anon, authenticated;
