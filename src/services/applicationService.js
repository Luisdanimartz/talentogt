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
      jobs!inner ( id, title, description, requirements, department_id, salary_min, salary_max, company_id ),
      interviews ( id, status, scheduled_at ),
      candidate_profiles (
        id,
        first_name,
        last_name,
        profession,
        phone,
        department,
        municipality,
        education_level,
        education_institution,
        experience,
        skills,
        expected_salary,
        candidate_education ( level, institution, graduation_year ),
        candidate_experience ( job_title, company, years )
      )
    `)
    .eq("jobs.company_id", companyId)
    .order("applied_at", { ascending: false });

}

/*
  Datos completos de UNA postulación para que la empresa
  vea/descargue el CV del candidato (misma info que ve el
  propio candidato en "Mi CV", pero desde el lado empresa).
*/
export async function getApplicationForCV(applicationId) {

  return await supabase
    .from("applications")
    .select(`
      id,
      applied_at,
      jobs!inner ( id, title, company_id ),
      candidate_profiles (
        id,
        first_name,
        middle_name,
        last_name,
        second_last_name,
        phone,
        profession,
        department,
        municipality,
        address,
        education_level,
        education_institution,
        education_year,
        experience,
        skills,
        summary,
        linkedin,
        availability,
        expected_salary,
        candidate_education ( id, level, career_name, status, institution, graduation_year ),
        candidate_experience ( id, job_title, company, years, period, description, reference_phone )
      )
    `)
    .eq("id", applicationId)
    .single();

}

/*
  La empresa cambia el estado de una postulación
  (En revisión, Entrevista, Contratado, No seleccionado).
*/
export async function updateApplicationStatus(applicationId, status) {

  const result = await supabase
    .from("applications")
    .update({ current_status: status })
    .eq("id", applicationId)
    .select("id, current_status")
    .single();

  /* Queda registrado en la linea de tiempo del candidato */
  if (result.data) {
    await supabase.from("application_status_history").insert({
      application_id: applicationId,
      status,
    });
  }

  return result;

}

/*
  Finaliza el proceso de una vacante: a todos los candidatos que
  seguian en proceso (no contratados, no ya descartados) se les
  marca "No seleccionado" — esto dispara automaticamente el
  correo de aviso, reusando el mismo sistema de notificaciones
  que ya existe (no hace falta nada nuevo ahi).
*/
export async function finalizeJobApplications(jobId) {

  const { data: pendientes, error: fetchError } = await supabase
    .from("applications")
    .select("id")
    .eq("job_id", jobId)
    .not("current_status", "in", "(hired,rejected)");

  if (fetchError) {
    return { data: null, error: fetchError, notificados: 0 };
  }

  const lista = pendientes || [];

  if (lista.length === 0) {
    return { data: [], error: null, notificados: 0 };
  }

  const resultados = await Promise.all(
    lista.map((app) => updateApplicationStatus(app.id, "rejected"))
  );

  const fallidos = resultados.filter((r) => r.error);

  if (fallidos.length > 0) {
    return {
      data: resultados,
      error: fallidos[0].error,
      notificados: lista.length - fallidos.length,
    };
  }

  return { data: resultados, error: null, notificados: lista.length };

}
