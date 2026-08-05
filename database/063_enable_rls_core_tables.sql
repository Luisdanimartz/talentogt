-- 063_enable_rls_core_tables.sql
-- Habilita RLS en applications, candidate_profiles, company_profiles y jobs
-- Agrega las policies que faltaban para no romper el acceso legítimo de candidatos/empresas
--
-- Contexto: Supabase Security Advisor detectó estas 4 tablas con policies existentes
-- pero RLS deshabilitado (rls_disabled_in_public / policy_exists_rls_disabled).
-- Antes de activar RLS se agregan las policies faltantes para que:
--   - El público/candidatos puedan ver vacantes publicadas
--   - El candidato pueda leer y editar su propio perfil
--   - El candidato pueda ver el estado de sus propias postulaciones
--   - El dueño de una empresa pueda editar el perfil de su propia empresa

BEGIN;

-- 1. Público y candidatos pueden ver vacantes publicadas
CREATE POLICY cgt_public_reads_published_jobs
ON public.jobs
FOR SELECT
TO public
USING (status = 'published');

-- 2. El candidato puede leer su propio perfil
CREATE POLICY cgt_candidate_reads_own_profile
ON public.candidate_profiles
FOR SELECT
TO public
USING (user_id = auth.uid());

-- 3. El candidato puede editar su propio perfil
CREATE POLICY cgt_candidate_updates_own_profile
ON public.candidate_profiles
FOR UPDATE
TO public
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 4. El candidato puede ver el estado de SUS propias postulaciones
CREATE POLICY cgt_candidate_reads_own_applications
ON public.applications
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM candidate_profiles p
    WHERE p.id = applications.candidate_profile_id
      AND p.user_id = auth.uid()
  )
);

-- 5. El dueño de la empresa puede editar el perfil de su propia empresa
CREATE POLICY cgt_owner_updates_own_company
ON public.company_profiles
FOR UPDATE
TO public
USING (is_company_member(id, ARRAY['dueno']))
WITH CHECK (is_company_member(id, ARRAY['dueno']));

-- 6. Activar RLS en las 4 tablas
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

COMMIT;
