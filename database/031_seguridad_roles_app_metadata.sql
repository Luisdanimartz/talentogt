-- =====================================================================
-- 031 - Seguridad de roles: mover de user_metadata a app_metadata
--
-- PROBLEMA:
-- is_admin() y las funciones de admin verificaban el rol leyendo
-- auth.users.raw_user_meta_data ->> 'role'. Ese campo corresponde a
-- "user_metadata" en Supabase Auth, que CUALQUIER usuario autenticado
-- puede modificar desde el navegador con:
--
--   supabase.auth.updateUser({ data: { role: 'admin' } })
--
-- sin pasar por el codigo de la app. Eso permitia que cualquier
-- candidato o empresa se auto-asignara el rol admin y entrara al
-- panel admin.
--
-- SOLUCION:
-- Usar raw_app_meta_data ("app_metadata") en su lugar. Ese campo NO
-- se puede modificar desde el cliente (supabase.auth.updateUser lo
-- ignora); solo se puede escribir con la service role key o, como
-- aqui, desde una funcion de Postgres con privilegios elevados.
--
-- IMPORTANTE - ANTES DE CORRER ESTA MIGRACION:
-- Ejecuta primero esto en el SQL Editor y revisa la lista con cuidado.
-- Cualquier admin que no reconozcas ahi pudo haberse auto-asignado el
-- rol explotando el problema descrito arriba:
--
--   select * from public.admin_list_admins();
--
-- Si ves un admin que no reconoces, quitale el rol ANTES de aplicar
-- esta migracion:
--
--   select public.admin_set_role_by_email('correo-sospechoso@ejemplo.com', 'candidato');
--
-- Segura de correr mas de una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Trigger: al crear un usuario nuevo, copiar su rol (validado) de
--    user_metadata a app_metadata. Solo corre en el registro (INSERT),
--    nunca en updates posteriores, asi que un usuario que despues
--    cambia su user_metadata.role no logra nada.
-- ---------------------------------------------------------------------

create or replace function public.sync_role_to_app_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin

  v_role := new.raw_user_meta_data ->> 'role';

  -- Nunca confiar en 'admin' viniendo del registro publico.
  -- El unico rol valido al registrarse es candidato o empresa;
  -- cualquier otra cosa (incluido admin) cae a candidato.
  if v_role not in ('candidato', 'empresa') then
    v_role := 'candidato';
  end if;

  new.raw_app_meta_data :=
    coalesce(new.raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', v_role);

  return new;

end;
$$;

drop trigger if exists cgt_set_role_on_signup on auth.users;
create trigger cgt_set_role_on_signup
  before insert on auth.users
  for each row
  execute function public.sync_role_to_app_metadata();


-- ---------------------------------------------------------------------
-- 2. Backfill: usuarios que ya existen. Copia su rol actual de
--    user_metadata a app_metadata, PRESERVANDO admin (por eso primero
--    tienes que revisar la lista de admins como se explico arriba).
-- ---------------------------------------------------------------------

update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object(
       'role',
       case
         when raw_user_meta_data ->> 'role' in ('admin', 'empresa', 'candidato')
           then raw_user_meta_data ->> 'role'
         else 'candidato'
       end
     )
where raw_app_meta_data ->> 'role' is null;


-- ---------------------------------------------------------------------
-- 3. is_admin(): ahora lee app_metadata, no user_metadata.
-- ---------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from auth.users u
    where u.id = auth.uid()
      and u.raw_app_meta_data ->> 'role' = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;


-- ---------------------------------------------------------------------
-- 4. admin_list_admins(): lee el rol de app_metadata; nombre y
--    apellido se quedan en user_metadata (esos si son campos que el
--    usuario puede editar sin ningun riesgo de seguridad).
-- ---------------------------------------------------------------------

drop function if exists public.admin_list_admins();

create or replace function public.admin_list_admins()
returns table (
  user_id uuid,
  email text,
  first_name text,
  last_name text
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
    u.id,
    u.email::text,
    (u.raw_user_meta_data ->> 'names')::text,
    (u.raw_user_meta_data ->> 'lastname')::text
  from auth.users u
  where u.raw_app_meta_data ->> 'role' = 'admin'
  order by u.email;

end;
$$;

revoke all on function public.admin_list_admins() from public;
grant execute on function public.admin_list_admins() to authenticated;


-- ---------------------------------------------------------------------
-- 5. admin_set_role_by_email(): ahora escribe en app_metadata.
-- ---------------------------------------------------------------------

create or replace function public.admin_set_role_by_email(
  p_email text,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin

  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  if p_role not in ('admin', 'empresa', 'candidato') then
    raise exception 'Rol invalido: %', p_role;
  end if;

  select id into v_user_id
  from auth.users
  where lower(email) = lower(trim(p_email));

  if v_user_id is null then
    raise exception
      'No existe ningun usuario registrado con el correo %', p_email;
  end if;

  update auth.users
  set raw_app_meta_data =
    coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', p_role)
  where id = v_user_id;

end;
$$;

revoke all on function public.admin_set_role_by_email(text, text) from public;
grant execute on function public.admin_set_role_by_email(text, text)
  to authenticated;


-- ---------------------------------------------------------------------
-- 6. Bucket de logos: limite de tamano y tipos de archivo tambien a
--    nivel de Supabase Storage (antes solo se validaba en el
--    frontend, lo que se podia saltar llamando la API directo).
-- ---------------------------------------------------------------------

update storage.buckets
set
  file_size_limit = 2097152, -- 2MB, igual al limite del frontend
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id = 'company-logos';
