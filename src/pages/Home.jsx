function Home() {
  return (
    <>
      <section className="hero">

        <h1>Tu talento merece una respuesta.</h1>

        <p>
          La primera plataforma de empleo en Guatemala donde las empresas
          mantienen informados a los candidatos durante todo el proceso de selección.
        </p>

        <div className="hero-buttons">

          <button className="primary">
            Buscar empleo
          </button>

          <button className="secondary">
            Publicar vacante
          </button>

        </div>

      </section>

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

          <button>
            Buscar
          </button>

        </div>

      </section>

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

      <section className="companies">

        <h2>Empresas destacadas</h2>

        <div className="companies-grid">

          <div className="company">
            Banco Industrial
          </div>

          <div className="company">
            Tigo Guatemala
          </div>

          <div className="company">
            Cementos Progreso
          </div>

          <div className="company">
            Farmacias Batres
          </div>

        </div>

      </section>

      <section className="jobs">

        <h2>Vacantes recientes</h2>

        <div className="job">
          <h3>Asesor Comercial</h3>
          <p>Guatemala, Guatemala</p>
          <button>Ver vacante</button>
        </div>

        <div className="job">
          <h3>Auxiliar Contable</h3>
          <p>Quetzaltenango</p>
          <button>Ver vacante</button>
        </div>

        <div className="job">
          <h3>Supervisor de Ventas</h3>
          <p>Escuintla</p>
          <button>Ver vacante</button>
        </div>

      </section>

    </>
  );
}

export default Home;