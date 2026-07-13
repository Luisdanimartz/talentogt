-- =====================================================================
-- 009 - Entrevistas
--
--  1. interviews: entrevistas reales agendadas por la empresa sobre
--     una postulacion (fecha, modalidad, lugar/enlace, notas internas).
--  2. RLS: el equipo de la empresa (dueno/reclutador) las administra,
--     el observador solo las ve.
--  3. El candidato NO lee la tabla directo (las notas son internas
--     del reclutador): usa la funcion candidate_interviews, que
--     verifica que la postulacion sea suya y devuelve SOLO fecha,
--     modalidad, lugar/enlace y estado.
--
-- Requiere haber corrido antes el 008 (usa is_company_member).
-- Seguro de correr mas de una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. Funcion de updated_at (por si el 009 se corre suelto)
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
-- 1. Tabla
-- ---------------------------------------------------------------------

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),

  application_id uuid not null
    references public.applications(id)
    on delete cascade,

  scheduled_at timestamptz not null,

  modality text not null default 'Presencial'
    check (modality in ('Presencial', 'Virtual', 'Telefónica')),

  -- Direccion si es presencial, enlace si es virtual, telefono si aplica
  location_or_link text,

  -- Notas INTERNAS del reclutador (el candidato nunca las ve)
  notes text,

  status text not null default 'programada'
    check (status in ('programada', 'realizada', 'cancelada')),

  created_by uuid references auth.users(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists interviews_application_idx
  on public.interviews(application_id);

create index if not exists interviews_scheduled_idx
  on public.interviews(scheduled_at);

drop trigger if exists set_interviews_updated_at on public.interviews;

create trigger set_interviews_updated_at
  before update on public.interviews
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- 2. RLS
-- ---------------------------------------------------------------------

alter table public.interviews enable row level security;

-- Dueno y reclutador administran las entrevistas de su empresa
drop policy if exists cgt_team_manages_interviews on public.interviews;

create policy cgt_team_manages_interviews
  on public.interviews
  for all
  using (
    exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.id = interviews.application_id
        and public.is_company_member(
          j.company_id, array['dueno', 'reclutador']
        )
    )
  )
  with check (
    exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.id = interviews.application_id
        and public.is_company_member(
          j.company_id, array['dueno', 'reclutador']
        )
    )
  );

-- El observador solo LEE
drop policy if exists cgt_observer_reads_interviews on public.interviews;

create policy cgt_observer_reads_interviews
  on public.interviews
  for select
  using (
    exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.id = interviews.application_id
        and public.is_company_member(
          j.company_id, array['observador']
        )
    )
  );


-- ---------------------------------------------------------------------
-- 3. Funcion para el candidato (sin notas internas)
-- ---------------------------------------------------------------------

create or replace function public.candidate_interviews(p_application_id uuid)
returns table (
  scheduled_at timestamptz,
  modality text,
  location_or_link text,
  status text
)
language sql
security definer
set search_path = public
stable
as $$
  select i.scheduled_at, i.modality, i.location_or_link, i.status
  from public.interviews i
  join public.applications a on a.id = i.application_id
  join public.candidate_profiles p on p.id = a.candidate_profile_id
  where i.application_id = p_application_id
    and p.user_id = auth.uid()
  order by i.scheduled_at desc;
$$;

revoke all on function public.candidate_interviews(uuid) from public;
grant execute on function public.candidate_interviews(uuid) to authenticated;
