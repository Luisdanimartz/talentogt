import "../styles/CallToAction.css";
import { useNavigate } from "react-router-dom";

function CallToAction() {

  const navigate = useNavigate();

  return (

    <section className="cta">

      <div className="cta-container">

        <h2>
           Porque el talento merece una respuesta.
        </h2>

        <p>
          Da seguimiento a cada postulación y conoce cuándo tu CV
fue visto, revisado o si el proceso finalizó.
        </p>

        <div className="cta-buttons">

          <button
            className="candidate-btn"
            onClick={() => navigate("/register")}
          >
            Crear mi perfil
          </button>

          <button
            className="company-btn"
            onClick={() => navigate("/register-company")}
          >
            Publicar una vacante
          </button>

        </div>

      </div>

    </section>

  );

}

export default CallToAction;