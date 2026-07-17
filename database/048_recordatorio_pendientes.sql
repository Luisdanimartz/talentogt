-- =====================================================================
-- 048 - Recordatorio automático a la empresa: candidatos sin respuesta
--
-- Problema que resuelve: hoy la empresa solo se entera de que tiene
-- candidatos atrasados si entra por su cuenta al panel. Este archivo
-- agrega el aviso proactivo por correo, sin que nadie tenga que
-- acordarse de revisar.
--
-- Piezas:
--   1. company_reminder_log: para no mandar el correo todos los días
--      a la misma empresa (cooldown).
--   2. empresas_con_pendientes_atrasados(): candidatos con status
--      'applied' hace más de N días, agrupados por empresa, con el
--      correo de quien debe recibir el aviso (dueño + reclutadores
--      activos — el observador no gestiona candidatos, no se le
--      notifica). Usa company_profiles.email y company_members.email,
--      que ya existen como columnas propias (ver 047), así que no
--      necesita tocar auth.users.
--   3. marcar_recordatorio_enviado(): la Edge Function la llama
--      después de enviar el correo, para activar el cooldown.
--   4. pg_cron + pg_net: llama la Edge Function "notificaciones" una
--      vez al día con { action: "recordatorios_pendientes" }.
--
-- IMPORTANTE — antes de correr la sección 4, reemplaza:
--   - 'TU-PROYECTO' por el Project Ref real de tu Supabase
--     (Project Settings → General → Reference ID)
--   - 'TU_WEBHOOK_SECRET' por el mismo valor que ya tienes en
--     Edge Functions → notificaciones → Secrets → WEBHOOK_SECRET
--
-- Nota de seguridad: el secreto queda guardado en texto plano dentro
-- de cron.job (tabla del sistema, solo visible para el dueño del
-- proyecto). Si más adelante quieres evitar eso, Supabase Vault
-- permite guardar el secreto cifrado y leerlo desde el cron job —
-- por ahora se deja simple, igual que el resto del proyecto.
--
-- Seguro de correr más de una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. company_reminder_log
-- ---------------------------------------------------------------------

create table if not exists public.company_reminder_log (
  company_id uuid primary key
    references public.company_profiles(id)
    on delete cascade,
  last_sent_at timestamptz not null default now()
);

alter table public.company_reminder_log enable row level security;

-- Solo la Edge Function (service_role) toca esta tabla; nadie más
-- necesita verla ni modificarla.
drop policy if exists cgt_service_role_only on public.company_reminder_log;

create policy cgt_service_role_only
  on public.company_reminder_log
  for all
  using (false)
  with check (false);


-- ---------------------------------------------------------------------
-- 2. empresas_con_pendientes_atrasados()
-- ---------------------------------------------------------------------

create or replace function public.empresas_con_pendientes_atrasados(
  umbral_dias int default 3,
  cooldown_dias int default 3
)
returns table (
  company_id uuid,
  company_name text,
  pendientes bigint,
  dias_mas_antiguo integer,
  destinatario_email text
)
language sql
security definer
set search_path = public
stable
as $$
  with atrasados as (
    select
      j.company_id,
      count(a.id) as pendientes,
      max(
        extract(day from now() - a.applied_at)
      )::integer as dias_mas_antiguo
    from public.applications a
    join public.jobs j on j.id = a.job_id
    where a.current_status = 'applied'
      and a.applied_at <= now() - (umbral_dias || ' days')::interval
    group by j.company_id
  ),
  elegibles as (
    select at.*
    from atrasados at
    left join public.company_reminder_log rl
      on rl.company_id = at.company_id
    where rl.last_sent_at is null
       or rl.last_sent_at <= now() - (cooldown_dias || ' days')::interval
  ),
  destinatarios as (
    select cp.id as company_id, cp.email
    from public.company_profiles cp
    where cp.email is not null and trim(cp.email) <> ''

    union

    select cm.company_id, cm.email
    from public.company_members cm
    where cm.status = 'activo'
      and cm.role in ('dueno', 'reclutador')
      and cm.email is not null and trim(cm.email) <> ''
  )
  select
    e.company_id,
    cp.company_name,
    e.pendientes,
    e.dias_mas_antiguo,
    d.email as destinatario_email
  from elegibles e
  join public.company_profiles cp on cp.id = e.company_id
  join destinatarios d on d.company_id = e.company_id;
$$;

-- Expone correos de empresas: solo el backend (service_role) la usa.
revoke all on function public.empresas_con_pendientes_atrasados(int, int)
  from public;

grant execute on function public.empresas_con_pendientes_atrasados(int, int)
  to service_role;


-- ---------------------------------------------------------------------
-- 3. marcar_recordatorio_enviado()
-- ---------------------------------------------------------------------

create or replace function public.marcar_recordatorio_enviado(
  p_company_id uuid
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.company_reminder_log (company_id, last_sent_at)
  values (p_company_id, now())
  on conflict (company_id) do update
    set last_sent_at = excluded.last_sent_at;
$$;

revoke all on function public.marcar_recordatorio_enviado(uuid) from public;

grant execute on function public.marcar_recordatorio_enviado(uuid)
  to service_role;


-- ---------------------------------------------------------------------
-- 4. Cron diario — EDITA los dos valores marcados antes de correr esto
-- ---------------------------------------------------------------------

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  if exists (
    select 1 from cron.job
    where jobname = 'recordatorio-pendientes-diario'
  ) then
    perform cron.unschedule('recordatorio-pendientes-diario');
  end if;
end $$;

select cron.schedule(
  'recordatorio-pendientes-diario',
  '0 14 * * *',  -- 14:00 UTC = 8:00 am Guatemala
  $$
  select net.http_post(
    url := 'https://xkgxikcurtpdpfhjvoay.supabase.co/functions/v1/notificaciones',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', 'TU_WEBHOOK_SECRET'
    ),
    body := jsonb_build_object('action', 'recordatorios_pendientes')
  );
  $$
);
