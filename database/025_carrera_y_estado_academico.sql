-- =========================================================
-- 025_carrera_y_estado_academico.sql
--
-- En "Formacion Academica" solo se guardaba el NIVEL
-- (Licenciatura, Diversificado, etc.), no el nombre de la
-- carrera/titulo, ni si el candidato ya se graduo, sigue
-- estudiando, o esta en cierre de pensum.
--
-- Idempotente y autocontenido.
-- =========================================================

alter table public.candidate_education
  add column if not exists career_name text,
  add column if not exists status text
    check (status in ('graduado', 'estudiando', 'cierre_pensum'));

comment on column public.candidate_education.career_name is
  'Nombre de la carrera o titulo obtenido, ej. "Administracion de Empresas".';

comment on column public.candidate_education.status is
  'Estado academico: graduado, estudiando, o cierre_pensum.';
