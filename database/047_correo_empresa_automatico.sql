-- =====================================================================
-- 047 - El correo de la empresa se llena solo, desde su cuenta
--
-- El formulario de crear/editar perfil nunca pedía correo (viven en
-- auth.users, la tabla de acceso, no en company_profiles). Por eso
-- el admin veía "Sin correo registrado" aunque la empresa sí tenga
-- correo con el que inicia sesión.
--
-- 1. Trigger: al crear el perfil, si no trae correo, lo copia solo
--    desde su cuenta de acceso.
-- 2. Backfill: rellena el correo de las empresas que ya existían.
--
-- Segura de correr más de una vez.
-- =====================================================================

create or replace function public.cgt_fill_company_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  if new.email is null or trim(new.email) = '' then

    select u.email into new.email
    from auth.users u
    where u.id = new.user_id;

  end if;

  return new;

end;
$$;

drop trigger if exists cgt_fill_company_email on public.company_profiles;

create trigger cgt_fill_company_email
  before insert on public.company_profiles
  for each row execute function public.cgt_fill_company_email();


-- Backfill de las que ya existían

update public.company_profiles c
set email = u.email
from auth.users u
where c.user_id = u.id
  and (c.email is null or trim(c.email) = '');
