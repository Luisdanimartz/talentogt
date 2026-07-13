import { supabase } from "../lib/supabase";

/*
  Panel de administrador. Todo sale de datos reales via las
  funciones 013/014_panel_admin.sql — cada una revisa is_admin()
  del lado del servidor, asi que estas llamadas son seguras aunque
  alguien intente usarlas sin ser admin (Supabase las rechaza).
*/

/* ===== Lectura ===== */

export async function getAdminOverview(desde, hasta) {
  return await supabase
    .rpc("admin_overview", {
      p_desde: desde ? new Date(desde).toISOString() : null,
      p_hasta: hasta ? new Date(hasta).toISOString() : null,
    })
    .single();
}

export async function getAdminCompanies() {
  return await supabase.rpc("admin_companies");
}

export async function getAdminCandidates() {
  return await supabase.rpc("admin_candidates");
}

export async function getAdminJobs() {
  return await supabase.rpc("admin_jobs");
}

export async function getAdminHiringFunnel() {
  return await supabase.rpc("admin_hiring_funnel").single();
}

export async function getAdminTopCompanies(limit = 10) {
  return await supabase.rpc("admin_top_companies", { p_limit: limit });
}

export async function getAdminCandidatesByDepartment() {
  return await supabase.rpc("admin_candidates_by_department");
}

export async function getAdminList() {
  return await supabase.rpc("admin_list_admins");
}

/* ===== Tendencias (Dashboard) ===== */

export async function getAdminJobsTrend(granularity = "month", desde, hasta) {
  return await supabase.rpc("admin_jobs_trend", {
    p_granularity: granularity,
    p_desde: desde ? new Date(desde).toISOString() : null,
    p_hasta: hasta ? new Date(hasta).toISOString() : null,
  });
}

export async function getAdminCandidatesTrend(granularity = "month", desde, hasta) {
  return await supabase.rpc("admin_candidates_trend", {
    p_granularity: granularity,
    p_desde: desde ? new Date(desde).toISOString() : null,
    p_hasta: hasta ? new Date(hasta).toISOString() : null,
  });
}

export async function getAdminCompaniesTrend(granularity = "month", desde, hasta) {
  return await supabase.rpc("admin_companies_trend", {
    p_granularity: granularity,
    p_desde: desde ? new Date(desde).toISOString() : null,
    p_hasta: hasta ? new Date(hasta).toISOString() : null,
  });
}

/* ===== Facturación ===== */

export async function getAdminRevenueOverview(desde, hasta) {
  return await supabase
    .rpc("admin_revenue_overview", {
      p_desde: desde ? new Date(desde).toISOString() : null,
      p_hasta: hasta ? new Date(hasta).toISOString() : null,
    })
    .single();
}

export async function getAdminRevenueTrend(granularity = "month", desde, hasta) {
  return await supabase.rpc("admin_revenue_trend", {
    p_granularity: granularity,
    p_desde: desde ? new Date(desde).toISOString() : null,
    p_hasta: hasta ? new Date(hasta).toISOString() : null,
  });
}

export async function getAdminRevenueByCompany(desde, hasta) {
  return await supabase.rpc("admin_revenue_by_company", {
    p_desde: desde ? new Date(desde).toISOString() : null,
    p_hasta: hasta ? new Date(hasta).toISOString() : null,
  });
}

export async function getAdminTopSellingPlans(desde, hasta) {
  return await supabase.rpc("admin_top_selling_plans", {
    p_desde: desde ? new Date(desde).toISOString() : null,
    p_hasta: hasta ? new Date(hasta).toISOString() : null,
  });
}

/* ===== Tarifario ===== */

export async function getPricingPlans() {
  return await supabase.rpc("admin_list_pricing_plans");
}

export async function savePricingPlan(plan) {
  return await supabase
    .rpc("admin_save_pricing_plan", {
      p_id: plan.id || null,
      p_name: plan.name,
      p_price: plan.price,
      p_duration_days: plan.duration_days,
      p_job_limit: plan.job_limit === "" ? null : plan.job_limit,
      p_is_active: plan.is_active,
    })
    .single();
}

export async function assignPlanToCompany(companyId, pricingPlanId, notes) {
  return await supabase
    .rpc("admin_assign_plan", {
      p_company_id: companyId,
      p_pricing_plan_id: pricingPlanId,
      p_notes: notes || null,
    })
    .single();
}

export async function grantFreePosts(companyId, cantidad, notes) {
  return await supabase
    .rpc("admin_grant_free_posts", {
      p_company_id: companyId,
      p_cantidad: cantidad,
      p_notes: notes || null,
    })
    .single();
}

export async function getCompanyPricingHistory(companyId) {
  return await supabase.rpc("admin_company_pricing_history", {
    p_company_id: companyId,
  });
}

/* ===== Acciones sobre empresas ===== */

export async function setCompanyStatus(companyId, status) {
  return await supabase
    .from("company_profiles")
    .update({ status })
    .eq("id", companyId)
    .select("id, status")
    .single();
}

export async function setCompanyPlan(companyId, plan) {
  return await supabase
    .from("company_profiles")
    .update({ plan })
    .eq("id", companyId)
    .select("id, plan")
    .single();
}

export async function setCompanyCollaborator(companyId, isCollaborator) {
  return await supabase
    .from("company_profiles")
    .update({ is_collaborator: isCollaborator })
    .eq("id", companyId)
    .select("id, is_collaborator")
    .single();
}

/* ===== Acciones sobre candidatos ===== */

export async function setCandidateStatus(candidateProfileId, status) {
  return await supabase
    .from("candidate_profiles")
    .update({ status })
    .eq("id", candidateProfileId)
    .select("id, status")
    .single();
}

/* ===== Acciones sobre vacantes ===== */

export async function setJobStatus(jobId, status) {
  return await supabase
    .from("jobs")
    .update({ status })
    .eq("id", jobId)
    .select("id, status")
    .single();
}

/* ===== Gestion de administradores ===== */

export async function setRoleByEmail(email, role) {
  return await supabase.rpc("admin_set_role_by_email", {
    p_email: email,
    p_role: role,
  });
}
