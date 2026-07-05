import { companyProfileExists } from "../services/companyService";

export async function handlePostLoginRedirect(user, navigate) {
  const role = user?.user_metadata?.role;

  if (role === "admin") {
    navigate("/admin/dashboard");
    return;
  }

  if (role === "empresa") {
    const { exists, error } = await companyProfileExists(user.id);

    if (error) {
      throw error;
    }

    navigate(exists ? "/empresa/dashboard" : "/empresa/crear-perfil");
    return;
  }

  navigate("/candidato/dashboard");
}
