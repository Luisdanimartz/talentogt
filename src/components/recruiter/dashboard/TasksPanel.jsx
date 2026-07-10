import "./../../../styles/recruiter/dashboard/TasksPanel.css";

function TasksPanel() {

    return (

        <section className="tasks-panel">

            <h3>Tareas de hoy</h3>

            <ul>

                <li>🟡 Revisar 28 candidatos</li>

                <li>🟢 Publicar 2 vacantes</li>

                <li>🔵 Confirmar 4 entrevistas</li>

                <li>🟣 Responder 6 mensajes</li>

            </ul>

        </section>

    );

}

export default TasksPanel;