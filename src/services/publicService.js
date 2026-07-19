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
    .select("id, company_name, logo, collaborator_comment")
    .eq("status", "activa")
    .eq("is_collaborator", true)
    .not("logo", "is", null)
    .order("company_name");
}

/* Empresas destacadas: las mejor calificadas con el sistema de
   estrellas real (responden al menos el 80% con un minimo de
   postulaciones). Ver database/054. */
export async function getFeaturedCompanies(limit = 10) {
  return await supabase.rpc("platform_featured_companies", {
    p_limit: limit,
    p_min_postulaciones: 3,
  });
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

/* Testimonios reales de empresas para el landing. Si no hay
   ninguno, la sección no se muestra. */
export async function getTestimonials() {
  return await supabase
    .from("testimonials")
    .select("id, company_name, logo_url, quote, person_name, person_role")
    .order("orden")
    .order("created_at");
}
