-- 064_enable_rls_remaining_tables.sql
-- Habilita RLS en las 10 tablas restantes detectadas sin policies por Security Advisor.
--
-- Verificado contra el código real (src/services, src/lib, src/pages) antes de escribir
-- esto: `users`, `notifications`, `documents`, `application_tasks` y `application_statuses`
-- NO se usan en ninguna parte de la aplicación (0 resultados en .from(...) sobre esos
-- nombres). `public.users` es un resto de una versión anterior del esquema (ver
-- comentario en 002_candidate_profiles_and_applications.sql: la FK apuntaba a
-- public.users antes de migrar a auth.users). Los estados de postulación están
-- hardcodeados en src/utils/applicationStatus.js, no leídos de application_statuses.
--
-- Por eso, en vez de inventar policies para funciones que no existen, estas 5 tablas
-- se cierran por completo (solo admin). Si en el futuro activas alguna función real
-- sobre ellas (notificaciones in-app, subida de documentos, tareas internas), se
-- agregan las policies específicas en ese momento, cuando se sepa el comportamiento real.
--
-- Grupo A (catálogos usados activamente por la app, confirmado en el código):
--   departments, municipalities, education_levels, employment_types, job_categories
--   -> lectura pública, escritura solo admin
--
-- Grupo B (tablas sin uso confirmado en el código — se cierran, solo admin):
--   users, notifications, documents, application_tasks, application_statuses

BEGIN;

-- =========================================================
-- GRUPO A — Catálogos usados activamente por la app
-- =========================================================

CREATE POLICY cgt_public_reads_departments
ON public.departments FOR SELECT TO public USING (true);

CREATE POLICY cgt_public_reads_municipalities
ON public.municipalities FOR SELECT TO public USING (true);

CREATE POLICY cgt_public_reads_education_levels
ON public.education_levels FOR SELECT TO public USING (true);

CREATE POLICY cgt_public_reads_employment_types
ON public.employment_types FOR SELECT TO public USING (true);

CREATE POLICY cgt_public_reads_job_categories
ON public.job_categories FOR SELECT TO public USING (true);

CREATE POLICY cgt_admin_writes_departments
ON public.departments FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY cgt_admin_writes_municipalities
ON public.municipalities FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY cgt_admin_writes_education_levels
ON public.education_levels FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY cgt_admin_writes_employment_types
ON public.employment_types FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY cgt_admin_writes_job_categories
ON public.job_categories FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_categories ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- GRUPO B — Tablas sin uso confirmado en el código: cerradas (solo admin)
-- =========================================================

CREATE POLICY cgt_admin_only_users
ON public.users FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY cgt_admin_only_notifications
ON public.notifications FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY cgt_admin_only_documents
ON public.documents FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY cgt_admin_only_application_tasks
ON public.application_tasks FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY cgt_admin_only_application_statuses
ON public.application_statuses FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_statuses ENABLE ROW LEVEL SECURITY;

COMMIT;
