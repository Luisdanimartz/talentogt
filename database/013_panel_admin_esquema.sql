-- =====================================================================
-- 013 - Panel de administrador: esquema base
--
--  1. is_admin(): helper SECURITY DEFINER (mismo patron que
--     is_company_member) para no repetir el chequeo de rol en
--     cada politica.
--
--  2. company_profiles.status: OJO - esta columna YA EXISTE en la
--     base viva (se ve en companyService.js) pero nunca se le puso
--     valor en ningun flujo. La normalizamos: todo lo que no sea
--     'activa' o 'suspendida' pasa a 'activa' (nadie estaba dado
--     de baja hasta hoy, no existia panel para hacerlo).
--
--  3. company_profiles.plan: columna NUEVA ('gratis' | 'vip').
--
--  4. candidate_profiles.status: columna NUEVA ('activa' |
--     'suspendida'). Un candidato suspendido no puede postularse
--     a vacantes nuevas (se ajusta la politica de insert de
--     applications), pero conserva su historial.
--
--  5. RLS: el admin puede LEER y ACTUALIZAR company_profiles,
--     candidate_profiles y jobs; LEER applications; LEER y
--     ACTUALIZAR profiles (para asignar el rol admin a alguien mas).
--
-- Seguro de correr mas de una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. is_admin()
-- ---------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  -- La tabla public.profiles del 001 nunca se creo de verdad en la
  -- base viva (mismo caso que otras veces). El rol de cada usuario
  -- vive UNICAMENTE en auth.users.raw_user_meta_data ->> 'role'
  -- (asi lo guarda registerUser y asi lo lee handlePostLoginRedirect
  -- y ProtectedRoute) - por eso is_admin() solo revisa esa fuente.
  select exists (
    select 1
    from auth.users u
    where u.id = auth.uid()
      and u.raw_user_meta_data ->> 'role' = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;


-- ---------------------------------------------------------------------
-- 2. company_profiles.status (normalizar la existente)
-- ---------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'company_profiles'
      and column_name = 'status'
  ) then
    alter table public.company_profiles add column status text;
  end if;
end $$;

-- OJO: si ya existia una regla con este mismo nombre (por ejemplo,
-- creada a mano en el editor de tablas de Supabase con otra lista
-- de valores, como 'pending'/'approved'), hay que quitarla PRIMERO
-- - si no, el UPDATE de abajo (que pone 'activa') choca contra
-- esa regla vieja, que no conoce el valor 'activa'.
alter table public.company_profiles
  drop constraint if exists company_profiles_status_check;

update public.company_profiles
set status = 'activa'
where status is null
   or status not in ('activa', 'suspendida');

alter table public.company_profiles alter column status set default 'activa';
alter table public.company_profiles alter column status set not null;

alter table public.company_profiles
  add constraint company_profiles_status_check
  check (status in ('activa', 'suspendida'));


-- ---------------------------------------------------------------------
-- 3. company_profiles.plan (nueva)
-- ---------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'company_profiles'
      and column_name = 'plan'
  ) then
    alter table public.company_profiles
      add column plan text not null default 'gratis';
  end if;
end $$;

alter table public.company_profiles
  drop constraint if exists company_profiles_plan_check;

alter table public.company_profiles
  add constraint company_profiles_plan_check
  check (plan in ('gratis', 'vip'));


-- ---------------------------------------------------------------------
-- 4. candidate_profiles.status (nueva)
-- ---------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'candidate_profiles'
      and column_name = 'status'
  ) then
    alter table public.candidate_profiles
      add column status text not null default 'activa';
  end if;
end $$;

alter table public.candidate_profiles
  drop constraint if exists candidate_profiles_status_check;

update public.candidate_profiles
set status = 'activa'
where status is null
   or status not in ('activa', 'suspendida');

alter table public.candidate_profiles
  add constraint candidate_profiles_status_check
  check (status in ('activa', 'suspendida'));


-- ---------------------------------------------------------------------
-- 5. RLS para el admin
-- ---------------------------------------------------------------------

-- company_profiles
drop policy if exists cgt_admin_reads_companies on public.company_profiles;
create policy cgt_admin_reads_companies
  on public.company_profiles
  for select
  using (public.is_admin());

drop policy if exists cgt_admin_updates_companies on public.company_profiles;
create policy cgt_admin_updates_companies
  on public.company_profiles
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- candidate_profiles
drop policy if exists cgt_admin_reads_candidates on public.candidate_profiles;
create policy cgt_admin_reads_candidates
  on public.candidate_profiles
  for select
  using (public.is_admin());

drop policy if exists cgt_admin_updates_candidates on public.candidate_profiles;
create policy cgt_admin_updates_candidates
  on public.candidate_profiles
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- jobs (el admin puede despublicar cualquier vacante)
drop policy if exists cgt_admin_reads_jobs on public.jobs;
create policy cgt_admin_reads_jobs
  on public.jobs
  for select
  using (public.is_admin());

drop policy if exists cgt_admin_updates_jobs on public.jobs;
create policy cgt_admin_updates_jobs
  on public.jobs
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- applications (solo lectura, para contar postulaciones reales)
drop policy if exists cgt_admin_reads_applications on public.applications;
create policy cgt_admin_reads_applications
  on public.applications
  for select
  using (public.is_admin());

-- (No hay politicas de "profiles": esa tabla no existe en la base
-- viva. El rol se gestiona directo en auth.users, ver 014.)


-- ---------------------------------------------------------------------
-- 6. Un candidato suspendido no puede postularse a vacantes nuevas
--    (conserva su historial y sus postulaciones ya hechas).
-- ---------------------------------------------------------------------

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
        and coalesce(p.status, 'activa') <> 'suspendida'
    )
  );
