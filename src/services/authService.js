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
