-- =====================================================================
-- 008 - Multi-usuario por empresa
--
--  1. company_members: quienes trabajan el panel de una empresa,
--     con rol dueno / reclutador / observador.
--       - dueno:      todo, incluida la gestion del equipo
--       - reclutador: vacantes, candidatos y entrevistas
--       - observador: solo lectura
--  2. Invitaciones por correo SIN magia: el dueno agrega el correo,
--     la persona se registra (rol empresa) con ESE correo y al entrar
--     su cuenta se conecta sola a la empresa (status invitado->activo).
--  3. Politicas RLS ADICIONALES para que los miembros vean y trabajen
--     los datos de su empresa (las politicas en RLS se suman: las que
--     ya tienes del dueno siguen funcionando igual).
--
-- Seguro de correr mas de una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. Funcion de updated_at automatico
--
-- El 001 la definia, pero nunca se corrio completo en la base viva,
-- asi que la creamos aqui (create or replace = seguro aunque exista).
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- 1. Tabla de miembros
-- ---------------------------------------------------------------------

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),

  company_id uuid not null
    references public.company_profiles(id)
    on delete cascade,

  -- null mientras la invitacion no se reclama
  user_id uuid
    references auth.users(id)
    on delete cascade,

  email text not null,

  role text not null default 'reclutador'
    check (role in ('dueno', 'reclutador', 'observador')),

  status text not null default 'invitado'
    check (status in ('invitado', 'activo')),

  invited_by uuid references auth.users(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un correo solo una vez por empresa
create unique index if not exists company_members_company_email_key
  on public.company_members(company_id, lower(email));

create index if not exists company_members_user_idx
  on public.company_members(user_id);

create index if not exists company_members_company_idx
  on public.company_members(company_id);

-- updated_at automatico (reusa la funcion del 001)
drop trigger if exists set_company_members_updated_at
  on public.company_members;

create trigger set_company_members_updated_at
  before update on public.company_members
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 2. Funcion de membresia (SECURITY DEFINER)
--
-- Evita recursion de RLS y centraliza la pregunta:
-- "¿el usuario actual pertenece a ESTA empresa con ALGUNO
--  de estos roles?"  El dueno del company_profile cuenta
-- como 'dueno' aunque no tenga fila en company_members.
-- ---------------------------------------------------------------------

create or replace function public.is_company_member(
  p_company_id uuid,
  p_roles text[]
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    -- El creador del perfil de empresa siempre es dueno
    exists (
      select 1
      from public.company_profiles c
      where c.id = p_company_id
        and c.user_id = auth.uid()
        and 'dueno' = any(p_roles)
    )
    or
    exists (
      select 1
      from public.company_members m
      where m.company_id = p_company_id
        and m.user_id = auth.uid()
        and m.status = 'activo'
        and m.role = any(p_roles)
    );
$$;

revoke all on function public.is_company_member(uuid, text[]) from public;
grant execute on function public.is_company_member(uuid, text[]) to authenticated;


-- ---------------------------------------------------------------------
-- 3. Backfill: cada empresa existente queda con su dueno como miembro
-- ---------------------------------------------------------------------

insert into public.company_members (company_id, user_id, email, role, status)
select c.id, c.user_id, coalesce(u.email, ''), 'dueno', 'activo'
from public.company_profiles c
join auth.users u on u.id = c.user_id
where not exists (
  select 1
  from public.company_members m
  where m.company_id = c.id
    and m.user_id = c.user_id
);


-- ---------------------------------------------------------------------
-- 4. RLS de company_members
-- ---------------------------------------------------------------------

alter table public.company_members enable row level security;

-- El dueno administra el equipo de SU empresa
drop policy if exists cgt_owner_manages_members
  on public.company_members;

create policy cgt_owner_manages_members
  on public.company_members
  for all
  using (public.is_company_member(company_id, array['dueno']))
  with check (public.is_company_member(company_id, array['dueno']));

-- Cualquier miembro activo VE el equipo de su empresa
drop policy if exists cgt_members_read_team
  on public.company_members;

create policy cgt_members_read_team
  on public.company_members
  for select
  using (
    public.is_company_member(
      company_id,
      array['dueno', 'reclutador', 'observador']
    )
  );

-- La persona invitada VE su propia invitacion (por correo)
drop policy if exists cgt_invitee_reads_own_invitation
  on public.company_members;

create policy cgt_invitee_reads_own_invitation
  on public.company_members
  for select
  using (
    user_id is null
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- La persona invitada RECLAMA su invitacion: conecta su cuenta
drop policy if exists cgt_invitee_claims_invitation
  on public.company_members;

create policy cgt_invitee_claims_invitation
  on public.company_members
  for update
  using (
    user_id is null
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  with check (
    user_id = auth.uid()
    and status = 'activo'
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );


-- ---------------------------------------------------------------------
-- 5. Politicas ADICIONALES para miembros (se suman a las del dueno)
--
-- Lectura: dueno + reclutador + observador
-- Escritura: dueno + reclutador
-- ---------------------------------------------------------------------

-- ===== jobs =====
-- (No tocamos enable/disable de RLS en jobs: solo agregamos
--  politicas; si RLS esta activo, estas abren el paso al equipo.)

drop policy if exists cgt_members_read_company_jobs on public.jobs;

create policy cgt_members_read_company_jobs
  on public.jobs
  for select
  using (
    public.is_company_member(
      company_id,
      array['dueno', 'reclutador', 'observador']
    )
  );

drop policy if exists cgt_members_insert_company_jobs on public.jobs;

create policy cgt_members_insert_company_jobs
  on public.jobs
  for insert
  with check (
    public.is_company_member(company_id, array['dueno', 'reclutador'])
  );

drop policy if exists cgt_members_update_company_jobs on public.jobs;

create policy cgt_members_update_company_jobs
  on public.jobs
  for update
  using (
    public.is_company_member(company_id, array['dueno', 'reclutador'])
  )
  with check (
    public.is_company_member(company_id, array['dueno', 'reclutador'])
  );

-- ===== applications =====

drop policy if exists cgt_members_read_company_applications
  on public.applications;

create policy cgt_members_read_company_applications
  on public.applications
  for select
  using (
    exists (
      select 1
      from public.jobs j
      where j.id = applications.job_id
        and public.is_company_member(
          j.company_id,
          array['dueno', 'reclutador', 'observador']
        )
    )
  );

drop policy if exists cgt_members_update_company_applications
  on public.applications;

create policy cgt_members_update_company_applications
  on public.applications
  for update
  using (
    exists (
      select 1
      from public.jobs j
      where j.id = applications.job_id
        and public.is_company_member(
          j.company_id, array['dueno', 'reclutador']
        )
    )
  )
  with check (
    exists (
      select 1
      from public.jobs j
      where j.id = applications.job_id
        and public.is_company_member(
          j.company_id, array['dueno', 'reclutador']
        )
    )
  );

-- ===== candidate_profiles (solo lectura de postulantes) =====

drop policy if exists cgt_members_read_applicant_profiles
  on public.candidate_profiles;

create policy cgt_members_read_applicant_profiles
  on public.candidate_profiles
  for select
  using (
    exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.candidate_profile_id = candidate_profiles.id
        and public.is_company_member(
          j.company_id,
          array['dueno', 'reclutador', 'observador']
        )
    )
  );

-- ===== application_status_history =====

drop policy if exists cgt_members_read_history
  on public.application_status_history;

create policy cgt_members_read_history
  on public.application_status_history
  for select
  using (
    exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.id = application_status_history.application_id
        and public.is_company_member(
          j.company_id,
          array['dueno', 'reclutador', 'observador']
        )
    )
  );

drop policy if exists cgt_members_insert_history
  on public.application_status_history;

create policy cgt_members_insert_history
  on public.application_status_history
  for insert
  with check (
    exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.id = application_status_history.application_id
        and public.is_company_member(
          j.company_id, array['dueno', 'reclutador']
        )
    )
  );

-- ===== company_profiles (los miembros LEEN el perfil de su empresa) =====

drop policy if exists cgt_members_read_company_profile
  on public.company_profiles;

create policy cgt_members_read_company_profile
  on public.company_profiles
  for select
  using (
    public.is_company_member(
      id,
      array['dueno', 'reclutador', 'observador']
    )
  );
