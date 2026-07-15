import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {

  const { user, loading } = useAuth();

  if (loading) {
    return <h2>Cargando...</h2>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // app_metadata es la fuente segura del rol (no editable por el
  // usuario). Ver database/031_seguridad_roles_app_metadata.sql.
  const role = user?.app_metadata?.role;

  if (allowedRoles && !allowedRoles.includes(role)) {
    // El usuario está logueado pero no tiene permiso para esta ruta.
    // Lo mandamos a la home en vez de dejarlo entrar.
    return <Navigate to="/" replace />;
  }

  return children;

}

export default ProtectedRoute;
