-- =====================================================================
-- 035 - Experiencia, tipo de contrato y "urgente" en vacantes
--
-- "Tipo de empleo" (employment_type_id, tiempo completo / medio
-- tiempo / por horas) YA EXISTIA en el formulario de publicar
-- vacante, pero nunca se le exponia al candidato en el listado
-- publico -- eso se corrige en el codigo (getPublishedJobs), no aqui.
--
-- Lo que SI es nuevo, 3 columnas:
--   - experience_level: experiencia requerida (sin_experiencia, 1,
--     2, 3, 4, 5_10, mas_10).
--   - contract_type: indefinido | determinado.
--   - is_urgent: la empresa puede marcar la vacante como urgente
--     (como "Se precisa Urgente" en Computrabajo).
--
-- Segura de correr mas de una vez.
-- =====================================================================

alter table public.jobs
  add column if not exists experience_level text,
  add column if not exists contract_type text,
  add column if not exists is_urgent boolean not null default false;

-- Valida los valores permitidos (si ya existen filas con datos
-- invalidos esto fallaria -- no deberia pasar porque son columnas
-- nuevas, todas arrancan en null/false).

alter table public.jobs
  drop constraint if exists jobs_experience_level_check;

alter table public.jobs
  add constraint jobs_experience_level_check
  check (
    experience_level is null
    or experience_level in ('sin_experiencia', '1', '2', '3', '4', '5_10', 'mas_10')
  );

alter table public.jobs
  drop constraint if exists jobs_contract_type_check;

alter table public.jobs
  add constraint jobs_contract_type_check
  check (
    contract_type is null
    or contract_type in ('indefinido', 'determinado')
  );
