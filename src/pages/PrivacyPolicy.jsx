import "../styles/LegalPages.css";

function PrivacyPolicy() {

    return (

        <div className="legal-page">

            <h1>Política de Privacidad</h1>

            <p className="legal-updated">
                Última actualización: julio de 2026
            </p>

            <p>
                En ChanceGT ("nosotros", "la plataforma") respetamos tu
                privacidad y queremos que sepas con claridad qué
                información recopilamos, para qué la usamos y qué
                control tienes sobre ella.
            </p>

            <h2>1. Quiénes somos</h2>

            <p>
                ChanceGT es una plataforma de empleo operada desde
                Guatemala, que conecta a personas candidatas con
                empresas que buscan talento. Puedes contactarnos en{" "}
                <a href="/contacto">nuestra página de contacto</a> o al
                correo <a href="mailto:info@chancegt.com">info@chancegt.com</a>.
            </p>

            <h2>2. Qué información recopilamos</h2>

            <ul>
                <li>
                    <strong>Datos de cuenta:</strong> nombre, correo
                    electrónico y contraseña (almacenada de forma
                    cifrada).
                </li>
                <li>
                    <strong>Datos de perfil de candidato:</strong>
                    {" "}información de contacto, formación académica,
                    experiencia laboral, habilidades, pretensión
                    salarial y, si lo activas, disponibilidad para
                    aparecer en búsquedas de reclutadores.
                </li>
                <li>
                    <strong>Datos de perfil de empresa:</strong> nombre
                    comercial, razón social, NIT, dirección y datos de
                    contacto.
                </li>
                <li>
                    <strong>Datos de uso:</strong> postulaciones
                    realizadas, mensajes de estado, e interacciones
                    dentro de la plataforma.
                </li>
            </ul>

            <h2>3. Para qué usamos tu información</h2>

            <ul>
                <li>Conectar candidatos con vacantes relevantes (motor de coincidencias).</li>
                <li>Permitir que las empresas revisen postulaciones y gestionen procesos de selección.</li>
                <li>Enviar notificaciones sobre el estado de tus postulaciones o procesos de reclutamiento.</li>
                <li>Mejorar la plataforma y prevenir uso indebido.</li>
            </ul>

            <h2>4. Con quién compartimos tu información</h2>

            <p>
                Los datos de contacto de un candidato (teléfono, CV
                completo) solo se comparten con una empresa cuando:
            </p>

            <ul>
                <li>El candidato aplica directamente a una vacante de esa empresa, o</li>
                <li>El candidato activó la opción de "aparecer en búsquedas de reclutadores" y una empresa decide desbloquear su perfil completo.</li>
            </ul>

            <p>
                No vendemos ni alquilamos tu información personal a
                terceros con fines publicitarios.
            </p>

            <h2>5. Tu control sobre tus datos</h2>

            <ul>
                <li>Puedes editar o eliminar la información de tu perfil en cualquier momento.</li>
                <li>Puedes activar o desactivar la visibilidad de tu perfil en búsquedas de reclutadores cuando quieras.</li>
                <li>Puedes solicitar la eliminación de tu cuenta escribiéndonos a <a href="mailto:info@chancegt.com">info@chancegt.com</a>.</li>
            </ul>

            <h2>6. Seguridad</h2>

            <p>
                Usamos proveedores con estándares de seguridad
                reconocidos (autenticación cifrada, bases de datos con
                acceso restringido por permisos) para proteger tu
                información. Ningún sistema es 100% infalible, pero
                trabajamos activamente para minimizar riesgos.
            </p>

            <h2>7. Cambios a esta política</h2>

            <p>
                Podemos actualizar esta política conforme la
                plataforma evolucione. Publicaremos cualquier cambio
                relevante en esta misma página.
            </p>

            <h2>8. Contacto</h2>

            <p>
                Si tienes preguntas sobre esta política, escríbenos a{" "}
                <a href="mailto:info@chancegt.com">info@chancegt.com</a>{" "}
                o a través de nuestro <a href="/contacto">formulario de contacto</a>.
            </p>

        </div>

    );

}

export default PrivacyPolicy;
