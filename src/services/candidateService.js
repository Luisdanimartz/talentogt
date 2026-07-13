import { supabase } from "../lib/supabase";

/* ===========================
   PERFIL DEL CANDIDATO
   Tabla: candidate_profiles
=========================== */

const CANDIDATE_COLUMNS = `
  id,
  user_id,
  first_name,
  middle_name,
  last_name,
  second_last_name,
  phone,
  dpi,
  profession,
  department,
  municipality,
  address,
  birth_date,
  education_level,
  education_institution,
  education_year,
  experience,
  skills,
  summary,
  linkedin,
  availability,
  expected_salary,
  created_at,
  updated_at,
  candidate_education ( id, level, institution, graduation_year ),
  candidate_experience ( id, job_title, company, years, period, description )
`;

export async function getCurrentCandidateProfile() {

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      data: null,
      error: authError ?? new Error("Usuario no autenticado"),
    };
  }

  return await supabase
    .from("candidate_profiles")
    .select(CANDIDATE_COLUMNS)
    .eq("user_id", user.id)
    .maybeSingle();

}

/*
  Guarda el perfil: si ya existe lo actualiza,
  si no existe lo crea.
*/
export async function saveCandidateProfile(form, educationList = [], experienceList = []) {

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      data: null,
      error: authError ?? new Error("Usuario no autenticado"),
    };
  }

  const profile = {
    first_name: form.first_name || null,
    middle_name: form.middle_name || null,
    last_name: form.last_name || null,
    second_last_name: form.second_last_name || null,
    phone: form.phone || null,
    dpi: form.dpi || null,
    profession: form.profession || null,
    department: form.department || null,
    municipality: form.municipality || null,
    address: form.address || null,
    birth_date: form.birth_date || null,
    skills: form.skills || null,
    summary: form.summary || null,
    linkedin: form.linkedin || null,
    availability: form.availability || null,
    expected_salary: form.expected_salary || null,

    /*
      Columnas "resumen" (compatibilidad con el motor de
      coincidencias y la vista de la empresa): se generan
      automaticamente de las listas estructuradas.
    */
    education_level: educationList[0]?.level || null,
    education_institution: educationList[0]?.institution || null,
    education_year: educationList[0]?.graduation_year || null,
    experience: experienceList
      .filter((exp) => exp.job_title || exp.company)
      .map((exp) =>
        [
          exp.job_title,
          exp.company,
          /* years ya viene humano ("1 año 6 meses"); no agregar "años" */
          exp.years || null,
          exp.description || null,
        ]
          .filter(Boolean)
          .join(" — ")
      )
      .join("\n") || null,
  };

  const { data: existing } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  let result;

  if (existing) {

    result = await supabase
      .from("candidate_profiles")
      .update(profile)
      .eq("id", existing.id)
      .select(CANDIDATE_COLUMNS)
      .single();

  } else {

    result = await supabase
      .from("candidate_profiles")
      .insert({ user_id: user.id, ...profile })
      .select(CANDIDATE_COLUMNS)
      .single();

  }

  if (result.error || !result.data) {
    return result;
  }

  const profileId = result.data.id;

  /* Reemplazar formacion: borrar las filas viejas e insertar las nuevas */
  await supabase
    .from("candidate_education")
    .delete()
    .eq("candidate_profile_id", profileId);

  const educationRows = educationList
    .filter((edu) => edu.level || edu.institution)
    .map((edu) => ({
      candidate_profile_id: profileId,
      level: edu.level || null,
      institution: edu.institution || null,
      graduation_year: edu.graduation_year || null,
    }));

  if (educationRows.length > 0) {
    await supabase.from("candidate_education").insert(educationRows);
  }

  /* Reemplazar experiencia */
  await supabase
    .from("candidate_experience")
    .delete()
    .eq("candidate_profile_id", profileId);

  const experienceRows = experienceList
    .filter((exp) => exp.job_title || exp.company)
    .map((exp) => ({
      candidate_profile_id: profileId,
      job_title: exp.job_title || null,
      company: exp.company || null,
      years: exp.years || null,
      period: exp.period || null,
      description: exp.description || null,
    }));

  if (experienceRows.length > 0) {
    await supabase.from("candidate_experience").insert(experienceRows);
  }

  return result;

}

/* ===========================
   POSTULACIONES
   Tabla: applications
=========================== */

/*
  Devuelve la postulación del candidato a una vacante,
  o null si no se ha postulado.
*/
export async function getMyApplicationForJob(jobId) {

  const { data: profile } = await getCurrentCandidateProfile();

  if (!profile) {
    return { data: null, error: null };
  }

  return await supabase
    .from("applications")
    .select("id, current_status, applied_at")
    .eq("job_id", jobId)
    .eq("candidate_profile_id", profile.id)
    .maybeSingle();

}

/*
  Postula al candidato actual a una vacante.

  Posibles resultados:
  - { data }                        -> postulación creada
  - { error: { code: "NO_PROFILE" } }  -> aún no tiene perfil de CV
  - { error: { code: "DUPLICATE" } }   -> ya se había postulado
  - { error }                       -> error de Supabase (RLS, etc.)
*/
export async function applyToJob(jobId) {

  const { data: profile, error: profileError } =
    await getCurrentCandidateProfile();

  if (profileError) {
    return { data: null, error: profileError };
  }

  if (!profile) {
    return { data: null, error: { code: "NO_PROFILE" } };
  }

  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("job_id", jobId)
    .eq("candidate_profile_id", profile.id)
    .maybeSingle();

  if (existing) {
    return { data: null, error: { code: "DUPLICATE" } };
  }

  const result = await supabase
    .from("applications")
    .insert({
      job_id: jobId,
      candidate_profile_id: profile.id,
      current_status: "applied",
      applied_at: new Date().toISOString(),
    })
    .select("id, current_status, applied_at")
    .single();

  /* Primer evento de la linea de tiempo */
  if (result.data) {
    await supabase.from("application_status_history").insert({
      application_id: result.data.id,
      status: "applied",
    });
  }

  return result;

}

/*
  Postulaciones del candidato actual, con datos de la vacante,
  para mostrarlas en su dashboard.
*/
export async function getMyApplications() {

  const { data: profile } = await getCurrentCandidateProfile();

  if (!profile) {
    return { data: [], error: null };
  }

  return await supabase
    .from("applications")
    .select(`
      id,
      current_status,
      applied_at,
      updated_at,
      jobs (
        id,
        title,
        status,
        company_profiles ( company_name, logo )
      )
    `)
    .eq("candidate_profile_id", profile.id)
    .order("applied_at", { ascending: false });

}

/*
  Detalle de una postulacion del candidato actual: la vacante,
  el estado y su linea de tiempo completa.
*/
export async function getMyApplicationDetail(applicationId) {

  const { data: profile } = await getCurrentCandidateProfile();

  if (!profile) {
    return { data: null, error: null };
  }

  return await supabase
    .from("applications")
    .select(`
      id,
      current_status,
      applied_at,
      updated_at,
      jobs (
        id,
        title,
        department_id,
        salary_min,
        salary_max,
        company_id,
        company_profiles ( company_name, logo )
      ),
      application_status_history ( status, created_at )
    `)
    .eq("id", applicationId)
    .eq("candidate_profile_id", profile.id)
    .maybeSingle();

}
