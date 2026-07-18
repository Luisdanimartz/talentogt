import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../services/authService";

function Navbar() {

  const navigate = useNavigate();
  const { user } = useAuth();

  const role = user?.app_metadata?.role;

  /* A dónde lleva "Mi panel" según el rol */
  const panelPath =
    role === "admin"
      ? "/admin/dashboard"
      : role === "empresa"
      ? "/empresa/dashboard"
      : "/candidato/dashboard";

  async function handleLogout() {

    await logoutUser();

    navigate("/login");

  }

  return (

    <header className="navbar">

      <div className="navbar-container">

        <Link to="/" className="logo">

          <img
            src="/guatemala.png"
            alt="Guatemala"
            className="flag"
          />

          <div className="logo-text">

            <img
              src="/logo-chancegt.svg"
              alt="ChanceGT"
              className="logo-wordmark"
            />

            <small>
              Conectamos talento, creamos oportunidades
            </small>

          </div>

        </Link>

        <nav className="nav-links">

          <Link to="/vacantes">
            Buscar empleo
          </Link>

          <Link to="/planes">
            Tarifas
          </Link>

          <span className="nav-link-soon" title="Disponible próximamente">
            Explorar empresas <em>Pronto</em>
          </span>

          <span className="nav-link-soon" title="Disponible próximamente">
            Consejos profesionales <em>Pronto</em>
          </span>

        </nav>

        <div className="nav-actions">

          {!user && (

            <>

              <Link
                to="/register?tipo=empresa"
                className="publish"
              >
                Publicar vacante
              </Link>

              <Link
                to="/login"
                className="login"
              >
                Ingresar
              </Link>

              <Link
                to="/register"
                className="register"
              >
                Registrarse
              </Link>

            </>

          )}

          {user && (

            <>

              <Link
                to={panelPath}
                className="register"
              >
                Mi panel
              </Link>

              <button
                className="login navbar-logout"
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>

            </>

          )}

        </div>

      </div>

    </header>

  );

}

export default Navbar;
