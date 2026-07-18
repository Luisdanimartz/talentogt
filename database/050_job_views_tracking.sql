-- =====================================================
-- Migración 050: Tracking de vistas de vacantes
-- Self-contained: incluye set_updated_at() por si 001 no corrió
-- =====================================================

-- Función auxiliar (self-contained, igual que en migraciones previas)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabla de vistas de vacantes
CREATE TABLE IF NOT EXISTS job_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- null si es anónimo
  session_hash TEXT, -- hash de sesión/IP para evitar contar refresh como nueva vista
  view_day DATE NOT NULL DEFAULT (timezone('utc', now()))::date, -- columna normal, no expresión, para el índice de dedupe
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_views_job_id ON job_views(job_id);
CREATE INDEX IF NOT EXISTS idx_job_views_created_at ON job_views(created_at);

-- Evita contar múltiples vistas de la misma sesión en la misma vacante el mismo día
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_views_dedupe
  ON job_views(job_id, session_hash, view_day)
  WHERE session_hash IS NOT NULL;

-- RLS: cualquiera puede insertar una vista (es anónimo/público)
ALTER TABLE job_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede registrar una vista"
  ON job_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Solo admins pueden leer vistas directamente"
  ON job_views FOR SELECT
  USING (public.is_admin());

-- Función para registrar una vista (llamada desde el frontend al cargar el detalle)
CREATE OR REPLACE FUNCTION register_job_view(
  p_job_id UUID,
  p_session_hash TEXT
)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO job_views (job_id, viewer_id, session_hash)
  VALUES (p_job_id, auth.uid(), p_session_hash)
  ON CONFLICT DO NOTHING; -- respeta el índice de dedupe diario
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION register_job_view(UUID, TEXT) TO anon, authenticated;

-- Función para el admin panel: vistas vs aplicaciones por vacante
CREATE OR REPLACE FUNCTION admin_job_views_vs_applications(
  p_company_id UUID DEFAULT NULL -- opcional: filtrar por empresa
)
RETURNS TABLE (
  job_id UUID,
  job_title TEXT,
  company_name TEXT,
  total_views BIGINT,
  total_applications BIGINT,
  conversion_rate NUMERIC,
  created_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo admins pueden ejecutar esta función
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  RETURN QUERY
  SELECT
    j.id AS job_id,
    j.title AS job_title,
    c.company_name AS company_name,
    COUNT(DISTINCT jv.id) AS total_views,
    COUNT(DISTINCT a.id) AS total_applications,
    CASE
      WHEN COUNT(DISTINCT jv.id) = 0 THEN 0
      ELSE ROUND(COUNT(DISTINCT a.id)::NUMERIC / COUNT(DISTINCT jv.id) * 100, 1)
    END AS conversion_rate,
    j.created_at
  FROM jobs j
  LEFT JOIN company_profiles c ON c.id = j.company_id
  LEFT JOIN job_views jv ON jv.job_id = j.id
  LEFT JOIN applications a ON a.job_id = j.id
  WHERE (p_company_id IS NULL OR j.company_id = p_company_id)
  GROUP BY j.id, j.title, c.company_name, j.created_at
  ORDER BY j.created_at DESC;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION admin_job_views_vs_applications(UUID) TO authenticated;
