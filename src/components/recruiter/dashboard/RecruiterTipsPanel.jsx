import { useState } from "react";

import "./../../../styles/recruiter/dashboard/RecruiterTipsPanel.css";

/*
  Consejos para el reclutador.

  La postura de ChanceGT: la plataforma ordena, filtra y automatiza
  lo repetitivo — pero quien decide a quien contratar es el
  reclutador. Aqui no le decimos que hacer: le damos oficio.

  Los consejos no son de relleno: cada uno empuja una conducta que
  mejora sus resultados y, de paso, la experiencia del candidato.
*/

const CONSEJOS = [
    {
        titulo: "Un 'no' a tiempo vale más que un silencio",
        detalle:
            "Descartar rápido cuesta un clic y le devuelve certeza al candidato. El silencio no te ahorra trabajo: te cuesta reputación.",
    },
    {
        titulo: "El salario publicado filtra por ti",
        detalle:
            "Cuando el rango está a la vista, quien no encaja no se postula. Menos CVs que revisar y mejores conversaciones desde la primera llamada.",
    },
    {
        titulo: "Escribe requisitos que se puedan comprobar",
        detalle:
            "SAP, planilla, motorista, Excel avanzado. El motor de coincidencias trabaja con esas palabras; “buena actitud” no le dice nada a nadie.",
    },
    {
        titulo: "Revisa por afinidad, no por orden de llegada",
        detalle:
            "Tu tiempo rinde más si empiezas por quien cumple más requisitos. El primero en postularse rara vez es el mejor.",
    },
    {
        titulo: "Cierra el proceso el día que contrates",
        detalle:
            "No esperes a que venza el plazo. Los demás candidatos siguen esperando una respuesta que ya tienes.",
    },
    {
        titulo: "Tu tiempo de respuesta es público",
        detalle:
            "Los candidatos ven qué porcentaje respondes y en cuántos días. Las empresas que responden atraen mejores perfiles.",
    },
    {
        titulo: "La entrevista empieza al agendarla",
        detalle:
            "Confirmar lugar, hora y modalidad por escrito reduce las ausencias más que cualquier recordatorio de último minuto.",
    },
    {
        titulo: "El plazo es una promesa, no un trámite",
        detalle:
            "Ampliarlo queda registrado y el candidato lo ve. Úsalo cuando de verdad haga falta y conservará su valor.",
    },
];

/* Arranca en un consejo distinto cada día, pero estable durante
   el día: no cambia solo porque el panel se vuelva a dibujar. */
function consejoDelDia() {

    const dias = Math.floor(Date.now() / 86400000);

    return dias % CONSEJOS.length;

}

function RecruiterTipsPanel() {

    const [indice, setIndice] = useState(consejoDelDia);

    const consejo = CONSEJOS[indice];

    function mover(paso) {

        setIndice(
            (actual) =>
                (actual + paso + CONSEJOS.length) % CONSEJOS.length
        );

    }

    return (

        <section className="tips-panel">

            <header className="tips-head">

                <h2>Oficio de reclutador</h2>

                <p>
                    ChanceGT ordena, filtra y avisa. A quién contratar
                    lo decides tú.
                </p>

            </header>

            <article className="tips-body">

                <strong>{consejo.titulo}</strong>

                <p>{consejo.detalle}</p>

            </article>

            <footer className="tips-foot">

                <span className="tips-contador">
                    {indice + 1} de {CONSEJOS.length}
                </span>

                <div className="tips-nav">

                    <button
                        type="button"
                        onClick={() => mover(-1)}
                        aria-label="Consejo anterior"
                    >
                        ←
                    </button>

                    <button
                        type="button"
                        onClick={() => mover(1)}
                        aria-label="Siguiente consejo"
                    >
                        →
                    </button>

                </div>

            </footer>

        </section>

    );

}

export default RecruiterTipsPanel;
