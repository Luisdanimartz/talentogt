-- =====================================================================
-- 060 - Panel de admin: salud de la experiencia del candidato
--
-- El panel de empresa responde "¿como voy yo?". Este responde otra
-- pregunta, la tuya como dueño de la plataforma:
--
--     ¿Quien esta arruinando la experiencia del candidato,
--      y que vacantes se estan quedando sin gente?
--
-- Son tres funciones:
--
--   1. admin_experiencia_candidato(): los numeros de toda la
--      plataforma en una sola fila. Incluye cuantas postulaciones
--      tuvo que resolver el SISTEMA porque la empresa no lo hizo —
--      ese numero deberia bajar con el tiempo; si sube, la promesa
--      de ChanceGT se esta sosteniendo sola y las empresas no estan
--      cambiando de conducta.
--
--   2. admin_vacantes_sin_postulaciones(): vacantes publicadas que
--      no reciben candidatos. Cruza las vistas (job_views, archivo
--      050) con las postulaciones, que es lo que separa dos
--      problemas muy distintos: "nadie la ve" (problema de trafico
--      o de SEO) contra "la ven y no aplican" (problema de la
--      publicacion: salario bajo, requisitos imposibles, texto malo).
--
--   3. admin_ranking_respuesta(): el ranking de empresas por
--      porcentaje de respuesta, para saber a quien felicitar y a
--      quien llamar.
--
-- Requiere 013 (is_admin), 050 (job_views), 055 y 058. Segura de
-- correr mas de una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Los numeros de la plataforma
-- ---------------------------------------------------------------------

create or replace function public.admin_experiencia_candidato(
  p_desde timestamptz default null,
  p_hasta timestamptz default null
)
returns table (
  total_postulaciones     bigint,
  respondidas             bigint,
  pct_respuesta           numeric,
  sin_responder           bigint,
  resueltas_por_sistema   bigint,
  cv_abiertos            bigint,
  horas_primera_respuesta numeric,
  vacantes_publicadas     bigint,
  vacantes_sin_candidatos bigint
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
  with apps as (
    select
      a.id,
      a.current_status,
      a.applied_at,
      a.auto_resolved,
      a.cv_viewed_at,
      min(h.created_at) filter (where h.status <> 'applied')
        as primera_respuesta
    from public.applications a
    left join public.application_status_history h
      on h.application_id = a.id
    where (p_desde is null or a.applied_at >= p_desde)
      and (p_hasta is null or a.applied_at <= p_hasta)
    group by a.id, a.current_status, a.applied_at,
             a.auto_resolved, a.cv_viewed_at
  ),
  vacantes as (
    select
      j.id,
      count(a.id) as postulaciones
    from public.jobs j
    left join public.applications a on a.job_id = j.id
    where j.status = 'published'
    group by j.id
  )
  select
    (select count(*) from apps),
    (select count(*) from apps where current_status <> 'applied'),
    case
      when (select count(*) from apps) = 0 then 0
      else round(
        100.0 * (select count(*) from apps where current_status <> 'applied')
        / (select count(*) from apps), 0
      )
    end,
    (select count(*) from apps where current_status = 'applied'),
    (select count(*) from apps where auto_resolved),
    (select count(*) from apps where cv_viewed_at is not null),
    (select round(
        avg(extract(epoch from (primera_respuesta - applied_at)) / 3600.0
      )::numeric, 1)
     from apps where primera_respuesta is not null),
    (select count(*) from vacantes),
    (select count(*) from vacantes where postulaciones = 0);

end;
$$;

revoke all on function public.admin_experiencia_candidato(
  timestamptz, timestamptz
) from public;

grant execute on function public.admin_experiencia_candidato(
  timestamptz, timestamptz
) to authenticated;


-- ---------------------------------------------------------------------
-- 2. Vacantes que no reciben candidatos
--
-- "vistas" viene de job_views (050). La diferencia entre vistas y
-- postulaciones es el diagnostico: muchas vistas y cero
-- postulaciones = la publicacion espanta a la gente.
-- ---------------------------------------------------------------------

create or replace function public.admin_vacantes_sin_postulaciones(
  p_dias_minimos integer default 3
)
returns table (
  job_id        uuid,
  job_title     text,
  company_id    uuid,
  company_name  text,
  published_at  timestamptz,
  dias_abierta  integer,
  vistas        bigint,
  postulaciones bigint,
  salario       numeric
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
    j.id,
    j.title,
    c.id,
    c.company_name,
    j.published_at,
    extract(day from now() - j.published_at)::integer,
    (select count(*) from public.job_views v where v.job_id = j.id),
    count(a.id),
    j.salary_min::numeric
  from public.jobs j
  join public.company_profiles c on c.id = j.company_id
  left join public.applications a on a.job_id = j.id
  where j.status = 'published'
    and j.published_at is not null
    and j.published_at <= now() - (p_dias_minimos || ' days')::interval
  group by j.id, j.title, c.id, c.company_name,
           j.published_at, j.salary_min
  having count(a.id) = 0
  order by j.published_at;

end;
$$;

revoke all on function public.admin_vacantes_sin_postulaciones(integer)
  from public;

grant execute on function public.admin_vacantes_sin_postulaciones(integer)
  to authenticated;


-- ---------------------------------------------------------------------
-- 3. Ranking de respuesta por empresa
--
-- Solo empresas con al menos una postulacion: rankear a quien nunca
-- ha recibido a nadie no dice nada de su conducta.
-- ---------------------------------------------------------------------

create or replace function public.admin_ranking_respuesta(
  p_limite integer default 20
)
returns table (
  company_id      uuid,
  company_name    text,
  total           bigint,
  respondidas     bigint,
  pct_respuesta   numeric,
  dias_respuesta  numeric,
  auto_resueltas  bigint
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
  with apps as (
    select
      c.id   as company_id,
      c.company_name,
      a.id   as application_id,
      a.current_status,
      a.applied_at,
      a.auto_resolved,
      min(h.created_at) filter (where h.status <> 'applied')
        as primera_respuesta
    from public.applications a
    join public.jobs j on j.id = a.job_id
    join public.company_profiles c on c.id = j.company_id
    left join public.application_status_history h
      on h.application_id = a.id
    group by c.id, c.company_name, a.id, a.current_status,
             a.applied_at, a.auto_resolved
  )
  select
    apps.company_id,
    apps.company_name,
    count(*)::bigint,
    count(*) filter (where current_status <> 'applied')::bigint,
    round(
      100.0 * count(*) filter (where current_status <> 'applied')
      / nullif(count(*), 0), 0
    ),
    round(
      avg(extract(epoch from (primera_respuesta - applied_at)) / 86400.0
    )::numeric, 1),
    count(*) filter (where auto_resolved)::bigint
  from apps
  group by apps.company_id, apps.company_name
  order by
    round(
      100.0 * count(*) filter (where current_status <> 'applied')
      / nullif(count(*), 0), 0
    ) asc nulls last,
    count(*) desc
  limit p_limite;

end;
$$;

revoke all on function public.admin_ranking_respuesta(integer) from public;
grant execute on function public.admin_ranking_respuesta(integer)
  to authenticated;
