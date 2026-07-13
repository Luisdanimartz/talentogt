-- =====================================================================
-- 015 - Logo de la empresa (Supabase Storage)
--
-- Crea el "bucket" (carpeta de almacenamiento) publico donde se
-- guardan los logos, y las reglas de quien puede subir/reemplazar/
-- borrar cada archivo.
--
-- Convencion de nombres: cada logo se guarda como
--   company-logos/{company_id}/logo.<extension>
-- Eso permite que la regla de seguridad identifique la empresa
-- dueña del archivo solo con el nombre de la carpeta, sin
-- necesidad de una tabla aparte.
--
-- Seguro de correr mas de una vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. El bucket (publico: cualquiera puede VER un logo con su URL,
--    como corresponde para que se vea en las vacantes publicas)
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('company-logos', 'company-logos', true)
on conflict (id) do nothing;


-- ---------------------------------------------------------------------
-- 2. Reglas de acceso
-- ---------------------------------------------------------------------

-- Lectura publica (redundante con "public bucket", pero explicito)
drop policy if exists cgt_logos_public_read on storage.objects;
create policy cgt_logos_public_read
  on storage.objects
  for select
  using (bucket_id = 'company-logos');

-- Solo el equipo de la empresa (dueno o reclutador) puede subir
-- un logo NUEVO, y solo dentro de la carpeta de SU propia empresa.
drop policy if exists cgt_logos_team_upload on storage.objects;
create policy cgt_logos_team_upload
  on storage.objects
  for insert
  with check (
    bucket_id = 'company-logos'
    and public.is_company_member(
      (storage.foldername(name))[1]::uuid,
      array['dueno', 'reclutador']
    )
  );

-- Reemplazar el logo existente
drop policy if exists cgt_logos_team_update on storage.objects;
create policy cgt_logos_team_update
  on storage.objects
  for update
  using (
    bucket_id = 'company-logos'
    and public.is_company_member(
      (storage.foldername(name))[1]::uuid,
      array['dueno', 'reclutador']
    )
  )
  with check (
    bucket_id = 'company-logos'
    and public.is_company_member(
      (storage.foldername(name))[1]::uuid,
      array['dueno', 'reclutador']
    )
  );

-- Quitar el logo
drop policy if exists cgt_logos_team_delete on storage.objects;
create policy cgt_logos_team_delete
  on storage.objects
  for delete
  using (
    bucket_id = 'company-logos'
    and public.is_company_member(
      (storage.foldername(name))[1]::uuid,
      array['dueno', 'reclutador']
    )
  );
