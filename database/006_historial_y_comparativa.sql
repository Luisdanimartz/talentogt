-- =====================================================================
-- 006 - Historial de postulacion y comparativa entre candidatos
--
--  1. application_status_history: cada cambio de estado queda
--     registrado con fecha -> linea de tiempo real para el candidato.
--  2. job_applicant_stats: numeros AGREGADOS de los postulantes de
--     una vacante (total, respondidos, del departamento, pretension
--     promedio) para que el candidato se compare SIN exponer los
--     datos de nadie.
--
-- Seguro de correr mas de una vez.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Historial de estados
-- ---------------------------------------------------------------------

create table if not exists public.application_status_history (
  id uuid primary key default gen_random_uuid(),

  application_id uuid not null
    references public.applications(id)
    on delete cascade,

  status text not null,

  created_at timestamptz not null default now()
);

create index if not exists application_status_history_app_idx
  on public.application_status_history(application_id);

alter table public.application_status_history enable row level security;

-- El candidato LEE el historial de sus propias postulaciones
drop policy if exists cgt_candidate_reads_own_history
  on public.application_status_history;

create policy cgt_candidate_reads_own_history
  on public.application_status_history
  for select
  using (
    exists (
      select 1
      from public.applications a
      join public.candidate_profiles p on p.id = a.candidate_profile_id
      where a.id = application_status_history.application_id
        and p.user_id = auth.uid()
    )
  );

-- El candidato INSERTA el evento inicial ("applied") al postularse
drop policy if exists cgt_candidate_inserts_own_history
  on public.application_status_history;

create policy cgt_candidate_inserts_own_history
  on public.application_status_history
  for insert
  with check (
    exists (
      select 1
      from public.applications a
      join public.candidate_profiles p on p.id = a.candidate_profile_id
      where a.id = application_status_history.application_id
        and p.user_id = auth.uid()
    )
  );

-- La empresa LEE e INSERTA historial de postulaciones a SUS vacantes
drop policy if exists cgt_company_reads_history
  on public.application_status_history;

create policy cgt_company_reads_history
  on public.application_status_history
  for select
  using (
    exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      join public.company_profiles c on c.id = j.company_id
      where a.id = application_status_history.application_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists cgt_company_inserts_history
  on public.application_status_history;

create policy cgt_company_inserts_history
  on public.application_status_history
  for insert
  with check (
    exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      join public.company_profiles c on c.id = j.company_id
      where a.id = application_status_history.application_id
        and c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- Comparativa agregada de postulantes por vacante
-- (solo numeros; jamas datos individuales)
-- ---------------------------------------------------------------------

create or replace function public.job_applicant_stats(jid uuid)
returns table (
  total bigint,
  responded bigint,
  in_department bigint,
  avg_expected numeric
)
language sql
security definer
set search_path = public
stable
as $$
  select
    count(*) as total,

    count(*) filter (
      where a.current_status is distinct from 'applied'
    ) as responded,

    count(*) filter (
      where d.name is not null
        and cp.department is not null
        and lower(cp.department) = lower(d.name)
    ) as in_department,

    avg(cp.expected_salary) as avg_expected

  from public.applications a
  join public.candidate_profiles cp
    on cp.id = a.candidate_profile_id
  join public.jobs j
    on j.id = a.job_id
  left join public.departments d
    on d.id = j.department_id
  where a.job_id = jid;
$$;

grant execute on function public.job_applicant_stats(uuid)
  to authenticated;
