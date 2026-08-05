-- 067_arreglar_recursion_rls.sql
-- CORRIGE UN BUG introducido en 063: la política cgt_candidate_reads_own_applications
-- (en la tabla applications) consultaba directamente candidate_profiles por dentro.
-- Pero candidate_profiles YA tenía una política (cgt_members_read_applicant_profiles,
-- anterior a mis cambios) que consulta applications por dentro. Esto crea un ciclo:
--
--   leer candidate_profiles -> evalúa política que consulta applications
--     -> leer applications -> evalúa política que consulta candidate_profiles
--       -> leer candidate_profiles -> ... (recursión infinita)
--
-- Postgres lo detecta y lanza "infinite recursion detected in policy for relation
-- candidate_profiles", que Supabase/PostgREST devuelve como 500 Internal Server Error.
-- Esto rompía el dashboard del candidato (parecía que el perfil había desaparecido,
-- pero en realidad la consulta nunca llegaba a completarse).
--
-- LA CORRECCIÓN: seguir el mismo patrón que ya usa el resto del código (is_admin(),
-- is_company_member()) — mover la verificación a una función SECURITY DEFINER, que
-- no vuelve a disparar RLS de las tablas que consulta por dentro. Así se rompe el ciclo.

BEGIN;

-- Función helper SECURITY DEFINER: ¿este candidate_profile_id le pertenece
-- al usuario autenticado actual?
CREATE OR REPLACE FUNCTION public.cgt_is_own_candidate_profile(p_candidate_profile_id uuid)
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
  );
$$;

-- Reemplazar la política de applications para usar la función en vez de la
-- subconsulta directa a candidate_profiles
DROP POLICY IF EXISTS cgt_candidate_reads_own_applications ON public.applications;

CREATE POLICY cgt_candidate_reads_own_applications
ON public.applications
FOR SELECT
TO public
USING (public.cgt_is_own_candidate_profile(candidate_profile_id));

COMMIT;
