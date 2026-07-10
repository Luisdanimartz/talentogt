import { Link } from "react-router-dom";
import "../styles/Navbar.css";

function Navbar() {

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

            <h2>
              Chance<span>GT</span>
            </h2>

            <small>
              Conectamos talento, creamos oportunidades
            </small>

          </div>

        </Link>

        <nav className="nav-links">

          <Link to="/empleos">
            Buscar empleo
          </Link>

          <Link to="/empresas">
            Explorar empresas
          </Link>

          <Link to="/consejos">
            Consejos profesionales
          </Link>

        </nav>

        <div className="nav-actions">

          <Link
            to="/login"
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

        </div>

      </div>

    </header>

  );

}

export default Navbar;