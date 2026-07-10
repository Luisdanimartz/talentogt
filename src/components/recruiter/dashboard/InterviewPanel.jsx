import "./../../../styles/recruiter/dashboard/InterviewPanel.css";

function InterviewPanel() {

    const interviews = [

        {
            hour: "09:00",
            name: "Ana Castillo",
            job: "Analista de Sistemas"
        },

        {
            hour: "11:30",
            name: "Jorge Salazar",
            job: "Ejecutivo de Ventas"
        },

        {
            hour: "15:00",
            name: "Diego Ruiz",
            job: "Auxiliar de Bodega"
        }

    ];

    return (

        <section className="interview-panel">

            <h3>Próximas entrevistas</h3>

            {interviews.map((item) => (

                <div
                    key={item.hour}
                    className="interview-item"
                >

                    <strong>{item.hour}</strong>

                    <div>

                        <h4>{item.name}</h4>

                        <p>{item.job}</p>

                    </div>

                </div>

            ))}

            <button>

                Ver calendario

            </button>

        </section>

    );

}

export default InterviewPanel;