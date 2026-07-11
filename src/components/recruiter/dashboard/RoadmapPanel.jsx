import "./../../../styles/recruiter/dashboard/RoadmapPanel.css";

/*
  Panel honesto: qué viene después en ChanceGT, en el orden
  ya decidido. Se actualiza a mano al completar cada etapa.
*/

const ROADMAP = [
    {
        title: "Equipos por empresa",
        detail: "Dueños, reclutadores y jefes viendo el mismo panel.",
    },
    {
        title: "Postulaciones de candidatos",
        detail: "Recibe y revisa candidatos reales en cada vacante.",
    },
    {
        title: "Métricas de tiempo de cierre",
        detail: "Cuánto tarda cada vacante en cubrirse, con datos reales.",
    },
];

function RoadmapPanel() {

    return (

        <section className="roadmap-panel">

            <h2>Próximamente en ChanceGT</h2>

            <ol>

                {ROADMAP.map((item, index) => (

                    <li key={item.title}>

                        <span className="roadmap-step">
                            {index + 1}
                        </span>

                        <div>

                            <strong>{item.title}</strong>

                            <p>{item.detail}</p>

                        </div>

                    </li>

                ))}

            </ol>

        </section>

    );

}

export default RoadmapPanel;
