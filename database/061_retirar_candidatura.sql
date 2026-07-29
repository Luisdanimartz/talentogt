-- =====================================================================
-- 061 - Retirar candidatura
--
-- Hoy el candidato que ya consiguio trabajo (o que se arrepintio) no
-- tiene forma de salirse de un proceso. Se queda ocupando lugar en
-- la bandeja del reclutador, contando como pendiente y ensuciando el
-- porcentaje de respuesta de una empresa que en realidad no hizo
-- nada mal.
--
-- Se agrega el estado 'withdrawn' (Retirada). Lo pone SOLO el
-- candidato, nunca la empresa.
--
-- DOS DECISIONES IMPORTANTES:
--
--   1. No se inserta fila en application_status_history. Esa tabla
--      es la que dispara los correos, y mandarle un correo al
--      candidato avisandole de algo que acaba de hacer el mismo
--      seria ruido. La fecha queda en applications.withdrawn_at.
--
--   2. Una candidatura retirada NO cuenta ni a favor ni en contra de
--      la empresa. Si contara como "respondida" seria regalarle
--      reputacion; si contara como "pendiente" seria castigarla por
--      una decision del candidato. Por eso este archivo actualiza
--      todas las funciones que miden respuesta para que la ignoren.
--
-- Requiere 002, 005, 032, 034, 056 y 060. Segura de correr mas de
-- una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Columnas nuevas
-- ---------------------------------------------------------------------

alter table public.applications
  add column if not exists withdrawn_at timestamptz;

alter table public.applications
  add column if not exists withdraw_reason text;


-- ---------------------------------------------------------------------
-- 2. Retirar la candidatura
--
-- El motivo es opcional y sirve para dos cosas: que la empresa
-- entienda por que se fue (sin datos personales) y que tu veas
-- patrones. Si muchos se retiran diciendo "ya conseguí trabajo",
-- ChanceGT esta funcionando; si dicen "el proceso tardo mucho",
-- tienes un problema que atender.
-- ---------------------------------------------------------------------

create or replace function public.withdraw_application(
  p_application_id uuid,
  p_motivo text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_es_mia boolean;
  v_estado text;
begin

  select
    exists (
      select 1
      from public.candidate_profiles p
      where p.id = a.candidate_profile_id
        and p.user_id = auth.uid()
    ),
    a.current_status
  into v_es_mia, v_estado
  from public.applications a
  where a.id = p_application_id;

  if v_estado is null then
    raise exception 'La postulacion no existe.';
  end if;

  if not v_es_mia then
    raise exception 'Solo puedes retirar tus propias postulaciones.';
  end if;

  if v_estado = 'withdrawn' then
    raise exception 'Esta candidatura ya fue retirada.';
  end if;

  if v_estado in ('hired', 'rejected') then
    raise exception
      'Este proceso ya termino, no hay nada de que retirarse.';
  end if;

  update public.applications
  set
    current_status  = 'withdrawn',
    withdrawn_at    = now(),
    withdraw_reason = nullif(trim(coalesce(p_motivo, '')), ''),
    updated_at      = now()
  where id = p_application_id;

end;
$$;

revoke all on function public.withdraw_application(uuid, text) from public;
grant execute on function public.withdraw_application(uuid, text)
  to authenticated;


-- ---------------------------------------------------------------------
-- 3. El candidato necesita poder actualizar SU postulacion
--
-- La politica de 002 solo dejaba insertar y leer. La funcion de
-- arriba es security definer, asi que en realidad no depende de
-- esta politica -- se agrega igual para que el modelo de permisos
-- sea coherente si algun dia se hace desde el cliente.
-- ---------------------------------------------------------------------

drop policy if exists cgt_candidate_withdraws_own_application
  on public.applications;

create policy cgt_candidate_withdraws_own_application
  on public.applications
  for update
  using (
    exists (
      select 1
      from public.candidate_profiles p
      where p.id = applications.candidate_profile_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.candidate_profiles p
      where p.id = applications.candidate_profile_id
        and p.user_id = auth.uid()
    )
  );


-- ---------------------------------------------------------------------
-- 4. Las retiradas salen de TODAS las metricas de respuesta
-- ---------------------------------------------------------------------

-- 4.a Insignia publica de una empresa (005 + 032)

create or replace function public.company_response_stats(cid uuid)
returns table (total bigint, responded bigint, avg_response_days numeric)
language sql
security definer
set search_path = public
stable
as $$
  with primera_respuesta as (
    select
      h.application_id,
      min(h.created_at) as respondido_en
    from public.application_status_history h
    where h.status <> 'applied'
    group by h.application_id
  )
  select
    count(*) as total,
    count(*) filter (where a.current_status is distinct from 'applied')
      as responded,
    round(
      (
        avg(
          extract(epoch from (pr.respondido_en - a.applied_at)) / 86400.0
        ) filter (where pr.respondido_en is not null)
      )::numeric,
      1
    ) as avg_response_days
  from public.applications a
  join public.jobs j on j.id = a.job_id
  left join primera_respuesta pr on pr.application_id = a.id
  where j.company_id = cid
    and a.current_status <> 'withdrawn';
$$;

grant execute on function public.company_response_stats(uuid)
  to anon, authenticated;


-- 4.b El mismo dato para todas las empresas de un viaje (034)

create or replace function public.public_company_response_summary()
returns table (
  company_id uuid,
  total bigint,
  responded bigint,
  avg_response_days numeric
)
language sql
security definer
set search_path = public
stable
as $$
  with primera_respuesta as (
    select
      h.application_id,
      min(h.created_at) as respondido_en
    from public.application_status_history h
    where h.status <> 'applied'
    group by h.application_id
  )
  select
    j.company_id,
    count(a.id) as total,
    count(a.id) filter (where a.current_status is distinct from 'applied')
      as responded,
    round(
      (
        avg(
          extract(epoch from (pr.respondido_en - a.applied_at)) / 86400.0
        ) filter (where pr.respondido_en is not null)
      )::numeric,
      1
    ) as avg_response_days
  from public.jobs j
  join public.applications a on a.job_id = j.id
  left join primera_respuesta pr on pr.application_id = a.id
  where a.current_status <> 'withdrawn'
  group by j.company_id;
$$;

revoke all on function public.public_company_response_summary() from public;
grant execute on function public.public_company_response_summary()
  to anon, authenticated;


-- 4.c La tarea automatica no debe "resolver" a quien ya se fue (056)

create or replace function public.auto_resolve_expired_jobs(
  p_limite integer default 400
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_resueltas integer := 0;
begin

  update public.jobs
  set status = 'closed'
  where status in ('published', 'paused')
    and resolution_deadline is not null
    and resolution_deadline < current_date;

  with pendientes as (
    select a.id
    from public.applications a
    join public.jobs j on j.id = a.job_id
    where j.status = 'closed'
      and a.current_status not in ('hired', 'rejected', 'withdrawn')
    order by a.applied_at
    limit p_limite
  ),
  actualizadas as (
    update public.applications a
    set
      current_status = 'rejected',
      auto_resolved  = true,
      updated_at     = now()
    from pendientes p
    where a.id = p.id
    returning a.id
  ),
  historial as (
    insert into public.application_status_history (application_id, status)
    select id, 'rejected' from actualizadas
    returning 1
  )
  select count(*) into v_resueltas from historial;

  return v_resueltas;

end;
$$;

revoke all on function public.auto_resolve_expired_jobs(integer) from public;


-- 4.d Pendientes que ve el admin (032)

create or replace function public.admin_pending_responses()
returns table (
  company_id uuid,
  company_name text,
  job_id uuid,
  job_title text,
  total_postulaciones bigint,
  pendientes bigint,
  pct_respuesta numeric,
  dias_pendiente_mas_antiguo integer
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
    c.company_name,
    j.id,
    j.title,
    count(a.id) as total,
    count(a.id) filter (where a.current_status = 'applied') as pendientes,
    case
      when count(a.id) = 0 then 0
      else round(
        100.0 * count(a.id) filter (
          where a.current_status is distinct from 'applied'
        ) / count(a.id),
        0
      )
    end as pct_respuesta,
    coalesce(
      extract(
        day from now() - min(a.applied_at) filter (
          where a.current_status = 'applied'
        )
      )::integer,
      0
    ) as dias_pendiente_mas_antiguo
  from public.jobs j
  join public.company_profiles c on c.id = j.company_id
  left join public.applications a
    on a.job_id = j.id
   and a.current_status <> 'withdrawn'
  group by c.id, c.company_name, j.id, j.title
  having count(a.id) > 0
  order by
    count(a.id) filter (where a.current_status = 'applied') desc,
    dias_pendiente_mas_antiguo desc;

end;
$$;

revoke all on function public.admin_pending_responses() from public;
grant execute on function public.admin_pending_responses() to authenticated;


-- 4.e Panel de salud del candidato (060)
--
-- Aqui hace falta DROP y no basta con "create or replace": esta
-- funcion devuelve una columna mas que antes (retiradas), y
-- Postgres no deja cambiarle la forma a una funcion existente.

drop function if exists public.admin_experiencia_candidato(
  timestamptz, timestamptz
);

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
  cv_abiertos             bigint,
  horas_primera_respuesta numeric,
  vacantes_publicadas     bigint,
  vacantes_sin_candidatos bigint,
  retiradas               bigint
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
  activas as (
    select * from apps where current_status <> 'withdrawn'
  ),
  vacantes as (
    select
      j.id,
      count(a.id) as postulaciones
    from public.jobs j
    left join public.applications a
      on a.job_id = j.id
     and a.current_status <> 'withdrawn'
    where j.status = 'published'
    group by j.id
  )
  select
    (select count(*) from activas),
    (select count(*) from activas where current_status <> 'applied'),
    case
      when (select count(*) from activas) = 0 then 0
      else round(
        100.0 * (select count(*) from activas where current_status <> 'applied')
        / (select count(*) from activas), 0
      )
    end,
    (select count(*) from activas where current_status = 'applied'),
    (select count(*) from activas where auto_resolved),
    (select count(*) from activas where cv_viewed_at is not null),
    (select round(
       avg(extract(epoch from (primera_respuesta - applied_at)) / 3600.0
     )::numeric, 1)
     from activas where primera_respuesta is not null),
    (select count(*) from vacantes),
    (select count(*) from vacantes where postulaciones = 0),
    (select count(*) from apps where current_status = 'withdrawn');

end;
$$;

revoke all on function public.admin_experiencia_candidato(
  timestamptz, timestamptz
) from public;

grant execute on function public.admin_experiencia_candidato(
  timestamptz, timestamptz
) to authenticated;


-- 4.f Ranking de respuesta (060)

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
    where a.current_status <> 'withdrawn'
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


-- ---------------------------------------------------------------------
-- 5. Comprobacion
--
--   select current_status, count(*)
--   from public.applications
--   group by current_status;
-- ---------------------------------------------------------------------
