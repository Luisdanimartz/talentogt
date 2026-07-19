-- =====================================================================
-- Migración 054: Empresas destacadas y colaboradoras
--
-- 1. "Empresas destacadas en ChanceGT" = empresas BIEN CALIFICADAS
--    con el sistema de estrellas real (005): estrellas segun el
--    porcentaje de postulaciones respondidas. Nada inventado: entra
--    quien responde al menos el 80% con un minimo de postulaciones.
--
-- 2. "Empresas que estan cambiando como se recluta en Guatemala" =
--    empresas colaboradoras (is_collaborator) con su logo y su
--    COMENTARIO propio sobre como piensan apoyar el reclutamiento.
--    El admin las activa desde el panel y captura el comentario.
--
-- Requiere 005 (reputacion). Self-contained y segura de correr
-- mas de una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Comentario de la empresa colaboradora
-- ---------------------------------------------------------------------

alter table public.company_profiles
  add column if not exists collaborator_comment text;


-- ---------------------------------------------------------------------
-- 2. Empresas destacadas: las mejor calificadas (estrellas reales)
--
-- Misma formula que el badge publico (005): estrellas segun
-- respondidas / total. Requisitos para destacar:
--   - empresa activa y con logo
--   - minimo p_min_postulaciones recibidas (evita el 100% con 1)
--   - responde al menos el 80%
-- ---------------------------------------------------------------------

drop function if exists public.platform_featured_companies(int, int);

create or replace function public.platform_featured_companies(
  p_limit int default 10,
  p_min_postulaciones int default 3
)
returns table (
  id uuid,
  company_name text,
  logo text,
  total_postulaciones bigint,
  respondidas bigint,
  estrellas int
)
language sql
security definer
set search_path = public
stable
as $$
  select
    c.id,
    c.company_name,
    c.logo,
    count(a.id) as total_postulaciones,
    count(a.id) filter (where a.current_status is distinct from 'applied')
      as respondidas,
    greatest(
      1,
      round(
        (count(a.id) filter (where a.current_status is distinct from 'applied'))::numeric
        / nullif(count(a.id), 0) * 5
      )
    )::int as estrellas
  from public.company_profiles c
  join public.jobs j on j.company_id = c.id
  left join public.applications a on a.job_id = j.id
  where c.status = 'activa'
    and c.logo is not null
  group by c.id, c.company_name, c.logo
  having count(a.id) >= p_min_postulaciones
     and (count(a.id) filter (where a.current_status is distinct from 'applied'))::numeric
         / count(a.id) >= 0.8
  order by 6 desc, 4 desc
  limit p_limit;
$$;

grant execute on function public.platform_featured_companies(int, int)
  to anon, authenticated;


-- ---------------------------------------------------------------------
-- Nota: si corriste la migracion 053 (tabla testimonials), esa tabla
-- ya no se usa — las colaboradoras viven en company_profiles. Puedes
-- dejarla (no estorba) o eliminarla con:
--
-- drop table if exists public.testimonials;
--
-- Si NO corriste la 053, simplemente omitela.
-- ---------------------------------------------------------------------
