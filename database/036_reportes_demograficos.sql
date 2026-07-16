-- =====================================================================
-- 036 - Reportes demográficos: ubicación, edad y género
--
-- 1. admin_companies_by_location(): empresas por departamento y
--    municipio (usa department_id/municipality_id, son FK reales).
--
-- 2. admin_candidates_by_location(): candidatos por departamento y
--    municipio. OJO: en candidate_profiles el departamento y
--    municipio se guardan como TEXTO libre (no como FK), asi que si
--    hay inconsistencias de mayusculas/tildes en los datos viejos,
--    apareceran como filas separadas. No es algo que se arregle con
--    SQL sin decidir primero una normalizacion; por ahora se agrupa
--    tal cual esta guardado.
--
-- 3. admin_candidates_by_age(): igual que arriba pero por rango de
--    edad, calculado desde birth_date.
--
-- 4. Columna nueva candidate_profiles.gender + admin_candidates_by_
--    gender(): el dato de genero NO EXISTIA en tu base -- se agrega
--    la columna ahora, pero arranca vacia para todos los candidatos
--    que ya se registraron. Solo se va a ir llenando con los
--    candidatos nuevos (o los que editen su CV) de aqui en adelante.
--
-- Requiere 013 (is_admin), 014 (esquema admin). Segura de correr mas
-- de una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Empresas por departamento y municipio
-- ---------------------------------------------------------------------

create or replace function public.admin_companies_by_location()
returns table (
  department_name text,
  municipality_name text,
  total bigint
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
    coalesce(d.name, 'Sin dato'),
    coalesce(m.name, 'Sin dato'),
    count(*)
  from public.company_profiles c
  left join public.departments d on d.id = c.department_id
  left join public.municipalities m on m.id = c.municipality_id
  group by d.name, m.name
  order by count(*) desc;

end;
$$;

revoke all on function public.admin_companies_by_location() from public;
grant execute on function public.admin_companies_by_location() to authenticated;


-- ---------------------------------------------------------------------
-- 2. Candidatos por departamento y municipio (texto libre)
-- ---------------------------------------------------------------------

create or replace function public.admin_candidates_by_location()
returns table (
  department_name text,
  municipality_name text,
  total bigint
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
    coalesce(nullif(trim(cp.department), ''), 'Sin dato'),
    coalesce(nullif(trim(cp.municipality), ''), 'Sin dato'),
    count(*)
  from public.candidate_profiles cp
  group by 1, 2
  order by count(*) desc;

end;
$$;

revoke all on function public.admin_candidates_by_location() from public;
grant execute on function public.admin_candidates_by_location() to authenticated;


-- ---------------------------------------------------------------------
-- 3. Candidatos por rango de edad
-- ---------------------------------------------------------------------

create or replace function public.admin_candidates_by_age()
returns table (
  rango text,
  total bigint
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
    case
      when cp.birth_date is null then 'Sin dato'
      when date_part('year', age(cp.birth_date)) < 18 then 'Menor de 18'
      when date_part('year', age(cp.birth_date)) between 18 and 24 then '18 a 24'
      when date_part('year', age(cp.birth_date)) between 25 and 34 then '25 a 34'
      when date_part('year', age(cp.birth_date)) between 35 and 44 then '35 a 44'
      when date_part('year', age(cp.birth_date)) between 45 and 54 then '45 a 54'
      when date_part('year', age(cp.birth_date)) between 55 and 64 then '55 a 64'
      else '65 o más'
    end as rango,
    count(*)
  from public.candidate_profiles cp
  group by 1
  order by
    case rango
      when 'Menor de 18' then 1
      when '18 a 24' then 2
      when '25 a 34' then 3
      when '35 a 44' then 4
      when '45 a 54' then 5
      when '55 a 64' then 6
      when '65 o más' then 7
      else 8
    end;

end;
$$;

revoke all on function public.admin_candidates_by_age() from public;
grant execute on function public.admin_candidates_by_age() to authenticated;


-- ---------------------------------------------------------------------
-- 4. Género: columna nueva + reporte
-- ---------------------------------------------------------------------

alter table public.candidate_profiles
  add column if not exists gender text;

alter table public.candidate_profiles
  drop constraint if exists candidate_profiles_gender_check;

alter table public.candidate_profiles
  add constraint candidate_profiles_gender_check
  check (
    gender is null
    or gender in ('masculino', 'femenino', 'otro', 'prefiero_no_decir')
  );

create or replace function public.admin_candidates_by_gender()
returns table (
  gender text,
  total bigint
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
    coalesce(cp.gender, 'Sin dato'),
    count(*)
  from public.candidate_profiles cp
  group by 1
  order by count(*) desc;

end;
$$;

revoke all on function public.admin_candidates_by_gender() from public;
grant execute on function public.admin_candidates_by_gender() to authenticated;
