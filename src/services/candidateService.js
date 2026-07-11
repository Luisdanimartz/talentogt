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
  created_at,
  updated_at
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
export async function saveCandidateProfile(form) {

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
  };

  const { data: existing } = await supabase
    .from("candidate_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {

    return await supabase
      .from("candidate_profiles")
      .update(profile)
      .eq("id", existing.id)
      .select(CANDIDATE_COLUMNS)
      .single();

  }

  return await supabase
    .from("candidate_profiles")
    .insert({ user_id: user.id, ...profile })
    .select(CANDIDATE_COLUMNS)
    .single();

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

  return await supabase
    .from("applications")
    .insert({
      job_id: jobId,
      candidate_profile_id: profile.id,
      current_status: "applied",
      applied_at: new Date().toISOString(),
    })
    .select("id, current_status, applied_at")
    .single();

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
      jobs (
        id,
        title,
        status,
        company_profiles ( company_name )
      )
    `)
    .eq("candidate_profile_id", profile.id)
    .order("applied_at", { ascending: false });

}
