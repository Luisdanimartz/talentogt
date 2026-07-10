import "./../../../styles/recruiter/dashboard/DecisionCenter.css";

function DecisionCenter() {

    return (

        <section className="decision-center">

            <h2>🤖 Centro de decisiones IA</h2>

            <div className="decision warning">

                <strong>28 candidatos</strong>

                <p>Esperan ser revisados.</p>

            </div>

            <div className="decision success">

                <strong>5 candidatos</strong>

                <p>Superan el 90% de compatibilidad.</p>

            </div>

            <div className="decision info">

                <strong>2 vacantes</strong>

                <p>Llevan más de 20 días publicadas.</p>

            </div>

            <div className="decision alert">

                <strong>4 entrevistas</strong>

                <p>Están pendientes de confirmación.</p>

            </div>

        </section>

    );

}

export default DecisionCenter;