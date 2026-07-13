import { supabase } from "../lib/supabase";

/*
  Logo de la empresa: se guarda en el bucket "company-logos"
  (Supabase Storage), en la ruta {company_id}/logo.<extension>.
  Subir uno nuevo REEMPLAZA el anterior (upsert), asi la URL
  guardada en company_profiles.logo no cambia de nombre — solo
  agregamos un parametro de fecha para evitar que el navegador
  muestre una version vieja en cache.
*/

const TIPOS_PERMITIDOS = ["image/png", "image/jpeg", "image/webp"];
const TAMANO_MAXIMO_MB = 2;

export function validarLogo(file) {

  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    return "Formato no permitido. Usa PNG, JPG o WEBP.";
  }

  if (file.size > TAMANO_MAXIMO_MB * 1024 * 1024) {
    return `El archivo pesa demasiado. Máximo ${TAMANO_MAXIMO_MB}MB.`;
  }

  return null;

}

export async function subirLogoEmpresa(companyId, file) {

  const errorValidacion = validarLogo(file);

  if (errorValidacion) {
    return { data: null, error: { message: errorValidacion } };
  }

  const extension = file.name.split(".").pop().toLowerCase();
  const ruta = `${companyId}/logo.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("company-logos")
    .upload(ruta, file, {
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) {
    return { data: null, error: uploadError };
  }

  const { data: urlData } = supabase.storage
    .from("company-logos")
    .getPublicUrl(ruta);

  /* ?v= evita que quede la version vieja en cache del navegador */
  const urlConVersion = `${urlData.publicUrl}?v=${Date.now()}`;

  return { data: { url: urlConVersion }, error: null };

}
