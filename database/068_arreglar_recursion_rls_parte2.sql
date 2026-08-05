-- 068_arreglar_recursion_rls_parte2.sql
-- Continuación de 067: quedaban DOS políticas más en `applications`, existentes
-- desde antes de mis cambios (no las escribí yo), que consultan candidate_profiles
-- directamente en línea:
--
--   - cgt_candidate_inserts_own_application (INSERT) — al candidato aplicar a una vacante
--   - cgt_candidate_withdraws_own_application (UPDATE) — al candidato retirar su postulación
--
-- Antes de la migración 063, `applications` tenía RLS deshabilitado por completo,
-- así que estas políticas nunca se evaluaban y el ciclo con candidate_profiles
-- (que consulta applications en cgt_members_read_applicant_profiles) nunca se
-- activaba. Al habilitar RLS en 063, las tres políticas empezaron a evaluarse
-- juntas y crearon el mismo ciclo que ya corregimos en 067, pero por estas dos
-- rutas adicionales — por eso el error apareció esta vez al actualizar el estado
-- de una postulación (UPDATE), no solo al leer el perfil.
--
-- Se aplica el mismo patrón ya usado en 067 y en el resto del código
-- (is_admin(), is_company_member()): mover la verificación a una función
-- SECURITY DEFINER en vez de una subconsulta en línea.

BEGIN;

-- Variante de cgt_is_own_candidate_profile (de la 067) que además exige que
-- el perfil no esté suspendido — necesaria para el INSERT.
CREATE OR REPLACE FUNCTION public.cgt_is_own_active_candidate_profile(p_candidate_profile_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.candidate_profiles p
    WHERE p.id = p_candidate_profile_id
      AND p.user_id = auth.uid()
      AND COALESCE(p.status, 'activa') <> 'suspendida'
  );
$$;

-- 1. INSERT: el candidato aplica a una vacante
DROP POLICY IF EXISTS cgt_candidate_inserts_own_application ON public.applications;

CREATE POLICY cgt_candidate_inserts_own_application
ON public.applications
FOR INSERT
TO public
WITH CHECK (public.cgt_is_own_active_candidate_profile(candidate_profile_id));

-- 2. UPDATE: el candidato retira su propia postulación
DROP POLICY IF EXISTS cgt_candidate_withdraws_own_application ON public.applications;

CREATE POLICY cgt_candidate_withdraws_own_application
ON public.applications
FOR UPDATE
TO public
USING (public.cgt_is_own_candidate_profile(candidate_profile_id))
WITH CHECK (public.cgt_is_own_candidate_profile(candidate_profile_id));

COMMIT;
