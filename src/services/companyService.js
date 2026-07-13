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