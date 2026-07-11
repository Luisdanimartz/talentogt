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
      company_profiles ( company_name, logo )
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
      category_id,
      company_profiles ( company_name )
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false });
}