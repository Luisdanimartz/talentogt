import { supabase } from "../lib/supabase";

const COMPANY_PROFILE_COLUMNS = `
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
  unlock_credits,
  created_at,
  updated_at
`;

export async function getCompanyProfileByUserId(userId) {
  return await supabase
    .from("company_profiles")
    .select(COMPANY_PROFILE_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();
}

export async function getCurrentCompany() {
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

  return await getCompanyProfileByUserId(user.id);
}

export async function companyProfileExists(userId) {
  const { data, error } = await getCompanyProfileByUserId(userId);

  if (error) {
    return {
      exists: false,
      profile: null,
      error,
    };
  }

  return {
    exists: !!data,
    profile: data,
    error: null,
  };
}

export async function createCompanyProfile(userId, form) {
  return await supabase
    .from("company_profiles")
    .insert({
      user_id: userId,
      company_name: form.commercialName,
      legal_name: form.legalName,
      nit: form.nit,
      phone: form.phone,
      website: form.website,
      department_id: form.department,
      municipality_id: form.municipality,
      address: form.address,
      description: form.description,
    })
    .select(COMPANY_PROFILE_COLUMNS)
    .single();
}

export async function updateCompanyProfile(profileId, form) {
  return await supabase
    .from("company_profiles")
    .update({
      company_name: form.commercialName,
      legal_name: form.legalName,
      nit: form.nit,
      phone: form.phone,
      website: form.website,
      department_id: form.department,
      municipality_id: form.municipality,
      address: form.address,
      description: form.description,
    })
    .eq("id", profileId)
    .select(COMPANY_PROFILE_COLUMNS)
    .single();
}

/* Actualiza SOLO el logo, sin tocar el resto de los datos */
export async function updateCompanyLogo(profileId, logoUrl) {
  return await supabase
    .from("company_profiles")
    .update({ logo: logoUrl })
    .eq("id", profileId)
    .select(COMPANY_PROFILE_COLUMNS)
    .single();
}

/* Actualiza SOLO el nombre comercial, sin tocar el resto de los datos */
export async function updateCompanyName(profileId, companyName) {
  return await supabase
    .from("company_profiles")
    .update({ company_name: companyName })
    .eq("id", profileId)
    .select(COMPANY_PROFILE_COLUMNS)
    .single();
}

/*
  Trae el plan vigente de la empresa y cuanto de su cupo
  (vacantes/usuarios) ya esta usando.
*/
export async function getMyCompanyPlan(companyId) {
  const { data, error } = await supabase.rpc("get_my_company_plan", {
    p_company_id: companyId,
  });

  if (error) return { data: null, error };

  return { data: data?.[0] || null, error: null };
}
export async function searchCandidates(companyId, filters = {}) {
  return await supabase.rpc("search_candidates", {
    p_company_id: companyId,
    p_profession: filters.profession || null,
    p_department: filters.department || null,
    p_municipality: filters.municipality || null,
    p_min_years: filters.minYears || null,
    p_skill: filters.skill || null,
  });
}

/*
  Desbloquea el perfil completo de un candidato (gasta 1
  credito la primera vez; despues ya no vuelve a cobrar).
*/
export async function unlockCandidateProfile(companyId, candidateProfileId) {
  return await supabase.rpc("unlock_candidate_profile", {
    p_company_id: companyId,
    p_candidate_profile_id: candidateProfileId,
  });
}

/*
  Trae el perfil completo de un candidato YA desbloqueado
  (nombre, telefono, CV completo, etc.)
*/
export async function getUnlockedCandidate(companyId, candidateProfileId) {
  return await supabase.rpc("get_unlocked_candidate", {
    p_company_id: companyId,
    p_candidate_profile_id: candidateProfileId,
  });
}