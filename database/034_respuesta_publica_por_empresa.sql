-- =====================================================================
-- 034 - Resumen público de respuesta por empresa (para ordenar vacantes)
--
-- company_response_stats(cid) ya existe (005 + 032) pero es "una
-- empresa a la vez" -- para poder ORDENAR el listado completo de
-- vacantes por "empresas que responden más rápido" necesitamos
-- traer el dato de TODAS las empresas de un solo viaje.
--
-- Mismo criterio de siempre: responder = current_status <> 'applied'.
-- Es publica (anon) porque ya se muestra hoy en el badge de cada
-- vacante individual -- esto solo la trae en lote.
--
-- Requiere 005, 006, 032. Segura de correr mas de una vez.
-- =====================================================================

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
  group by j.company_id;
$$;

revoke all on function public.public_company_response_summary() from public;
grant execute on function public.public_company_response_summary()
  to anon, authenticated;
