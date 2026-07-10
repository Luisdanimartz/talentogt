import "../../styles/recruiter/RecruiterTasks.css";

function RecruiterTasks() {

    return (

        <section className="tasks-panel">

            <div className="tasks-header">

                <h2>📋 Tareas de hoy</h2>

            </div>

            <div className="task-item">

                <span>🎤</span>

                <p>3 entrevistas programadas</p>

            </div>

            <div className="task-item">

                <span>📄</span>

                <p>5 candidatos pendientes de revisar</p>

            </div>

            <div className="task-item">

                <span>💬</span>

                <p>2 mensajes sin responder</p>

            </div>

            <div className="task-item">

                <span>⏰</span>

                <p>1 vacante vence mañana</p>

            </div>

            <button className="tasks-button">

                Ver agenda

            </button>

        </section>

    );

}

export default RecruiterTasks;