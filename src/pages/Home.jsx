import { useNavigate } from "react-router-dom";

function Home() {

  const navigate = useNavigate();

  return (
    <>
      {/* HERO */}

      <section className="hero">

        <h1>Tu talento merece una respuesta.</h1>

        <p>
          La primera plataforma de empleo en Guatemala donde las empresas mantienen
          informados a los candidatos durante todo el proceso de selección.
        </p>

        <div className="hero-buttons">

          <button
            className="primary"
            onClick={() => navigate("/empleos")}
          >
            Buscar empleo
          </button>

          <button
            className="secondary"
            onClick={() => navigate("/empresa/dashboard")}
          >
            Publicar vacante
          </button>

        </div>

      </section>

      {/* BUSCADOR */}

      <section className="search">

        <h2>Buscar empleo</h2>

        <div className="search-box">

          <input
            type="text"
            placeholder="Puesto o palabra clave"
          />

          <input
            type="text"
            placeholder="Departamento"
          />

          <button
            onClick={() => navigate("/empleos")}
          >
            Buscar
          </button>

        </div>

      </section>

      {/* ESTADÍSTICAS */}

      <section className="stats">

        <div className="card">

          <h2>+2,500</h2>

          <p>Vacantes activas</p>

        </div>

        <div className="card">

          <h2>350</h2>

          <p>Empresas registradas</p>

        </div>

        <div className="card">

          <h2>98%</h2>

          <p>Empresas que responden</p>

        </div>

      </section>

      {/* EMPRESAS */}

      <section className="companies">

        <h2>Empresas destacadas</h2>

        <div className="companies-grid">

          <div className="company">

            <h3>Banco Industrial</h3>

            <p>Sector Financiero</p>

          </div>

          <div className="company">

            <h3>Tigo Guatemala</h3>

            <p>Telecomunicaciones</p>

          </div>

          <div className="company">

            <h3>Cementos Progreso</h3>

            <p>Construcción</p>

          </div>

          <div className="company">

            <h3>Farmacias Batres</h3>

            <p>Salud</p>

          </div>

        </div>

      </section>

      {/* VACANTES */}

      <section className="jobs">

        <h2>Vacantes recientes</h2>

        <div className="job">

          <h3>Asesor Comercial</h3>

          <p>Banco Industrial</p>

          <small>Guatemala • Tiempo Completo</small>

          <br />

          <button
            onClick={() => navigate("/detalle-vacante")}
          >
            Ver vacante
          </button>

        </div>

        <div className="job">

          <h3>Auxiliar Contable</h3>

          <p>Cementos Progreso</p>

          <small>Quetzaltenango • Tiempo Completo</small>

          <br />

          <button
            onClick={() => navigate("/detalle-vacante")}
          >
            Ver vacante
          </button>

        </div>

        <div className="job">

          <h3>Supervisor de Ventas</h3>

          <p>Tigo Guatemala</p>

          <small>Escuintla • Tiempo Completo</small>

          <br />

          <button
            onClick={() => navigate("/detalle-vacante")}
          >
            Ver vacante
          </button>

        </div>

      </section>

    </>
  );
}

export default Home;