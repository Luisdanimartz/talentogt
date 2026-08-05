-- 065_hardening_advertencias.sql
-- Cierra las advertencias (WARN) accionables del Security Advisor, verificadas
-- contra el código real del proyecto antes de escribir esto:
--
-- 1. 37/38 funciones admin_* SÍ verifican is_admin() internamente (confirmado
--    leyendo cada definición). No son un hueco explotable, pero por defensa en
--    profundidad se revoca EXECUTE a `anon` en todas — nadie no autenticado
--    debería poder ni intentar llamarlas.
--
-- 2. `function_search_path_mutable`: se fija search_path=public en TODAS las
--    funciones del esquema public que no lo tengan, dinámicamente (no depende
--    de listar nombres a mano, cubre funciones actuales y evita repetir esto
--    si se te olvida poner `set search_path` en una función nueva).
--
-- NO se toca (verificado como diseño intencional en el código):
--   - job_views: INSERT abierto a cualquiera es a propósito (tracking anónimo
--     de vistas, ver comentario en 050_job_views_tracking.sql).
--   - bucket company-logos: listado público es a propósito (logos públicos,
--     ver 015_logo_empresa.sql).
--
-- NO se resuelve aquí (hay que hacerlo manual en el dashboard, no es SQL):
--   - auth_leaked_password_protection: Supabase Dashboard → Authentication →
--     Policies → Password Security → activar "Leaked password protection".
--
-- Pendiente de tu confirmación antes de tocar (no incluido en este script):
--   - admin_get_current_assignment: existe en producción pero no está en
--     ninguna migración tracked. Antes de asumir que también tiene el check
--     de is_admin(), corre y confirma:
--       SELECT pg_get_functiondef(oid) FROM pg_proc
--       WHERE proname = 'admin_get_current_assignment';

BEGIN;

-- =========================================================
-- 1. Revocar EXECUTE a `anon` en todas las funciones admin_*
-- =========================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND p.proname LIKE 'admin\_%' ESCAPE '\'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM anon', r.proname, r.args);
  END LOOP;
END $$;

-- =========================================================
-- 2. Fijar search_path=public en todas las funciones que lo tengan mutable
-- =========================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND NOT EXISTS (
        SELECT 1 FROM unnest(COALESCE(p.proconfig, '{}')) cfg
        WHERE cfg LIKE 'search_path=%'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public', r.proname, r.args);
  END LOOP;
END $$;

COMMIT;
