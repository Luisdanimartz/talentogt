-- =========================================================
-- 028_fix_registro_creditos.sql
--
-- admin_add_unlock_credits fallaba al insertar el registro
-- de historial: free_posts_granted no admite null en esa
-- tabla. Se corrige usando 0 en vez de null (0 es "falsy" en
-- JS, asi que la pantalla igual muestra la nota en vez de
-- "0 publicaciones gratis").
-- =========================================================

create or replace function public.admin_add_unlock_credits(
  p_company_id uuid,
  p_amount integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nuevo_total integer;
begin

  if not public.is_admin() then
    raise exception 'Solo un administrador puede agregar créditos.';
  end if;

  update public.company_profiles
  set unlock_credits = greatest(0, unlock_credits + p_amount)
  where id = p_company_id
  returning unlock_credits into v_nuevo_total;

  if v_nuevo_total is null then
    raise exception 'No se encontró esa empresa.';
  end if;

  insert into public.company_pricing_assignments
    (company_id, pricing_plan_id, free_posts_granted, started_at, expires_at, notes, assigned_by)
  values
    (
      p_company_id, null, 0, now(), now(),
      p_amount || ' crédito(s) de búsqueda agregados (saldo: ' || v_nuevo_total || ')',
      auth.uid()
    );

  return v_nuevo_total;

end;
$$;
