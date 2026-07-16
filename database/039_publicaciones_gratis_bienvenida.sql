-- =====================================================================
-- 039 - 2 publicaciones gratis para toda empresa nueva
--
-- PROBLEMA:
-- Al crear su perfil, una empresa nunca recibía ninguna fila en
-- company_pricing_assignments. Sin esa fila, get_company_active_plan()
-- (026/027) la trata como "Sin plan asignado" -> job_limit = 0, y el
-- trigger cgt_enforce_job_limit (026) le bloquea CUALQUIER publicación.
-- Por eso ninguna empresa nueva podía publicar.
--
-- SOLUCIÓN:
-- 1. Trigger en company_profiles: en cuanto se crea el perfil de una
--    empresa, se le regalan automáticamente 2 publicaciones gratis
--    (mismo mecanismo que ya usas para regalos manuales, columna
--    free_posts_granted, sin plan de pago asociado).
--
-- 2. Backfill: a las empresas que YA se registraron y se quedaron
--    atrapadas en 0 (nunca tuvieron ninguna fila en
--    company_pricing_assignments), se les regala también ahora,
--    para no dejarlas atascadas.
--
-- Requiere 017 (tarifario) y 026/027 (límites de plan). Segura de
-- correr más de una vez (no duplica el regalo de bienvenida si ya
-- se le dio a esa empresa).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Trigger: regalo de bienvenida al crear el perfil de empresa
-- ---------------------------------------------------------------------

create or replace function public.grant_welcome_free_posts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  insert into public.company_pricing_assignments (
    company_id,
    pricing_plan_id,
    free_posts_granted,
    started_at,
    expires_at,
    notes
  )
  values (
    new.id,
    null,
    2,
    now(),
    null,
    'Regalo de bienvenida: 2 publicaciones gratis al registrarse'
  );

  return new;

end;
$$;

drop trigger if exists cgt_grant_welcome_free_posts on public.company_profiles;

create trigger cgt_grant_welcome_free_posts
  after insert on public.company_profiles
  for each row execute function public.grant_welcome_free_posts();


-- ---------------------------------------------------------------------
-- 2. Backfill: empresas que ya existían y nunca tuvieron ninguna
--    asignación (ni plan de pago ni regalo). Se les da el mismo
--    regalo de bienvenida ahora, una sola vez.
-- ---------------------------------------------------------------------

insert into public.company_pricing_assignments (
  company_id,
  pricing_plan_id,
  free_posts_granted,
  started_at,
  expires_at,
  notes
)
select
  c.id,
  null,
  2,
  now(),
  null,
  'Regalo de bienvenida (retroactivo): se corrigió el 16/07/2026'
from public.company_profiles c
where not exists (
  select 1
  from public.company_pricing_assignments cpa
  where cpa.company_id = c.id
);
