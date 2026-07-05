import { supabase } from "../lib/supabase";

export async function testConnection() {

  console.log("=== PROBANDO CONEXIÓN SUPABASE ===");

  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .limit(5);

  if (error) {
    console.error("ERROR SUPABASE");
    console.error(error);
    return;
  }

  console.log("CONEXIÓN EXITOSA");
  console.table(data);

}