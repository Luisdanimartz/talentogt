-- =========================================================
-- 024_busqueda_candidatos_y_creditos.sql
--
-- Feedback de una reclutadora (Karla): las empresas solo ven
-- a quien aplica a sus vacantes, no pueden buscar en una base
-- de candidatos mas amplia.
--
-- Esta migracion agrega:
--   1. Un interruptor de privacidad para el candidato
--      (visible_en_busqueda) - opt-in, apagado por defecto.
--   2. Creditos de desbloqueo por empresa (asignados a mano
--      por el admin, mismo patron que el tarifario).
--   3. Una funcion de busqueda ANONIMA (sin nombre/telefono)
--      para que la empresa explore candidatos gratis.
--   4. Una funcion para desbloquear (gasta 1 credito la
--      primera vez) y ver el perfil completo despues.
--
-- Requiere el 008 (is_company_member) y el 013 (is_admin).
-- Idempotente y autocontenido.
-- =========================================================


-- ---------------------------------------------------------------------
-- 1. Interruptor de privacidad del candidato
-- ---------------------------------------------------------------------

alter table public.candidate_profiles
  add column if not exists visible_en_busqueda boolean not null default false;


-- ---------------------------------------------------------------------
-- 2. Creditos de desbloqueo de la empresa
-- ---------------------------------------------------------------------

alter table public.company_profiles
  add column if not exists unlock_credits integer not null default 0;


-- ---------------------------------------------------------------------
-- 3. Historial de desbloqueos (una vez desbloqueado, ya no
--    vuelve a costar credito ver a ese mismo candidato)
-- ---------------------------------------------------------------------

create table if not exists public.candidate_unlocks (
  id uuid primary key default gen_random_uuid(),

  company_id uuid not null
    references public.company_profiles(id)
    on delete cascade,

  candidate_profile_id uuid not null
    references public.candidate_profiles(id)
    on delete cascade,

  unlocked_by uuid references auth.users(id),
  unlocked_at timestamptz not null default now(),

  unique (company_id, candidate_profile_id)
);

create index if not exists candidate_unlocks_company_idx
  on public.candidate_unlocks(company_id);

alter table public.candidate_unlocks enable row level security;

drop policy if exists cgt_members_read_own_unlocks
  on public.candidate_unlocks;

create policy cgt_members_read_own_unlocks
  on public.candidate_unlocks
  for select
  using (public.is_company_member(company_id, array['dueno','reclutador']));


-- ---------------------------------------------------------------------
-- 4. Busqueda anonima de candidatos (sin nombre, sin telefono,
--    sin CV). Solo lo minimo para decidir si vale la pena
--    desbloquear. SECURITY DEFINER: la empresa nunca consulta
--    la tabla candidate_profiles directamente para esto.
-- ---------------------------------------------------------------------

create or replace function public.search_candidates(
  p_company_id uuid,
  p_profession text default null,
  p_department text default null,
  p_min_years numeric default null,
  p_skill text default null
)
returns table (
  candidate_profile_id uuid,
  profession text,
  department text,
  municipality text,
  education_level text,
  skills text,
  expected_salary numeric,
  years_experience numeric,
  already_unlocked boolean
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin

  if not public.is_company_member(p_company_id, array['dueno','reclutador']) then
    raise exception 'No tienes permiso para buscar candidatos.';
  end if;

  return query
    select
      cp.id,
      cp.profession,
      cp.department,
      cp.municipality,
      cp.education_level,
      cp.skills,
      cp.expected_salary,
      coalesce(
        (
          select sum(
            case
              when ce.years ~ '^\d+(\.\d+)?$' then ce.years::numeric
              else 0
            end
          )
          from public.candidate_experience ce
          where ce.candidate_profile_id = cp.id
        ), 0
      ) as years_experience,
      exists (
        select 1 from public.candidate_unlocks u
        where u.company_id = p_company_id
          and u.candidate_profile_id = cp.id
      ) as already_unlocked
    from public.candidate_profiles cp
    where cp.visible_en_busqueda = true
      and (p_profession is null or cp.profession ilike '%' || p_profession || '%')
      and (p_department is null or cp.department = p_department)
      and (p_skill is null or cp.skills ilike '%' || p_skill || '%')
    order by cp.updated_at desc
    limit 100;

end;
$$;

revoke all on function public.search_candidates(uuid, text, text, numeric, text) from public;
grant execute on function public.search_candidates(uuid, text, text, numeric, text) to authenticated;


-- ---------------------------------------------------------------------
-- 5. Desbloquear un candidato (gasta 1 credito la primera vez)
-- ---------------------------------------------------------------------

create or replace function public.unlock_candidate_profile(
  p_company_id uuid,
  p_candidate_profile_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ya_desbloqueado boolean;
  v_creditos integer;
  v_visible boolean;
begin

  if not public.is_company_member(p_company_id, array['dueno','reclutador']) then
    raise exception 'No tienes permiso para desbloquear candidatos.';
  end if;

  select visible_en_busqueda into v_visible
  from public.candidate_profiles
  where id = p_candidate_profile_id;

  if v_visible is not true then
    raise exception 'Este perfil ya no está disponible para búsqueda.';
  end if;

  select exists (
    select 1 from public.candidate_unlocks
    where company_id = p_company_id
      and candidate_profile_id = p_candidate_profile_id
  ) into v_ya_desbloqueado;

  if v_ya_desbloqueado then
    return true;
  end if;

  select unlock_credits into v_creditos
  from public.company_profiles
  where id = p_company_id
  for update;

  if coalesce(v_creditos, 0) < 1 then
    raise exception 'No tienes créditos disponibles para desbloquear más perfiles.';
  end if;

  update public.company_profiles
  set unlock_credits = unlock_credits - 1
  where id = p_company_id;

  insert into public.candidate_unlocks (company_id, candidate_profile_id, unlocked_by)
  values (p_company_id, p_candidate_profile_id, auth.uid());

  return true;

end;
$$;

revoke all on function public.unlock_candidate_profile(uuid, uuid) from public;
grant execute on function public.unlock_candidate_profile(uuid, uuid) to authenticated;


-- ---------------------------------------------------------------------
-- 6. Ver el perfil completo de un candidato YA desbloqueado
--    (no gasta credito, solo confirma que ya se pago por el)
-- ---------------------------------------------------------------------

create or replace function public.get_unlocked_candidate(
  p_company_id uuid,
  p_candidate_profile_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_result jsonb;
begin

  if not public.is_company_member(p_company_id, array['dueno','reclutador']) then
    raise exception 'No tienes permiso para ver este perfil.';
  end if;

  if not exists (
    select 1 from public.candidate_unlocks
    where company_id = p_company_id
      and candidate_profile_id = p_candidate_profile_id
  ) then
    raise exception 'Aún no has desbloqueado este perfil.';
  end if;

  select to_jsonb(cp.*)
    || jsonb_build_object(
      'candidate_education',
      coalesce(
        (
          select jsonb_agg(to_jsonb(ce.*))
          from public.candidate_education ce
          where ce.candidate_profile_id = cp.id
        ), '[]'::jsonb
      ),
      'candidate_experience',
      coalesce(
        (
          select jsonb_agg(to_jsonb(cx.*))
          from public.candidate_experience cx
          where cx.candidate_profile_id = cp.id
        ), '[]'::jsonb
      )
    )
  into v_result
  from public.candidate_profiles cp
  where cp.id = p_candidate_profile_id;

  return v_result;

end;
$$;

revoke all on function public.get_unlocked_candidate(uuid, uuid) from public;
grant execute on function public.get_unlocked_candidate(uuid, uuid) to authenticated;


-- ---------------------------------------------------------------------
-- 7b. Agregar unlock_credits a la vista de admin de empresas
--     (hay que borrarla primero: cambia el tipo de fila que
--     devuelve, "create or replace" no lo permite)
-- ---------------------------------------------------------------------

drop function if exists public.admin_companies();

create or replace function public.admin_companies()
returns table (
  id uuid,
  company_name text,
  nit text,
  email text,
  phone text,
  department_name text,
  status text,
  plan text,
  is_collaborator boolean,
  total_vacantes bigint,
  total_postulaciones bigint,
  unlock_credits integer,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin

  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  return query
  select
    c.id,
    c.company_name::text,
    c.nit::text,
    c.email::text,
    c.phone::text,
    d.name::text,
    c.status::text,
    c.plan::text,
    c.is_collaborator,
    count(distinct j.id)::bigint,
    count(distinct a.id)::bigint,
    c.unlock_credits,
    c.created_at
  from public.company_profiles c
  left join public.departments d on d.id = c.department_id
  left join public.jobs j on j.company_id = c.id
  left join public.applications a on a.job_id = j.id
  group by c.id, c.company_name, c.nit, c.email, c.phone, d.name,
           c.status, c.plan, c.is_collaborator, c.unlock_credits, c.created_at
  order by c.created_at desc;

end;
$$;

revoke all on function public.admin_companies() from public;
grant execute on function public.admin_companies() to authenticated;


-- ---------------------------------------------------------------------
-- 7. Admin: agregar creditos de desbloqueo a una empresa
--    (mismo patron manual que el tarifario - tu decides
--    cuando alguien pago y le agregas creditos a mano)
-- ---------------------------------------------------------------------

create or replace function public.admin_add_unlock_credits(
  p_company_id uuid,
  p_amount integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nuevo_total integer;
begin

  if not public.is_admin() then
    raise exception 'Solo un administrador puede agregar créditos.';
  end if;

  update public.company_profiles
  set unlock_credits = greatest(0, unlock_credits + p_amount)
  where id = p_company_id
  returning unlock_credits into v_nuevo_total;

  return v_nuevo_total;

end;
$$;

revoke all on function public.admin_add_unlock_credits(uuid, integer) from public;
grant execute on function public.admin_add_unlock_credits(uuid, integer) to authenticated;
