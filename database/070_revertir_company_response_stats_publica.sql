-- 070_revertir_company_response_stats_publica.sql
-- CORRIGE UN ERROR MÍO en la migración 066.
--
-- En 066 le agregué a company_response_stats(cid) el mismo candado que a
-- job_applicant_stats, get_company_active_plan y empresas_con_pendientes_atrasados
-- (exigir ser miembro de la empresa o admin). Esas 3 sí tenían datos sensibles
-- reales (salario esperado de candidatos, plan de pago, reporte administrativo).
--
-- company_response_stats NO es sensible: son solo números agregados (cuántas
-- postulaciones respondió una empresa y en cuántos días, sin ningún dato de
-- candidatos ni de negocio privado). Además, está usada como insignia PÚBLICA
-- de confianza en:
--   - src/components/CompanyResponseBadge.jsx
--   - src/pages/Jobs.jsx (listado público de vacantes)
--   - src/pages/JobDetail.jsx (detalle de vacante, visible sin sesión)
--   - src/pages/candidate/ApplicationDetail.jsx (vista del candidato)
--
-- Al agregarle el candado en 066, cualquier candidato o visitante que la
-- consultara recibía "No autorizado" — y como el componente no muestra ningún
-- error, la insignia simplemente desaparecía en silencio. Esto rompía uno de
-- los diferenciadores más importantes de la plataforma frente a la competencia.
--
-- Esta migración la revierte a lectura pública, sin tocar las otras 3
-- funciones de la 066 (esas sí deben quedar restringidas).

BEGIN;

CREATE OR REPLACE FUNCTION public.company_response_stats(cid uuid)
RETURNS TABLE (total bigint, responded bigint, avg_response_days numeric)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH primera_respuesta AS (
    SELECT
      h.application_id,
      min(h.created_at) AS respondido_en
    FROM public.application_status_history h
    WHERE h.status <> 'applied'
    GROUP BY h.application_id
  )
  SELECT
    count(*) AS total,
    count(*) FILTER (WHERE a.current_status IS DISTINCT FROM 'applied') AS responded,
    round(
      (
        avg(extract(epoch FROM (pr.respondido_en - a.applied_at)) / 86400.0)
        FILTER (WHERE pr.respondido_en IS NOT NULL)
      )::numeric,
      1
    ) AS avg_response_days
  FROM public.applications a
  JOIN public.jobs j ON j.id = a.job_id
  LEFT JOIN primera_respuesta pr ON pr.application_id = a.id
  WHERE j.company_id = cid
    AND a.current_status <> 'withdrawn';
$$;

COMMIT;
