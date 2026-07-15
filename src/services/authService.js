import { supabase } from "../lib/supabase";

export async function registerUser(form) {

  const respuesta = await supabase.auth.signUp({

    email: form.email,
    password: form.password,

    options: {
      data: {
        names: form.names,
        lastname: form.lastname,
        role: form.accountType,
      },
    },

  });

  return respuesta;

}

export async function loginUser(email, password) {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function logoutUser() {
  return await supabase.auth.signOut();
}

/* Envia el correo con el enlace para restablecer la contraseña */
export async function sendPasswordReset(email) {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
}

/* Se usa DESPUES de entrar desde el enlace del correo,
   cuando ya existe una sesion de recuperacion valida */
export async function updatePassword(newPassword) {
  return await supabase.auth.updateUser({ password: newPassword });
}
