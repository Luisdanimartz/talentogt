import "../styles/Hero.css";

function Hero() {
  return (
    <section className="hero">

      <div className="hero-container">

        {/* ================= IZQUIERDA ================= */}

        <div className="hero-left">

          <span className="hero-badge">
            🇬🇹 Plataforma de empleo para Guatemala
          </span>

          <h1>
            Encuentra el
            <br />
            empleo que
            <br />
            <span>mereces.</span>
          </h1>

          <p>
            La plataforma donde las empresas se comprometen a responder
            a cada candidato durante todo el proceso de selección.
          </p>

          <div className="hero-search">

            <input
              type="text"
              placeholder="Puesto, empresa o palabra clave"
            />

            <select defaultValue="">
              <option value="" disabled>
                Categoría
              </option>

              <option>Ventas</option>
              <option>Administración</option>
              <option>Tecnología</option>
              <option>Marketing</option>
              <option>Contabilidad</option>
            </select>

            <button>
              Buscar empleo
            </button>

          </div>

          <div className="hero-tags">

            <span>Ventas</span>
            <span>Atención al cliente</span>
            <span>Tecnología</span>
            <span>Marketing</span>
            <span>Recursos Humanos</span>

          </div>

          <div className="hero-stats">

            <div className="stat-box">
              <h3>5,000+</h3>
              <p>Vacantes activas</p>
            </div>

            <div className="stat-box">
              <h3>2,500+</h3>
              <p>Empresas registradas</p>
            </div>

            <div className="stat-box">
              <h3>12,000+</h3>
              <p>Candidatos activos</p>
            </div>

            <div className="stat-box">
              <h3>98%</h3>
              <p>Empresas responden</p>
            </div>

          </div>

        </div>

        {/* ================= DERECHA ================= */}

        <div className="hero-right">

          <div className="hero-photo">

            <img
              className="hero-people"
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80"
              alt="Equipo de trabajo"
            />

          </div>

          <div className="hero-cards">

            <div className="hero-card">
              <h3>5,000+</h3>
              <p>Vacantes activas</p>
            </div>

            <div className="hero-card">
              <h3>12,000+</h3>
              <p>Candidatos activos</p>
            </div>

            <div className="hero-card">
              <h3>350+</h3>
              <p>Empresas verificadas</p>
            </div>

          </div>

        </div>

      </div>

    </section>
  );
}

export default Hero;