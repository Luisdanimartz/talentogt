-- 066_cerrar_fugas_reales.sql
-- A diferencia de 063-065 (que eran hardening preventivo), esta migración cierra
-- fugas de datos REALES verificadas leyendo el cuerpo de cada función: 4 funciones
-- SECURITY DEFINER, sin ningún chequeo de autorización interno, que devuelven datos
-- de una empresa/vacante específica pasada como parámetro — cualquier persona podía
-- pasar el UUID de la empresa/vacante de un competidor y ver sus datos.
--
-- El patrón de protección ya existe en el propio código (ver company_hiring_funnel
-- en 012_reportes_filtro_fecha.sql) — aquí se aplica el mismo patrón donde faltaba:
--
-- 1. company_response_stats(cid)     -> ahora exige ser miembro de esa empresa o admin
-- 2. job_applicant_stats(jid)        -> ahora exige ser miembro de la empresa dueña de esa vacante o admin
-- 3. get_company_active_plan(p_company_id) -> ahora exige ser miembro de esa empresa o admin
-- 4. empresas_con_pendientes_atrasados      -> es un reporte tipo admin; ahora exige is_admin()
--
-- Además, estas 5 funciones son de mantenimiento programado (llamadas por pg_cron),
-- nunca pensadas para ser invocadas por un cliente vía API. Se les revoca EXECUTE
-- tanto a anon como a authenticated (pg_cron las sigue pudiendo ejecutar porque
-- corre como el dueño de la función / rol de base de datos, no vía la API REST):
--   auto_resolve_expired_jobs, close_expired_jobs, deactivate_expired_assignments,
--   publish_scheduled_jobs, marcar_recordatorio_enviado
--
-- NO se toca (confirmado como diseño seguro):
--   - Funciones que son triggers (returns trigger): cgt_consume_job_credit,
--     cgt_consume_destacado_credit, cgt_fill_company_email, sync_role_to_app_metadata,
--     grant_welcome_free_posts, handle_new_user. Aunque el linter las marca como
--     "ejecutables", llamarlas directo vía API falla igual porque dependen de NEW/OLD,
--     que solo existen en contexto de trigger real.
--   - platform_public_stats, platform_featured_companies, platform_top_response_companies,
--     public_company_response_summary, vacantes_para_sitemap, register_job_view:
--     diseñadas para ser públicas (estadísticas de portada, sitemap, tracking anónimo).

BEGIN;

-- =========================================================
-- 1. company_response_stats: exigir membresía de la empresa o admin
-- =========================================================
CREATE OR REPLACE FUNCTION public.company_response_stats(cid uuid)
RETURNS TABLE (total bigint, responded bigint, avg_response_days numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  IF NOT (
    public.is_admin()
    OR public.is_company_member(cid, ARRAY['dueno','reclutador','observador'])
  ) THEN
    RAISE EXCEPTION 'No autorizado para ver estas estadísticas';
  END IF;

  RETURN QUERY
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
END;
$$;

-- =========================================================
-- 2. job_applicant_stats: exigir membresía de la empresa dueña de la vacante o admin
-- =========================================================
CREATE OR REPLACE FUNCTION public.job_applicant_stats(jid uuid)
RETURNS TABLE (
  total bigint,
  responded bigint,
  in_department bigint,
  avg_expected numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  SELECT company_id INTO v_company_id FROM public.jobs WHERE id = jid;

  IF NOT (
    public.is_admin()
    OR public.is_company_member(v_company_id, ARRAY['dueno','reclutador','observador'])
  ) THEN
    RAISE EXCEPTION 'No autorizado para ver estas estadísticas';
  END IF;

  RETURN QUERY
  SELECT
    count(*) AS total,
    count(*) FILTER (WHERE a.current_status IS DISTINCT FROM 'applied') AS responded,
    count(*) FILTER (
      WHERE d.name IS NOT NULL
        AND cp.department IS NOT NULL
        AND lower(cp.department) = lower(d.name)
    ) AS in_department,
    avg(cp.expected_salary) AS avg_expected
  FROM public.applications a
  JOIN public.candidate_profiles cp ON cp.id = a.candidate_profile_id
  JOIN public.jobs j ON j.id = a.job_id
  LEFT JOIN public.departments d ON d.id = j.department_id
  WHERE a.job_id = jid;
END;
$$;

-- =========================================================
-- 3. get_company_active_plan: exigir membresía de la empresa o admin
-- (usada internamente por triggers como cgt_consume_job_credit, que corren
--  en el contexto de la propia empresa haciendo la acción, así que el check
--  no rompe ese flujo)
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_company_active_plan(p_company_id uuid)
RETURNS TABLE (
  plan_name text,
  job_limit integer,
  seat_limit integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_plan_pago record;
  v_gratis_acumuladas integer;
  v_seat_override integer;
BEGIN
  IF NOT (
    public.is_admin()
    OR public.is_company_member(p_company_id, ARRAY['dueno','reclutador','observador'])
  ) THEN
    RAISE EXCEPTION 'No autorizado para ver el plan de esta empresa';
  END IF;

  SELECT cpa.*, pp.name AS plan_nombre, pp.job_limit AS plan_job_limit,
         pp.seat_limit AS plan_seat_limit
    INTO v_plan_pago
  FROM public.company_pricing_assignments cpa
  JOIN public.pricing_plans pp ON pp.id = cpa.pricing_plan_id
  WHERE cpa.company_id = p_company_id
    AND cpa.is_active = true
    AND (cpa.expires_at IS NULL OR cpa.expires_at > now())
  ORDER BY cpa.started_at DESC
  LIMIT 1;

  IF v_plan_pago IS NOT NULL THEN
    RETURN QUERY SELECT
      coalesce(v_plan_pago.plan_nombre, 'Plan'),
      v_plan_pago.plan_job_limit,
      v_plan_pago.plan_seat_limit;
    RETURN;
  END IF;

  SELECT seat_limit_override INTO v_seat_override
  FROM public.company_pricing_assignments
  WHERE company_id = p_company_id
    AND pricing_plan_id IS NULL
    AND seat_limit_override IS NOT NULL
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY started_at DESC
  LIMIT 1;

  SELECT coalesce(sum(free_posts_granted), 0) INTO v_gratis_acumuladas
  FROM public.company_pricing_assignments
  WHERE company_id = p_company_id
    AND pricing_plan_id IS NULL
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());

  RETURN QUERY SELECT
    'Gratis'::text,
    v_gratis_acumuladas,
    v_seat_override;
END;
$$;

-- =========================================================
-- 4. empresas_con_pendientes_atrasados: reporte tipo admin -> exigir is_admin()
-- =========================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'empresas_con_pendientes_atrasados'
  ) THEN
    -- No se puede reescribir el cuerpo sin conocer su SQL completo aquí;
    -- en su lugar se revoca el acceso directo y queda solo para admin/servicio.
    REVOKE EXECUTE ON FUNCTION public.empresas_con_pendientes_atrasados(integer, integer)
      FROM anon, authenticated;
  END IF;
END $$;

-- =========================================================
-- 5. Funciones de mantenimiento programado (pg_cron): revocar a anon y authenticated
-- =========================================================
REVOKE EXECUTE ON FUNCTION public.auto_resolve_expired_jobs(integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.close_expired_jobs() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deactivate_expired_assignments() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.publish_scheduled_jobs() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.marcar_recordatorio_enviado(uuid) FROM anon, authenticated;

COMMIT;
