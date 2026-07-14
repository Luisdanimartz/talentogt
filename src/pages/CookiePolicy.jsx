import "../styles/LegalPages.css";

function CookiePolicy() {

    return (

        <div className="legal-page">

            <h1>Política de Cookies</h1>

            <p className="legal-updated">
                Última actualización: julio de 2026
            </p>

            <p>
                ChanceGT utiliza cookies y tecnologías similares para
                que la plataforma funcione correctamente y para
                mejorar tu experiencia.
            </p>

            <h2>1. ¿Qué son las cookies?</h2>

            <p>
                Son pequeños archivos que se guardan en tu navegador
                cuando visitas un sitio web, y que permiten recordar
                información entre una visita y otra.
            </p>

            <h2>2. Qué tipo de cookies usamos</h2>

            <ul>
                <li>
                    <strong>Esenciales:</strong> necesarias para que
                    puedas iniciar sesión y mantener tu sesión activa
                    mientras usas la plataforma.
                </li>
                <li>
                    <strong>De preferencia:</strong> recuerdan
                    configuraciones como si ya iniciaste sesión, para
                    no pedírtelo en cada página.
                </li>
            </ul>

            <p>
                Por ahora, ChanceGT no utiliza cookies de publicidad
                ni de rastreo de terceros con fines comerciales.
            </p>

            <h2>3. Cómo controlar las cookies</h2>

            <p>
                Puedes configurar tu navegador para bloquear o eliminar
                cookies. Ten en cuenta que si bloqueas las cookies
                esenciales, es posible que no puedas iniciar sesión ni
                usar correctamente la plataforma.
            </p>

            <h2>4. Cambios a esta política</h2>

            <p>
                Podemos actualizar esta política conforme la
                plataforma evolucione. Publicaremos cualquier cambio
                relevante en esta misma página.
            </p>

            <h2>5. Contacto</h2>

            <p>
                Si tienes preguntas sobre esta política, escríbenos a{" "}
                <a href="mailto:info@chancegt.com">info@chancegt.com</a>{" "}
                o a través de nuestro <a href="/contacto">formulario de contacto</a>.
            </p>

        </div>

    );

}

export default CookiePolicy;
