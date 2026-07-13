import { supabase } from "../lib/supabase";

/*
  Datos publicos de la landing page. Sin sesion, solo lo que ya
  esta pensado para verse afuera: empresas VIP (nombre + logo) y
  numeros generales reales de la plataforma.
*/

export async function getVipCompanies() {
  return await supabase
    .from("company_profiles")
    .select("id, company_name, logo")
    .eq("status", "activa")
    .eq("plan", "vip")
    .not("logo", "is", null)
    .order("company_name");
}

export async function getCollaboratorCompanies() {
  return await supabase
    .from("company_profiles")
    .select("id, company_name, logo")
    .eq("status", "activa")
    .eq("is_collaborator", true)
    .not("logo", "is", null)
    .order("company_name");
}

export async function getTopResponseCompanies(limit = 10) {
  return await supabase.rpc("platform_top_response_companies", {
    p_limit: limit,
    p_min_postulaciones: 3,
  });
}

export async function getPlatformStats() {
  return await supabase.rpc("platform_public_stats").single();
}
