-- =====================================================================
-- 049 - Filtro por municipio en la búsqueda de candidatos
--
-- El buscador de candidatos (024) ya filtraba por departamento, pero
-- no por municipio. Como candidate_profiles.municipality ya existe
-- como columna de texto (llenada desde el mismo catálogo de
-- municipios que usa el CV builder), solo hace falta agregar el
-- parámetro nuevo a la función.
--
-- Hay que borrar la función vieja antes de recrearla porque cambia
-- la lista de parámetros (no solo el cuerpo) — "create or replace"
-- no permite eso.
--
-- Seguro de correr más de una vez.
-- =====================================================================

drop function if exists public.search_candidates(uuid, text, text, numeric, text);

create or replace function public.search_candidates(
  p_company_id uuid,
  p_profession text default null,
  p_department text default null,
  p_municipality text default null,
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
      and (p_municipality is null or cp.municipality = p_municipality)
      and (p_skill is null or cp.skills ilike '%' || p_skill || '%')
    order by cp.updated_at desc
    limit 100;

end;
$$;

revoke all on function public.search_candidates(uuid, text, text, text, numeric, text) from public;
grant execute on function public.search_candidates(uuid, text, text, text, numeric, text) to authenticated;
