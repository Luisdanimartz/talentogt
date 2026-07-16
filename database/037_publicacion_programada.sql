-- =====================================================================
-- 037 - Publicar vacante en una fecha/hora programada
--
-- Antes: al crear una vacante, se publicaba de inmediato siempre.
-- Ahora la empresa puede elegir una fecha y hora futura; la vacante
-- queda con status = 'scheduled' hasta que llega ese momento, y una
-- tarea automática (pg_cron) la publica sola, sin que nadie tenga
-- que entrar a hacer clic.
--
-- IMPORTANTE - requiere la extension pg_cron habilitada en tu
-- proyecto de Supabase. Este archivo intenta habilitarla con
-- "create extension" (funciona en la mayoria de proyectos), pero si
-- te marca error en esa linea especifica, ve a Supabase ->
-- Database -> Extensions, busca "pg_cron", actívala desde ahí, y
-- vuelve a correr el resto del archivo (es seguro repetirlo).
--
-- Requiere 013 (is_admin) para nada en particular; independiente.
-- Segura de correr mas de una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Columna nueva: cuándo debe publicarse
-- ---------------------------------------------------------------------

alter table public.jobs
  add column if not exists scheduled_publish_at timestamptz;


-- ---------------------------------------------------------------------
-- 2. Función que publica las vacantes cuyo momento ya llegó
-- ---------------------------------------------------------------------

create or replace function public.publish_scheduled_jobs()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin

  update public.jobs
  set
    status = 'published',
    published_at = scheduled_publish_at
  where status = 'scheduled'
    and scheduled_publish_at is not null
    and scheduled_publish_at <= now();

end;
$$;


-- ---------------------------------------------------------------------
-- 3. Tarea automática: revisa cada 5 minutos
-- ---------------------------------------------------------------------

create extension if not exists pg_cron;

select cron.unschedule('publish-scheduled-jobs')
where exists (
  select 1 from cron.job where jobname = 'publish-scheduled-jobs'
);

select cron.schedule(
  'publish-scheduled-jobs',
  '*/5 * * * *',
  $$select public.publish_scheduled_jobs();$$
);
