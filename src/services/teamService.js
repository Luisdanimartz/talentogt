import { supabase } from "../lib/supabase";
import { getCompanyProfileByUserId } from "./companyService";

/*
  Equipo de la empresa (tabla company_members).

  Roles:
    dueno       -> todo, incluida la gestion del equipo
    reclutador  -> vacantes, candidatos y entrevistas
    observador  -> solo lectura
*/

export const TEAM_ROLES = [
  { value: "dueno", label: "Dueño" },
  { value: "reclutador", label: "Reclutador" },
  { value: "observador", label: "Observador" },
];

export const ROLE_LABELS = Object.fromEntries(
  TEAM_ROLES.map((r) => [r.value, r.label])
);

/* Permisos en un solo lugar, para que toda la app hable igual */
export function puedeGestionarEquipo(role) {
  return role === "dueno";
}

export function puedeGestionarCandidatos(role) {
  return role === "dueno" || role === "reclutador";
}

export function puedeCrearVacantes(role) {
  return role === "dueno" || role === "reclutador";
}

/*
  ¿Quien soy en que empresa?

  1. Si el usuario CREO el perfil de empresa -> es el dueño.
  2. Si no, reclama invitaciones pendientes a su correo
     (status invitado -> activo, conecta su cuenta).
  3. Devuelve { company, role } o { company: null }.
*/
export async function getMyCompanyContext() {

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      company: null,
      role: null,
      error: authError ?? new Error("Usuario no autenticado"),
    };
  }

  /* 1. ¿Creador del perfil de empresa? -> dueño */
  const { data: ownCompany } = await getCompanyProfileByUserId(user.id);

  if (ownCompany) {
    return { company: ownCompany, role: "dueno", error: null };
  }

  /* 2. Reclamar invitaciones pendientes a mi correo */
  if (user.email) {
    await supabase
      .from("company_members")
      .update({ user_id: user.id, status: "activo" })
      .is("user_id", null)
      .ilike("email", user.email);
  }

  /* 3. Buscar mi membresia activa (con el perfil de la empresa) */
  const { data: membership, error } = await supabase
    .from("company_members")
    .select(`
      role,
      status,
      company_profiles (
        id,
        user_id,
        company_name,
        legal_name,
        nit,
        phone,
        email,
        website,
        logo,
        description,
        address,
        department_id,
        municipality_id,
        status,
        created_at,
        updated_at
      )
    `)
    .eq("user_id", user.id)
    .eq("status", "activo")
    .limit(1)
    .maybeSingle();

  if (error) {
    return { company: null, role: null, error };
  }

  if (!membership?.company_profiles) {
    return { company: null, role: null, error: null };
  }

  return {
    company: membership.company_profiles,
    role: membership.role,
    error: null,
  };

}

/* Lista del equipo de una empresa */
export async function getTeamMembers(companyId) {

  return await supabase
    .from("company_members")
    .select("id, email, role, status, created_at, user_id")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

}

/*
  Invitar por correo: crea la fila 'invitado'. La persona se
  registra en ChanceGT (rol empresa) con ESE correo y entra
  directo al panel de la empresa.
*/
export async function inviteMember(companyId, email, role) {

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return await supabase
    .from("company_members")
    .insert({
      company_id: companyId,
      email: email.trim().toLowerCase(),
      role,
      status: "invitado",
      invited_by: user?.id || null,
    })
    .select("id, email, role, status, created_at, user_id")
    .single();

}

/* Cambiar el rol de un miembro */
export async function updateMemberRole(memberId, role) {

  return await supabase
    .from("company_members")
    .update({ role })
    .eq("id", memberId)
    .select("id, role")
    .single();

}

/* Quitar a un miembro (o cancelar una invitacion) */
export async function removeMember(memberId) {

  return await supabase
    .from("company_members")
    .delete()
    .eq("id", memberId);

}
