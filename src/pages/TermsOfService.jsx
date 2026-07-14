import "../styles/LegalPages.css";

function TermsOfService() {

    return (

        <div className="legal-page">

            <h1>Términos y Condiciones</h1>

            <p className="legal-updated">
                Última actualización: julio de 2026
            </p>

            <p>
                Al usar ChanceGT aceptas los siguientes términos. Si no
                estás de acuerdo con alguno de ellos, te pedimos no
                utilizar la plataforma.
            </p>

            <h2>1. Descripción del servicio</h2>

            <p>
                ChanceGT es una plataforma que conecta a personas que
                buscan empleo ("candidatos") con empresas que buscan
                talento ("empresas"), facilitando la publicación de
                vacantes, la postulación y el seguimiento del proceso
                de selección.
            </p>

            <h2>2. Cuentas de usuario</h2>

            <ul>
                <li>Debes proporcionar información veraz al crear tu cuenta y tu perfil.</li>
                <li>Eres responsable de mantener la confidencialidad de tu contraseña.</li>
                <li>Nos reservamos el derecho de suspender cuentas que proporcionen información falsa o hagan un uso indebido de la plataforma.</li>
            </ul>

            <h2>3. Uso para candidatos</h2>

            <ul>
                <li>La creación de perfil y la postulación a vacantes es gratuita.</li>
                <li>Eres responsable de la veracidad de la información en tu CV (experiencia, formación, referencias).</li>
                <li>Puedes activar o desactivar en cualquier momento la visibilidad de tu perfil ante búsquedas de empresas.</li>
            </ul>

            <h2>4. Uso para empresas</h2>

            <ul>
                <li>Las empresas son responsables de la veracidad de la información de sus vacantes.</li>
                <li>El acceso a ciertas funciones (como publicar vacantes o desbloquear perfiles de candidatos en búsqueda) puede estar sujeto a planes o créditos, según se indique en la plataforma.</li>
                <li>Las empresas se comprometen a dar seguimiento razonable a los candidatos que postulan a sus vacantes.</li>
                <li>Está prohibido usar la información de contacto de un candidato para fines distintos al proceso de reclutamiento para el que fue compartida.</li>
            </ul>

            <h2>5. Contenido prohibido</h2>

            <p>No está permitido publicar en la plataforma:</p>

            <ul>
                <li>Vacantes falsas, engañosas, o que soliciten pagos al candidato.</li>
                <li>Contenido discriminatorio, ofensivo o ilegal.</li>
                <li>Información falsa sobre identidad, experiencia o intenciones.</li>
            </ul>

            <h2>6. Propiedad intelectual</h2>

            <p>
                El nombre "ChanceGT", su logotipo y el diseño de la
                plataforma son propiedad de ChanceGT. El contenido que
                tú subes (tu CV, la descripción de tus vacantes) sigue
                siendo tuyo; nos das permiso para mostrarlo dentro de
                la plataforma con el fin de prestar el servicio.
            </p>

            <h2>7. Limitación de responsabilidad</h2>

            <p>
                ChanceGT facilita el contacto entre candidatos y
                empresas, pero no participa en la relación laboral que
                pueda surgir entre ambos, ni garantiza la contratación,
                ni es responsable de acuerdos, condiciones laborales o
                disputas entre candidato y empresa.
            </p>

            <h2>8. Cambios en el servicio</h2>

            <p>
                Podemos modificar, agregar o descontinuar funciones de
                la plataforma en cualquier momento, incluyendo cambios
                a los planes o créditos disponibles para empresas.
            </p>

            <h2>9. Cambios a estos términos</h2>

            <p>
                Podemos actualizar estos términos conforme la
                plataforma evolucione. Publicaremos cualquier cambio
                relevante en esta misma página.
            </p>

            <h2>10. Contacto</h2>

            <p>
                Si tienes preguntas sobre estos términos, escríbenos a{" "}
                <a href="mailto:info@chancegt.com">info@chancegt.com</a>{" "}
                o a través de nuestro <a href="/contacto">formulario de contacto</a>.
            </p>

        </div>

    );

}

export default TermsOfService;
