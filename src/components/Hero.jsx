import { useNavigate } from "react-router-dom";

function Hero() {
  const navigate = useNavigate();

  return (
    <section className="hero">
      <div className="hero-overlay">
        <div className="hero-wrapper">

          <div className="hero-content">

            <span className="hero-badge">
              La plataforma de empleo de Guatemala
            </span>

            <h1>
              El único portal donde
              <br />
              cada candidato
              <br />
              recibe una respuesta.
            </h1>

            <p>
              Conectamos empresas y talento mediante procesos
              transparentes. Las empresas mantienen informado al
              candidato durante todo el proceso de contratación.
            </p>

            <div className="hero-search">

              <input
                type="text"
                placeholder="Puesto, empresa o palabra clave"
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

            <div className="hero-stats">

              <div>
                <strong>2,500+</strong>
                <span>Vacantes</span>
              </div>

              <div>
                <strong>350+</strong>
                <span>Empresas</span>
              </div>

              <div>
                <strong>98%</strong>
                <span>Empresas responden</span>
              </div>

            </div>

          </div>

          <div className="hero-image">

            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80"
              alt="Equipo de trabajo"
            />

          </div>

        </div>
      </div>
    </section>
  );
}

export default Hero;