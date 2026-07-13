import { companyProfileExists } from "../services/companyService";
import { getMyCompanyContext } from "../services/teamService";

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

    if (exists) {
      navigate("/empresa/dashboard");
      return;
    }

    /*
      No creo empresa propia, pero ¿me invitaron a una?
      getMyCompanyContext reclama invitaciones pendientes a mi
      correo y devuelve la empresa a la que pertenezco.
    */
    const { company } = await getMyCompanyContext();

    navigate(company ? "/empresa/dashboard" : "/empresa/crear-perfil");
    return;
  }

  navigate("/candidato/dashboard");
}
