import { useNavigate } from "react-router-dom";

import "../styles/LegalPages.css";
import "../styles/Pricing.css";

function Pricing() {

    const navigate = useNavigate();

    return (

        <div className="pricing-page">

            <div className="pricing-card">

                <span className="pricing-badge">Empresas</span>

                <h1>Un plan a la medida de tu equipo</h1>

                <p>
                    Estamos en una etapa temprana, por eso preferimos
                    platicar directamente contigo antes de ofrecerte un
                    plan: así te proponemos algo que realmente se
                    ajuste a cuántas vacantes publicas, cuántos
                    candidatos buscas, y cómo trabaja tu equipo de
                    reclutamiento.
                </p>

                <ul className="pricing-list">
                    <li>Publicación de vacantes ilimitada o por paquete, según tu volumen</li>
                    <li>Créditos para desbloquear perfiles de nuestra base de candidatos</li>
                    <li>Acceso multiusuario para tu equipo de reclutamiento</li>
                </ul>

                <button
                    className="pricing-cta"
                    onClick={() => navigate("/contacto")}
                >
                    Escríbenos para cotizar
                </button>

                <p className="pricing-note">
                    Te respondemos directamente, sin compromiso.
                </p>

            </div>

        </div>

    );

}

export default Pricing;
