-- =====================================================================
-- 010 - Reclamo de invitacion via funcion segura
--
-- El intento anterior reclamaba la invitacion con un UPDATE directo
-- desde el navegador, protegido por politicas RLS. Eso demostro ser
-- fragil (dependia de que la combinacion de politicas RLS se evaluara
-- bien). Esta version usa una funcion SECURITY DEFINER: mas simple,
-- mas confiable, mismo patron que ya usamos en is_company_member.
--
-- La funcion SOLO conecta invitaciones cuyo correo sea EXACTAMENTE
-- el correo autenticado de quien la llama (auth.jwt() ->> 'email').
-- No permite tocar la fila de nadie mas.
--
-- Seguro de correr mas de una vez.
-- =====================================================================

create or replace function public.claim_my_invitations()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.company_members
  set
    user_id = auth.uid(),
    status = 'activo'
  where
    user_id is null
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''));
end;
$$;

revoke all on function public.claim_my_invitations() from public;
grant execute on function public.claim_my_invitations() to authenticated;
