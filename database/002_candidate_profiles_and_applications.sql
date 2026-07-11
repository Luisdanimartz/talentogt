-- =====================================================================
-- 002 - Perfiles de candidato y postulaciones
--
-- Las tablas candidate_profiles y applications ya existen en Supabase
-- (se crearon desde el panel). Este archivo deja documentado su
-- esquema real y agrega lo que faltaba:
--
--   1. El arreglo del foreign key de candidate_profiles.user_id
--      (apuntaba a public.users en vez de auth.users) - YA APLICADO
--      el 11/07/2026 desde el SQL Editor.
--
--   2. Las políticas RLS para que la EMPRESA pueda ver las
--      postulaciones a sus vacantes y cambiar su estado.
--
-- Este archivo es seguro de correr aunque ya exista todo:
-- usa "if not exists" y "drop policy if exists".
-- =====================================================================


-- ---------------------------------------------------------------------
-- ESQUEMA REAL (referencia - las tablas ya existen)
-- ---------------------------------------------------------------------
-- candidate_profiles:
--   id                uuid pk
--   user_id           uuid -> auth.users(id) on delete cascade (unico)
--   first_name        text
--   middle_name       text
--   last_name         text
--   second_last_name  text
--   phone             text
--   dpi               text
--   profession        text
--   department        text   (nombre, no id)
--   municipality      text   (nombre, no id)
--   address           text
--   birth_date        date
--   created_at        timestamptz
--   updated_at        timestamptz
--
-- applications:
--   id                    uuid pk
--   job_id                uuid -> jobs(id)
--   candidate_profile_id  uuid -> candidate_profiles(id)
--   current_status        text  (applied | reviewing | interview |
--                                hired | rejected)
--   applied_at            timestamptz
--   created_at            timestamptz
--   updated_at            timestamptz
-- ---------------------------------------------------------------------


-- ---------------------------------------------------------------------
-- 1. Arreglo del foreign key (idempotente: solo actua si hace falta)
-- ---------------------------------------------------------------------

do $$
begin

  if exists (
    select 1
    from pg_constraint
    where conname = 'candidate_profiles_user_id_fkey'
      and conrelid = 'public.candidate_profiles'::regclass
      and confrelid <> 'auth.users'::regclass
  ) then

    alter table public.candidate_profiles
      drop constraint candidate_profiles_user_id_fkey;

    alter table public.candidate_profiles
      add constraint candidate_profiles_user_id_fkey
      foreign key (user_id) references auth.users(id)
      on delete cascade;

  end if;

end $$;


-- Evita perfiles duplicados por usuario (necesario para el upsert)
create unique index if not exists candidate_profiles_user_id_key
  on public.candidate_profiles(user_id);


-- ---------------------------------------------------------------------
-- 2. Politicas RLS
--
-- Todas usan nombres propios "cgt_..." y drop previo, asi que no
-- chocan con politicas que ya tengas: en RLS las politicas se SUMAN
-- (con que una permita, pasa).
-- ---------------------------------------------------------------------

alter table public.candidate_profiles enable row level security;
alter table public.applications enable row level security;


-- ===== candidate_profiles =====

-- El candidato administra SU propio perfil
drop policy if exists cgt_candidate_manages_own_profile
  on public.candidate_profiles;

create policy cgt_candidate_manages_own_profile
  on public.candidate_profiles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- La empresa puede LEER los perfiles de quienes se postularon
-- a alguna de sus vacantes (solo lectura)
drop policy if exists cgt_company_reads_applicant_profiles
  on public.candidate_profiles;

create policy cgt_company_reads_applicant_profiles
  on public.candidate_profiles
  for select
  using (
    exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      join public.company_profiles c on c.id = j.company_id
      where a.candidate_profile_id = candidate_profiles.id
        and c.user_id = auth.uid()
    )
  );


-- ===== applications =====

-- El candidato crea y ve SUS postulaciones
drop policy if exists cgt_candidate_inserts_own_application
  on public.applications;

create policy cgt_candidate_inserts_own_application
  on public.applications
  for insert
  with check (
    exists (
      select 1
      from public.candidate_profiles p
      where p.id = applications.candidate_profile_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists cgt_candidate_reads_own_applications
  on public.applications;

create policy cgt_candidate_reads_own_applications
  on public.applications
  for select
  using (
    exists (
      select 1
      from public.candidate_profiles p
      where p.id = applications.candidate_profile_id
        and p.user_id = auth.uid()
    )
  );

-- La empresa ve las postulaciones a SUS vacantes
drop policy if exists cgt_company_reads_own_job_applications
  on public.applications;

create policy cgt_company_reads_own_job_applications
  on public.applications
  for select
  using (
    exists (
      select 1
      from public.jobs j
      join public.company_profiles c on c.id = j.company_id
      where j.id = applications.job_id
        and c.user_id = auth.uid()
    )
  );

-- La empresa actualiza el estado de las postulaciones a SUS vacantes
drop policy if exists cgt_company_updates_own_job_applications
  on public.applications;

create policy cgt_company_updates_own_job_applications
  on public.applications
  for update
  using (
    exists (
      select 1
      from public.jobs j
      join public.company_profiles c on c.id = j.company_id
      where j.id = applications.job_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.jobs j
      join public.company_profiles c on c.id = j.company_id
      where j.id = applications.job_id
        and c.user_id = auth.uid()
    )
  );
