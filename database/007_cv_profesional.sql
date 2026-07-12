-- =====================================================================
-- 007 - CV profesional (nivel ejecutivo)
--
-- Campos para que el perfil genere un CV como el de un profesional
-- con trayectoria:
--   - summary: parrafo "Perfil Profesional" (tambien alimenta las
--     coincidencias ATS)
--   - linkedin y availability: linea de contacto completa
--   - candidate_experience.period: "Junio 2024 - Junio 2026"
--   - candidate_experience.description: logros del puesto
--     (uno por linea -> vinetas en el CV)
--
-- Seguro de correr mas de una vez. Las politicas RLS existentes
-- ya cubren estas columnas.
-- =====================================================================

alter table public.candidate_profiles
  add column if not exists summary text,
  add column if not exists linkedin text,
  add column if not exists availability text;

alter table public.candidate_experience
  add column if not exists period text,
  add column if not exists description text;
