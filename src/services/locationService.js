import { supabase } from "../lib/supabase";

export async function getDepartments() {
  return await supabase
    .from("departments")
    .select("id, name")
    .order("name");
}

export async function getMunicipalitiesByDepartment(departmentId) {
  if (!departmentId) {
    return {
      data: [],
      error: null,
    };
  }

  return await supabase
    .from("municipalities")
    .select("id, name")
    .eq("department_id", departmentId)
    .order("name");
}