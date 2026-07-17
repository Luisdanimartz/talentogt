-- =====================================================================
-- 041 - Créditos consumibles de verdad, cierre a 30 días,
--        republicación gratis, y destacados controlados
--
-- CAMBIO DE FONDO: tu sistema de hoy (job_limit) cuenta cuántas
-- vacantes tienes ACTIVAS AL MISMO TIEMPO, no cuántas has usado en
-- total. Si cerrabas una y publicabas otra, nunca se te acababan los
-- "créditos" de verdad. Esta migración separa las dos cosas:
--
--   - Reclutador (plan de pago, job_limit = null = ilimitado) sigue
--     funcionando igual, sin límite.
--   - Individual y Empresarial pasan a un saldo real y consumible
--     (job_credits_remaining), que se descuenta 1 cada vez que se
--     publica una vacante, para siempre, sin importar si la cierras
--     después. Igual que ya funciona "Ver perfil completo".
--
-- Incluye:
--   1. Columnas nuevas en company_profiles y jobs.
--   2. Trigger que retira 1 crédito al publicar (y bloquea si no
--      quedan). Se elimina el chequeo viejo de "cupo simultáneo".
--   3. Trigger que retira 1 "destacado" al marcar una vacante como
--      urgente (a menos que la empresa tenga destacado ilimitado,
--      del plan Reclutador Plus).
--   4. admin_grant_credits(): para que tú, como admin, le des
--      créditos/destacados/usuarios a una empresa cuando confirmes
--      su pago.
--   5. Cierre automático de vacantes a los 30 días (pg_cron).
--   6. republish_job_free(): la republicación gratis del plan
--      Individual, una vez por vacante, después de 7 días.
--   7. get_my_job_credits(): para que la empresa vea su propio saldo.
--
-- Requiere 005, 013, 014, 026, 027, 037 (pg_cron ya debe estar
-- habilitado desde la migración de publicación programada). Segura
-- de correr más de una vez, salvo el paso 1.b (backfill) que solo
-- debe importarte la primera vez que la corres.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1.a Columnas nuevas
-- ---------------------------------------------------------------------

alter table public.company_profiles
  add column if not exists job_credits_remaining integer not null default 0,
  add column if not exists destacado_credits_remaining integer not null default 0,
  add column if not exists destacado_ilimitado boolean not null default false;

alter table public.company_pricing_assignments
  add column if not exists seat_limit_override integer;

alter table public.jobs
  add column if not exists free_republish_used boolean not null default false;


-- ---------------------------------------------------------------------
-- 1.b Backfill: las 2 publicaciones gratis de bienvenida (039) ya
--     regaladas se convierten en saldo real ahora. Solo debe hacer
--     falta la primera vez que corras este archivo.
-- ---------------------------------------------------------------------

update public.company_profiles c
set job_credits_remaining = job_credits_remaining + sub.total
from (
  select
    cpa.company_id,
    sum(cpa.free_posts_granted) as total
  from public.company_pricing_assignments cpa
  where cpa.pricing_plan_id is null
    and cpa.free_posts_granted is not null
    and (cpa.expires_at is null or cpa.expires_at > now())
  group by cpa.company_id
) sub
where sub.company_id = c.id
  and c.job_credits_remaining = 0;


-- ---------------------------------------------------------------------
-- 2. El regalo de bienvenida (039) ahora también carga saldo real
-- ---------------------------------------------------------------------

create or replace function public.grant_welcome_free_posts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  insert into public.company_pricing_assignments (
    company_id, pricing_plan_id, free_posts_granted,
    started_at, expires_at, notes
  )
  values (
    new.id, null, 2, now(), null,
    'Regalo de bienvenida: 2 publicaciones gratis al registrarse'
  );

  update public.company_profiles
  set job_credits_remaining = job_credits_remaining + 2
  where id = new.id;

  return new;

end;
$$;


-- ---------------------------------------------------------------------
-- 3. Se retira el chequeo viejo de "cupo simultáneo" (job_limit) -
--    lo reemplaza el consumo real de créditos, mas abajo.
-- ---------------------------------------------------------------------

drop trigger if exists cgt_enforce_job_limit on public.jobs;


-- ---------------------------------------------------------------------
-- 4. Consumo real de 1 crédito al publicar/programar una vacante
-- ---------------------------------------------------------------------

create or replace function public.cgt_consume_job_credit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job_limit integer;
  v_credits integer;
begin

  -- Solo consume credito cuando la vacante EMPIEZA a ocupar espacio
  -- real (publicada o programada). Borrador/pausada/cerrada, no.
  if new.status not in ('published', 'scheduled') then
    return new;
  end if;

  if TG_OP = 'UPDATE' and old.status in ('published', 'scheduled') then
    -- Ya estaba publicada/programada; esto no es una vacante nueva.
    return new;
  end if;

  select job_limit into v_job_limit
  from public.get_company_active_plan(new.company_id);

  -- null = plan ilimitado (Reclutador) -> no gasta creditos
  if v_job_limit is null then
    return new;
  end if;

  select job_credits_remaining into v_credits
  from public.company_profiles
  where id = new.company_id;

  if coalesce(v_credits, 0) <= 0 then
    raise exception
      'No te quedan publicaciones disponibles. Compra más créditos o mejora tu plan desde /empresa/planes.';
  end if;

  update public.company_profiles
  set job_credits_remaining = job_credits_remaining - 1
  where id = new.company_id;

  return new;

end;
$$;

drop trigger if exists cgt_consume_job_credit on public.jobs;

create trigger cgt_consume_job_credit
  before insert or update on public.jobs
  for each row execute function public.cgt_consume_job_credit();


-- ---------------------------------------------------------------------
-- 5. Consumo real de 1 "destacado" al marcar una vacante urgente
-- ---------------------------------------------------------------------

create or replace function public.cgt_consume_destacado_credit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ilimitado boolean;
  v_credits integer;
begin

  if new.is_urgent is not true then
    return new;
  end if;

  if TG_OP = 'UPDATE' and old.is_urgent is true then
    -- Ya era urgente; no es un cambio nuevo, no se cobra otra vez.
    return new;
  end if;

  select destacado_ilimitado into v_ilimitado
  from public.company_profiles
  where id = new.company_id;

  if v_ilimitado then
    return new;
  end if;

  select destacado_credits_remaining into v_credits
  from public.company_profiles
  where id = new.company_id;

  if coalesce(v_credits, 0) <= 0 then
    raise exception
      'No tienes publicaciones destacadas disponibles. Solicita más desde /empresa/planes.';
  end if;

  update public.company_profiles
  set destacado_credits_remaining = destacado_credits_remaining - 1
  where id = new.company_id;

  return new;

end;
$$;

drop trigger if exists cgt_consume_destacado_credit on public.jobs;

create trigger cgt_consume_destacado_credit
  before insert or update on public.jobs
  for each row execute function public.cgt_consume_destacado_credit();


-- ---------------------------------------------------------------------
-- 6. get_company_active_plan(): ahora calcula tambien el seat_limit
--    real (Individual=1, Empresarial=3, etc.), tomando el mas
--    reciente que le hayas asignado a mano con admin_grant_credits.
-- ---------------------------------------------------------------------

create or replace function public.get_company_active_plan(p_company_id uuid)
returns table (
  plan_name text,
  job_limit integer,
  seat_limit integer
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_plan_pago record;
  v_gratis_acumuladas integer;
  v_seat_override integer;
begin

  -- 1. ¿Tiene un plan de PAGO vigente (Reclutador)? Ese manda sobre todo.
  select cpa.*, pp.name as plan_nombre, pp.job_limit as plan_job_limit,
         pp.seat_limit as plan_seat_limit
    into v_plan_pago
  from public.company_pricing_assignments cpa
  join public.pricing_plans pp on pp.id = cpa.pricing_plan_id
  where cpa.company_id = p_company_id
    and (cpa.expires_at is null or cpa.expires_at > now())
  order by cpa.started_at desc
  limit 1;

  if v_plan_pago is not null then
    return query select
      coalesce(v_plan_pago.plan_nombre, 'Plan'),
      v_plan_pago.plan_job_limit,
      v_plan_pago.plan_seat_limit;
    return;
  end if;

  -- 2. Sin plan de pago: usuarios permitidos = el mas reciente que
  --    se le haya asignado a mano (Individual=1, Empresarial=3...);
  --    si nunca se le asigno ninguno, 1 por defecto.
  select seat_limit_override into v_seat_override
  from public.company_pricing_assignments
  where company_id = p_company_id
    and pricing_plan_id is null
    and seat_limit_override is not null
    and (expires_at is null or expires_at > now())
  order by started_at desc
  limit 1;

  -- Suma historica de publicaciones gratis/compradas (informativo,
  -- el saldo real que se descuenta esta en company_profiles.
  -- job_credits_remaining, no aqui).
  select coalesce(sum(free_posts_granted), 0) into v_gratis_acumuladas
  from public.company_pricing_assignments
  where company_id = p_company_id
    and pricing_plan_id is null
    and free_posts_granted is not null
    and (expires_at is null or expires_at > now());

  if v_gratis_acumuladas > 0 then
    return query select
      'Créditos'::text,
      v_gratis_acumuladas,
      coalesce(v_seat_override, 1);
    return;
  end if;

  -- 3. Nada de nada.
  return query select
    'Sin plan asignado'::text,
    0,
    coalesce(v_seat_override, 1);

end;
$$;


-- ---------------------------------------------------------------------
-- 7. admin_grant_free_posts(): YA EXISTÍA (la usa el botón "Agregar
--    publicaciones gratis" que ya tienes en Empresas) — se actualiza
--    para que también cargue el saldo real y consumible
--    (job_credits_remaining), no solo el registro histórico.
-- ---------------------------------------------------------------------

create or replace function public.admin_grant_free_posts(
  p_company_id uuid,
  p_cantidad integer,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin

  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  insert into public.company_pricing_assignments (
    company_id, pricing_plan_id, free_posts_granted,
    started_at, expires_at, notes
  )
  values (
    p_company_id, null, p_cantidad, now(), null,
    coalesce(p_notes, 'Créditos otorgados por admin')
  );

  update public.company_profiles
  set job_credits_remaining = job_credits_remaining + p_cantidad
  where id = p_company_id;

end;
$$;

revoke all on function public.admin_grant_free_posts(uuid, integer, text) from public;
grant execute on function public.admin_grant_free_posts(uuid, integer, text) to authenticated;


-- ---------------------------------------------------------------------
-- 7.b Nuevo: otorgar publicaciones DESTACADAS (🔥 Urgente + prioridad)
-- ---------------------------------------------------------------------

create or replace function public.admin_grant_destacado_credits(
  p_company_id uuid,
  p_cantidad integer,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin

  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  update public.company_profiles
  set destacado_credits_remaining = destacado_credits_remaining + p_cantidad
  where id = p_company_id;

  insert into public.company_pricing_assignments (
    company_id, pricing_plan_id, free_posts_granted, started_at, expires_at, notes
  )
  values (
    p_company_id, null, 0, now(), null,
    coalesce(p_notes, format('%s publicaciones destacadas otorgadas por admin', p_cantidad))
  );

end;
$$;

revoke all on function public.admin_grant_destacado_credits(uuid, integer, text) from public;
grant execute on function public.admin_grant_destacado_credits(uuid, integer, text) to authenticated;


-- ---------------------------------------------------------------------
-- 7.c Nuevo: fijar cuántos usuarios de equipo puede tener una
--     empresa sin plan de pago (Individual = 1, Empresarial = 3...)
-- ---------------------------------------------------------------------

create or replace function public.admin_set_seat_limit(
  p_company_id uuid,
  p_seat_limit integer,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin

  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  insert into public.company_pricing_assignments (
    company_id, pricing_plan_id, free_posts_granted,
    seat_limit_override, started_at, expires_at, notes
  )
  values (
    p_company_id, null, 0, p_seat_limit, now(), null,
    coalesce(p_notes, format('Límite de usuarios fijado en %s por admin', p_seat_limit))
  );

end;
$$;

revoke all on function public.admin_set_seat_limit(uuid, integer, text) from public;
grant execute on function public.admin_set_seat_limit(uuid, integer, text) to authenticated;


-- ---------------------------------------------------------------------
-- 8. Cierre automático a los 30 días
-- ---------------------------------------------------------------------

create or replace function public.close_expired_jobs()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin

  update public.jobs
  set status = 'closed'
  where status = 'published'
    and published_at is not null
    and published_at <= now() - interval '30 days';

end;
$$;

select cron.unschedule('close-expired-jobs')
where exists (
  select 1 from cron.job where jobname = 'close-expired-jobs'
);

select cron.schedule(
  'close-expired-jobs',
  '10 3 * * *',
  $$select public.close_expired_jobs();$$
);


-- ---------------------------------------------------------------------
-- 9. Republicación gratis (plan Individual): 1 vez por vacante,
--    después de 7 días sin llenarse, sin gastar un crédito nuevo.
-- ---------------------------------------------------------------------

create or replace function public.republish_job_free(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.jobs;
  v_autorizado boolean;
begin

  select * into v_job from public.jobs where id = p_job_id;

  if v_job.id is null then
    raise exception 'Vacante no encontrada';
  end if;

  select exists (
    select 1 from public.company_profiles c
    where c.id = v_job.company_id and c.user_id = auth.uid()
  ) or exists (
    select 1 from public.company_members m
    where m.company_id = v_job.company_id and m.user_id = auth.uid()
  ) into v_autorizado;

  if not v_autorizado then
    raise exception 'No autorizado';
  end if;

  if v_job.free_republish_used then
    raise exception 'Esta vacante ya usó su republicación gratis.';
  end if;

  if v_job.status <> 'published' then
    raise exception 'Solo se puede republicar una vacante que sigue publicada.';
  end if;

  if v_job.published_at > now() - interval '7 days' then
    raise exception 'La republicación gratis solo aplica después de 7 días sin llenar la plaza.';
  end if;

  update public.jobs
  set published_at = now(), free_republish_used = true
  where id = p_job_id;

end;
$$;

revoke all on function public.republish_job_free(uuid) from public;
grant execute on function public.republish_job_free(uuid) to authenticated;


-- ---------------------------------------------------------------------
-- 10. Para que la empresa vea su propio saldo
-- ---------------------------------------------------------------------

create or replace function public.get_my_job_credits()
returns table (
  job_credits_remaining integer,
  destacado_credits_remaining integer,
  destacado_ilimitado boolean,
  plan_name text,
  job_limit integer,
  seat_limit integer
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_company_id uuid;
begin

  select id into v_company_id
  from public.company_profiles
  where user_id = auth.uid();

  if v_company_id is null then
    select cm.company_id into v_company_id
    from public.company_members cm
    where cm.user_id = auth.uid()
    limit 1;
  end if;

  if v_company_id is null then
    raise exception 'No se encontró tu empresa';
  end if;

  return query
  select
    c.job_credits_remaining,
    c.destacado_credits_remaining,
    c.destacado_ilimitado,
    gap.plan_name,
    gap.job_limit,
    gap.seat_limit
  from public.company_profiles c
  cross join lateral public.get_company_active_plan(c.id) gap
  where c.id = v_company_id;

end;
$$;

revoke all on function public.get_my_job_credits() from public;
grant execute on function public.get_my_job_credits() to authenticated;
