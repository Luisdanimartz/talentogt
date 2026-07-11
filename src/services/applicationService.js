import { supabase } from "../lib/supabase";

/*
  Postulaciones vistas desde el lado de la EMPRESA.
  (El lado del candidato vive en candidateService.js)
*/

/*
  Todas las postulaciones a las vacantes de una empresa,
  con datos del candidato y de la vacante.
*/
export async function getCompanyApplications(companyId) {

  return await supabase
    .from("applications")
    .select(`
      id,
      current_status,
      applied_at,
      jobs!inner ( id, title, company_id ),
      candidate_profiles (
        id,
        first_name,
        last_name,
        profession,
        phone,
        department,
        municipality
      )
    `)
    .eq("jobs.company_id", companyId)
    .order("applied_at", { ascending: false });

}

/*
  La empresa cambia el estado de una postulación
  (En revisión, Entrevista, Contratado, No seleccionado).
*/
export async function updateApplicationStatus(applicationId, status) {

  return await supabase
    .from("applications")
    .update({ current_status: status })
    .eq("id", applicationId)
    .select("id, current_status")
    .single();

}
