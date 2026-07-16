-- =====================================================================
-- 038 - Permitir 'scheduled' en jobs.status
--
-- La restriccion jobs_status_check (creada directo en Supabase, no
-- via migracion) no incluia 'scheduled' entre los valores validos.
-- Se recrea con la lista completa.
--
-- Segura de correr mas de una vez.
-- =====================================================================

alter table public.jobs
  drop constraint if exists jobs_status_check;

alter table public.jobs
  add constraint jobs_status_check
  check (
    status in ('draft', 'scheduled', 'published', 'paused', 'closed')
  );
