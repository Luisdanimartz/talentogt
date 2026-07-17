-- =====================================================================
-- 046 - Reclutador incluye "Ver perfil completo" sin gastar créditos
--
-- Antes, "Ver perfil completo" (Q25 c/u) era un sistema de créditos
-- totalmente separado del plan Reclutador — ni siquiera con
-- vacantes ilimitadas, la empresa podía ver un candidato sin
-- créditos propios de desbloqueo. Ahora, mientras el plan Reclutador
-- esté vigente, ver cualquier perfil no cuesta nada (se sigue
-- registrando en candidate_unlocks como siempre, solo que no
-- descuenta saldo).
--
-- Individual y Empresarial (créditos) no cambian: siguen necesitando
-- créditos de "Ver perfil completo" por separado, como hasta hoy.
--
-- Requiere 024 (creditos de desbloqueo) y 041/045 (planes). Segura
-- de correr más de una vez.
-- =====================================================================

create or replace function public.unlock_candidate_profile(
  p_company_id uuid,
  p_candidate_profile_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ya_desbloqueado boolean;
  v_creditos integer;
  v_visible boolean;
  v_job_limit integer;
begin

  if not public.is_company_member(p_company_id, array['dueno','reclutador']) then
    raise exception 'No tienes permiso para desbloquear candidatos.';
  end if;

  select visible_en_busqueda into v_visible
  from public.candidate_profiles
  where id = p_candidate_profile_id;

  if v_visible is not true then
    raise exception 'Este perfil ya no está disponible para búsqueda.';
  end if;

  select exists (
    select 1 from public.candidate_unlocks
    where company_id = p_company_id
      and candidate_profile_id = p_candidate_profile_id
  ) into v_ya_desbloqueado;

  if v_ya_desbloqueado then
    return true;
  end if;

  -- Reclutador (plan ilimitado, job_limit = null): incluido gratis,
  -- no descuenta créditos de "Ver perfil completo".
  select job_limit into v_job_limit
  from public.get_company_active_plan(p_company_id);

  if v_job_limit is null then

    insert into public.candidate_unlocks (company_id, candidate_profile_id, unlocked_by)
    values (p_company_id, p_candidate_profile_id, auth.uid());

    return true;

  end if;

  select unlock_credits into v_creditos
  from public.company_profiles
  where id = p_company_id
  for update;

  if coalesce(v_creditos, 0) < 1 then
    raise exception 'No tienes créditos disponibles para desbloquear más perfiles.';
  end if;

  update public.company_profiles
  set unlock_credits = unlock_credits - 1
  where id = p_company_id;

  insert into public.candidate_unlocks (company_id, candidate_profile_id, unlocked_by)
  values (p_company_id, p_candidate_profile_id, auth.uid());

  return true;

end;
$$;

revoke all on function public.unlock_candidate_profile(uuid, uuid) from public;
grant execute on function public.unlock_candidate_profile(uuid, uuid) to authenticated;
