import { supabase } from "../lib/supabase";

/* ===========================
   CATÁLOGOS
=========================== */

export async function getJobCategories() {
  return await supabase
    .from("job_categories")
    .select("id, name")
    .order("name");
}

export async function getEmploymentTypes() {
  return await supabase
    .from("employment_types")
    .select("id, name")
    .order("id");
}

export async function getEducationLevels() {
  return await supabase
    .from("education_levels")
    .select("id, name")
    .order("id");
}

/* ===========================
   VACANTES
=========================== */

export async function createJob(job) {
  return await supabase
    .from("jobs")
    .insert(job)
    .select()
    .single();
}

export async function getCompanyJobs(companyId) {
  return await supabase
    .from("jobs")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
}

export async function getJobById(jobId) {
  return await supabase
    .from("jobs")
    .select(`
      *,
      company_profiles ( company_name, logo, status )
    `)
    .eq("id", jobId)
    .single();
}

export async function updateJob(jobId, job) {
  return await supabase
    .from("jobs")
    .update(job)
    .eq("id", jobId)
    .select()
    .single();
}

/*
  Solo vacantes publicadas de empresas ACTIVAS. Si el admin
  suspende una empresa, sus vacantes desaparecen de aqui de
  inmediato (y reaparecen solas si la reactiva) sin tener que
  tocar cada vacante una por una.
*/
export async function getPublishedJobs() {
  return await supabase
    .from("jobs")
    .select(`
      id,
      title,
      work_mode,
      salary_min,
      salary_max,
      published_at,
      department_id,
      municipality_id,
      category_id,
      employment_type_id,
      experience_level,
      contract_type,
      is_urgent,
      description,
      requirements,
      benefits,
      company_id,
      company_profiles!inner ( company_name, description, logo, status )
    `)
    .eq("status", "published")
    .eq("company_profiles.status", "activa")
    .order("published_at", { ascending: false });
}
/* Estrellas de respuesta: numeros agregados via la funcion 005 */
export async function getCompanyResponseStats(companyId) {
  return await supabase.rpc("company_response_stats", {
    cid: companyId,
  });
}

/* Resumen de tiempo de respuesta de TODAS las empresas de una vez,
   para poder ordenar el listado de vacantes por "responde más
   rápido". Ver database/034_respuesta_publica_por_empresa.sql */
export async function getPublicCompanyResponseSummary() {
  return await supabase.rpc("public_company_response_summary");
}

/* Comparativa agregada de postulantes de una vacante (funcion 006) */
export async function getJobApplicantStats(jobId) {
  return await supabase.rpc("job_applicant_stats", {
    jid: jobId,
  });
}

/* Saldo de creditos de la empresa logueada (publicaciones y
   destacados disponibles). Ver database/041_creditos_consumibles.sql */
export async function getMyJobCredits() {
  const { data, error } = await supabase.rpc("get_my_job_credits");

  if (error) return { data: null, error };

  return { data: data?.[0] || null, error: null };
}

/* Republicar gratis una vacante que no se llenó en 7 dias
   (solo 1 vez por vacante, plan Individual). */
export async function republishJobFree(jobId) {
  return await supabase.rpc("republish_job_free", {
    p_job_id: jobId,
  });
}
