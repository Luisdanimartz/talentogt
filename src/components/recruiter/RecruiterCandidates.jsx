import "../../styles/recruiter/RecruiterCandidates.css";

function RecruiterCandidates() {

    return (

        <section className="recent-candidates">

            <div className="recent-header">

                <h2>Candidatos recientes</h2>

                <button>Ver todos</button>

            </div>

            <div className="candidate-card">

                <div>

                    <h3>Ana López</h3>

                    <p>Ejecutivo de Ventas</p>

                </div>

                <span>Hace 15 min</span>

                <button>Ver perfil</button>

            </div>

            <div className="candidate-card">

                <div>

                    <h3>Carlos Pérez</h3>

                    <p>Auxiliar Contable</p>

                </div>

                <span>Hace 1 hora</span>

                <button>Ver perfil</button>

            </div>

            <div className="candidate-card">

                <div>

                    <h3>María García</h3>

                    <p>Asistente Administrativa</p>

                </div>

                <span>Hoy</span>

                <button>Ver perfil</button>

            </div>

        </section>

    );

}

export default RecruiterCandidates;