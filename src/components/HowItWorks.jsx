import "../styles/HowItWorks.css";
import { useNavigate } from "react-router-dom";

function HowItWorks() {

  const navigate = useNavigate();

  return (

    <section className="how">

      <div className="how-container">

        <h2>¿Cómo funciona ChanceGT?</h2>

        <p className="how-subtitle">
          Un proceso claro y transparente tanto para candidatos como para empresas.
        </p>

        <div className="how-grid">

          {/* ================= CANDIDATOS ================= */}

          <div className="how-card">

            <div className="how-header">

              <div className="how-icon candidate">
                💼
              </div>

              <div>

                <h3>Para candidatos</h3>

                <p className="how-description">
                  Encuentra el empleo ideal y conoce el estado de tu
                  postulación durante cada etapa del proceso.
                </p>

              </div>

            </div>

            <div className="steps-horizontal">

              <div className="step-item">

                <div className="step-circle">
                  1
                </div>

                <h4>Crea tu perfil</h4>

                <p>
                  Regístrate gratis y completa tu perfil.
                </p>

              </div>

              <div className="step-arrow">
                →
              </div>

              <div className="step-item">

                <div className="step-circle">
                  2
                </div>

                <h4>Busca empleo</h4>

                <p>
                  Encuentra oportunidades que se adapten a ti.
                </p>

              </div>

              <div className="step-arrow">
                →
              </div>

              <div className="step-item">

                <div className="step-circle">
                  3
                </div>

                <h4>Conecta con empresas</h4>

                <p>
                  Sigue el estado de tu postulación en tiempo real.
                </p>

              </div>

            </div>

            <button
              onClick={() => navigate("/vacantes")}
            >
              Buscar empleos
            </button>

          </div>

          {/* ================= EMPRESAS ================= */}

          <div className="how-card">

            <div className="how-header">

              <div className="how-icon company">
                🏢
              </div>

              <div>

                <h3>Para empresas</h3>

                <p className="how-description">
                  Publica oportunidades laborales y encuentra al mejor talento para tu organización.
                </p>

              </div>

            </div>

            <div className="steps-horizontal">

              <div className="step-item">

                <div className="step-circle">
                  1
                </div>

                <h4>Publica tu vacante</h4>

                <p>
                  Crea y publica tu oferta de empleo.
                </p>

              </div>

              <div className="step-arrow">
                →
              </div>

              <div className="step-item">

                <div className="step-circle">
                  2
                </div>

                <h4>Recibe candidatos</h4>

                <p>
                  Revisa perfiles y encuentra talento calificado.
                </p>

              </div>

              <div className="step-arrow">
                →
              </div>

              <div className="step-item">

                <div className="step-circle">
                  3
                </div>

                <h4>Contrata al mejor talento</h4>

                <p>
                  Gestiona el proceso y fortalece tu reputación.
                </p>

              </div>

            </div>

            <button
              onClick={() => navigate("/register?tipo=empresa")}
            >
              Publicar empleo
            </button>

          </div>

        </div>

      </div>

    </section>

  );

}

export default HowItWorks;