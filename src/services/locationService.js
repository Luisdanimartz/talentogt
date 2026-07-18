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

/* Todos los municipios del pais, con su departamento. Util cuando
   se necesita mostrar el nombre del municipio de una vacante o
   filtrar en el cliente sin tener que esperar un fetch en cascada
   por cada cambio de departamento (son solo ~340 filas). */
export async function getMunicipalities() {
  return await supabase
    .from("municipalities")
    .select("id, name, department_id")
    .order("name");
}