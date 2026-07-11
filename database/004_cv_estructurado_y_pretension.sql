-- =====================================================================
-- 004 - CV estructurado y pretension salarial
--
--  1. candidate_education: hasta varias formaciones por candidato
--     (nivel, centro, anio de graduacion).
--  2. candidate_experience: experiencias como en un CV real
--     (cargo, empresa, anios laborados).
--  3. expected_salary en candidate_profiles: pretension salarial
--     para comparar contra el rango de cada vacante.
--
-- Con RLS igual que el resto: el candidato administra lo suyo,
-- la empresa solo LEE lo de quienes se postularon a sus vacantes.
-- Seguro de correr mas de una vez.
-- =====================================================================

-- Pretension salarial (numero, en quetzales)
alter table public.candidate_profiles
  add column if not exists expected_salary numeric;

-- ---------------------------------------------------------------------
-- Formacion academica (varias filas por candidato)
-- ---------------------------------------------------------------------

create table if not exists public.candidate_education (
  id uuid primary key default gen_random_uuid(),

  candidate_profile_id uuid not null
    references public.candidate_profiles(id)
    on delete cascade,

  level text,
  institution text,
  graduation_year text,

  created_at timestamptz not null default now()
);

create index if not exists candidate_education_profile_idx
  on public.candidate_education(candidate_profile_id);

-- ---------------------------------------------------------------------
-- Experiencia laboral (varias filas por candidato)
-- ---------------------------------------------------------------------

create table if not exists public.candidate_experience (
  id uuid primary key default gen_random_uuid(),

  candidate_profile_id uuid not null
    references public.candidate_profiles(id)
    on delete cascade,

  job_title text,
  company text,
  years text,

  created_at timestamptz not null default now()
);

create index if not exists candidate_experience_profile_idx
  on public.candidate_experience(candidate_profile_id);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------

alter table public.candidate_education enable row level security;
alter table public.candidate_experience enable row level security;

-- Candidato administra su propia formacion
drop policy if exists cgt_candidate_manages_own_education
  on public.candidate_education;

create policy cgt_candidate_manages_own_education
  on public.candidate_education
  for all
  using (
    exists (
      select 1 from public.candidate_profiles p
      where p.id = candidate_education.candidate_profile_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.candidate_profiles p
      where p.id = candidate_education.candidate_profile_id
        and p.user_id = auth.uid()
    )
  );

-- Empresa lee la formacion de sus postulantes
drop policy if exists cgt_company_reads_applicant_education
  on public.candidate_education;

create policy cgt_company_reads_applicant_education
  on public.candidate_education
  for select
  using (
    exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      join public.company_profiles c on c.id = j.company_id
      where a.candidate_profile_id = candidate_education.candidate_profile_id
        and c.user_id = auth.uid()
    )
  );

-- Candidato administra su propia experiencia
drop policy if exists cgt_candidate_manages_own_experience
  on public.candidate_experience;

create policy cgt_candidate_manages_own_experience
  on public.candidate_experience
  for all
  using (
    exists (
      select 1 from public.candidate_profiles p
      where p.id = candidate_experience.candidate_profile_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.candidate_profiles p
      where p.id = candidate_experience.candidate_profile_id
        and p.user_id = auth.uid()
    )
  );

-- Empresa lee la experiencia de sus postulantes
drop policy if exists cgt_company_reads_applicant_experience
  on public.candidate_experience;

create policy cgt_company_reads_applicant_experience
  on public.candidate_experience
  for select
  using (
    exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      join public.company_profiles c on c.id = j.company_id
      where a.candidate_profile_id = candidate_experience.candidate_profile_id
        and c.user_id = auth.uid()
    )
  );
