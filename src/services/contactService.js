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

    // Supabase no expone el cuerpo real del error en error.message;
    // hay que leerlo aparte desde error.context (la respuesta HTTP).
    let detalle = error.message;

    if (error.context) {
      try {
        const cuerpo = await error.context.json();
        detalle = cuerpo?.error || cuerpo?.message || detalle;
      } catch {
        // El cuerpo no era JSON; nos quedamos con error.message
      }
    }

    return { data: null, error: new Error(detalle) };

  }

  if (data?.error) {
    return { data: null, error: new Error(data.error) };
  }

  return { data, error: null };

}
