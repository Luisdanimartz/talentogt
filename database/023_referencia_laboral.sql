-- =========================================================
-- 023_referencia_laboral.sql
--
-- Agrega un telefono de referencia laboral (opcional) a
-- cada experiencia del candidato. Ya existia el nombre de
-- la empresa; esto le da al reclutador un contacto directo
-- para verificar la referencia si lo necesita.
--
-- Idempotente y autocontenido: se puede correr solo.
-- =========================================================

alter table public.candidate_experience
  add column if not exists reference_phone text;

comment on column public.candidate_experience.reference_phone is
  'Telefono de contacto (jefe/RRHH) para verificar la referencia laboral. Opcional.';
