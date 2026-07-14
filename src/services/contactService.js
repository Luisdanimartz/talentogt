import { supabase } from "../lib/supabase";

/*
  Envia el mensaje del formulario de Contacto a la Edge
  Function "contacto", que lo reenvia por correo con Resend.
*/
export async function sendContactMessage({ nombre, correo, mensaje }) {

  const { data, error } = await supabase.functions.invoke("contacto", {
    body: { nombre, correo, mensaje },
  });

  if (error) {
    return { data: null, error };
  }

  if (data?.error) {
    return { data: null, error: new Error(data.error) };
  }

  return { data, error: null };

}
