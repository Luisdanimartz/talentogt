-- =====================================================================
-- 003 - Campos de CV del candidato
--
-- Agrega a candidate_profiles los campos de formacion, experiencia
-- y habilidades que el formulario "Mi Perfil Profesional" tenia
-- marcados como "Proximamente". Con estos datos se calculan las
-- coincidencias candidato-vacante (la afinidad).
--
-- Seguro de correr: "add column if not exists" no toca nada
-- que ya exista, y las politicas RLS actuales ya cubren estas
-- columnas (protegen la fila completa).
-- =====================================================================

alter table public.candidate_profiles
  add column if not exists education_level text,
  add column if not exists education_institution text,
  add column if not exists education_year text,
  add column if not exists experience text,
  add column if not exists skills text;

-- Notas:
--  - education_level guarda el NOMBRE del nivel (del catalogo
--    education_levels), como texto.
--  - skills guarda habilidades separadas por coma:
--    "Excel, SAP, Ventas, Liderazgo"
--  - experience es texto libre del candidato.
