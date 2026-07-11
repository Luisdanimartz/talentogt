-- =====================================================================
-- 005 - Reputacion de respuesta de la empresa (estrellas REALES)
--
-- La calificacion de 1 a 5 estrellas NO la inventa nadie: se calcula
-- de cuantas postulaciones ha RESPONDIDO la empresa (cualquier estado
-- distinto de "applied" cuenta como respuesta: revision, entrevista,
-- contratado o no seleccionado).
--
-- Como los candidatos no pueden leer las postulaciones de otros
-- (RLS), esta funcion "security definer" devuelve SOLO numeros
-- agregados (total y respondidas) — ningun dato personal.
-- =====================================================================

create or replace function public.company_response_stats(cid uuid)
returns table (total bigint, responded bigint)
language sql
security definer
set search_path = public
stable
as $$
  select
    count(*) as total,
    count(*) filter (where a.current_status is distinct from 'applied')
      as responded
  from public.applications a
  join public.jobs j on j.id = a.job_id
  where j.company_id = cid;
$$;

grant execute on function public.company_response_stats(uuid)
  to anon, authenticated;
