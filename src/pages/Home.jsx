import "../styles/Home.css";
import { useNavigate } from "react-router-dom";
import Hero from "../components/Hero";

function Home() {

  const navigate = useNavigate();

  return (
    <>

      <Hero />

      {/* NUESTRA PROMESA */}

      <section className="mission">

        <h2>
          El problema no es encontrar empleo.
        </h2>

        <h3>
          Es nunca volver a recibir una respuesta.
        </h3>

        <p>
          Miles de profesionales en Guatemala envían su currículum cada día
          y nunca saben si fue visto, revisado o descartado.
        </p>

        <p>
          En <strong>TalentoGT</strong>, las empresas se comprometen
          a mantener informado al candidato durante cada etapa del proceso
          de selección.
        </p>

      </section>

      {/* ESTADÍSTICAS */}

      <section className="stats">

        <div className="card">
          <h2>2,500+</h2>
          <p>Vacantes activas</p>
        </div>

        <div className="card">
          <h2>350+</h2>
          <p>Empresas registradas</p>
        </div>

        <div className="card">
          <h2>98%</h2>
          <p>Empresas responden a sus candidatos</p>
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