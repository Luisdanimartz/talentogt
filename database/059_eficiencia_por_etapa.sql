-- =====================================================================
-- 059 - Eficiencia por etapa y tendencia mensual
--
-- Dos funciones nuevas para el panel de reportes de la empresa. Las
-- dos salen del historial que ya llevas (application_status_history):
-- no hay que capturar nada nuevo ni pedirle datos a nadie.
--
--   1. company_stage_efficiency(): cuantos dias tarda la empresa en
--      pasar de una etapa a la siguiente. Este es EL numero util
--      del panel: no le dice al reclutador que va mal, le dice
--      exactamente DONDE se le atora el proceso. Si de "postulado"
--      a "en revision" tarda 9 dias y de "entrevista" a "decision"
--      tarda 2, ya sabe cual arreglar.
--
--   2. company_monthly_metrics(): postulaciones, contrataciones y
--      tiempos, mes por mes. Sirve para ver si esta mejorando o
--      empeorando, que es distinto de saber como esta hoy.
--
-- Ambas respetan el mismo control de acceso que 011: solo miembros
-- de esa empresa (dueño, reclutador u observador).
--
-- Requiere 002, 006, 008 y 011. Segura de correr mas de una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Eficiencia por etapa
--
-- Cada fila es un salto del proceso. "muestras" es cuantas
-- postulaciones pasaron por ese salto: si es 0 o 1, el promedio no
-- significa gran cosa y el frontend lo dice en vez de fingir
-- precision.
--
-- La etapa final ('decision') junta contratado y no seleccionado:
-- para el candidato las dos son una respuesta y las dos cuentan
-- como cerrar el proceso.
-- ---------------------------------------------------------------------

create or replace function public.company_stage_efficiency(
  cid uuid,
  p_desde timestamptz default null,
  p_hasta timestamptz default null
)
returns table (
  etapa           text,
  etiqueta        text,
  dias_promedio   numeric,
  muestras        bigint
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin

  if not public.is_company_member(
    cid, array['dueno', 'reclutador', 'observador']
  ) then
    raise exception 'No autorizado para ver el reporte de esta empresa';
  end if;

  return query
  with base as (
    select
      a.id,
      a.applied_at,
      a.cv_viewed_at,
      min(h.created_at) filter (where h.status = 'reviewing') as revisado_en,
      min(h.created_at) filter (where h.status = 'interview') as entrevista_en,
      min(h.created_at) filter (
        where h.status in ('hired', 'rejected')
      ) as decidido_en
    from public.applications a
    join public.jobs j on j.id = a.job_id
    left join public.application_status_history h
      on h.application_id = a.id
    where j.company_id = cid
      and (p_desde is null or a.applied_at >= p_desde)
      and (p_hasta is null or a.applied_at <= p_hasta)
    group by a.id, a.applied_at, a.cv_viewed_at
  ),
  saltos as (

    select
      'cv_abierto'::text as etapa,
      'De postulado a CV abierto'::text as etiqueta,
      extract(epoch from (cv_viewed_at - applied_at)) / 86400.0 as dias
    from base
    where cv_viewed_at is not null
      and cv_viewed_at >= applied_at

    union all

    select
      'revision',
      'De postulado a en revision',
      extract(epoch from (revisado_en - applied_at)) / 86400.0
    from base
    where revisado_en is not null
      and revisado_en >= applied_at

    union all

    select
      'entrevista',
      'De en revision a entrevista',
      extract(epoch from (entrevista_en - revisado_en)) / 86400.0
    from base
    where entrevista_en is not null
      and revisado_en is not null
      and entrevista_en >= revisado_en

    union all

    select
      'decision',
      'De entrevista a decision',
      extract(epoch from (decidido_en - entrevista_en)) / 86400.0
    from base
    where decidido_en is not null
      and entrevista_en is not null
      and decidido_en >= entrevista_en

  )
  select
    s.etapa,
    s.etiqueta,
    round(avg(s.dias)::numeric, 1),
    count(*)::bigint
  from saltos s
  group by s.etapa, s.etiqueta
  order by
    case s.etapa
      when 'cv_abierto' then 1
      when 'revision'   then 2
      when 'entrevista' then 3
      when 'decision'   then 4
    end;

end;
$$;

revoke all on function public.company_stage_efficiency(
  uuid, timestamptz, timestamptz
) from public;

grant execute on function public.company_stage_efficiency(
  uuid, timestamptz, timestamptz
) to authenticated;


-- ---------------------------------------------------------------------
-- 2. Tendencia mensual
--
-- Devuelve TODOS los meses del rango pedido, incluso los que no
-- tuvieron movimiento, para que la grafica no mienta juntando meses
-- separados como si fueran seguidos.
-- ---------------------------------------------------------------------

create or replace function public.company_monthly_metrics(
  cid uuid,
  p_meses integer default 12
)
returns table (
  mes                 date,
  postulaciones       bigint,
  contratados         bigint,
  dias_contratacion   numeric,
  horas_respuesta     numeric
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin

  if not public.is_company_member(
    cid, array['dueno', 'reclutador', 'observador']
  ) then
    raise exception 'No autorizado para ver el reporte de esta empresa';
  end if;

  return query
  with meses as (
    select generate_series(
      date_trunc('month', current_date)
        - ((greatest(p_meses, 1) - 1) || ' months')::interval,
      date_trunc('month', current_date),
      '1 month'::interval
    )::date as mes
  ),
  apps as (
    select
      a.id,
      date_trunc('month', a.applied_at)::date as mes,
      a.applied_at,
      min(h.created_at) filter (where h.status <> 'applied')
        as primera_respuesta,
      min(h.created_at) filter (where h.status = 'hired')
        as contratado_en
    from public.applications a
    join public.jobs j on j.id = a.job_id
    left join public.application_status_history h
      on h.application_id = a.id
    where j.company_id = cid
    group by a.id, a.applied_at
  )
  select
    m.mes,
    count(ap.id)::bigint,
    count(ap.contratado_en)::bigint,
    round(
      avg(
        extract(epoch from (ap.contratado_en - ap.applied_at)) / 86400.0
      )::numeric,
      1
    ),
    round(
      avg(
        extract(epoch from (ap.primera_respuesta - ap.applied_at)) / 3600.0
      )::numeric,
      1
    )
  from meses m
  left join apps ap on ap.mes = m.mes
  group by m.mes
  order by m.mes;

end;
$$;

revoke all on function public.company_monthly_metrics(uuid, integer)
  from public;

grant execute on function public.company_monthly_metrics(uuid, integer)
  to authenticated;


-- ---------------------------------------------------------------------
-- 3. Comprobacion (cambia el uuid por el de tu empresa de prueba)
--
--   select * from public.company_stage_efficiency('TU-COMPANY-ID');
--   select * from public.company_monthly_metrics('TU-COMPANY-ID', 6);
-- ---------------------------------------------------------------------
