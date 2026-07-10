import "./../../../styles/recruiter/dashboard/ActivityFeed.css";

function ActivityFeed() {

    const activities = [

        {
            time: "09:12",
            text: "Ana Castillo aceptó una entrevista."
        },

        {
            time: "09:45",
            text: "Nueva postulación para Ejecutivo de Ventas."
        },

        {
            time: "10:08",
            text: "La IA recomendó 5 candidatos."
        },

        {
            time: "10:41",
            text: "La vacante Analista Senior alcanzó 100 postulaciones."
        }

    ];

    return (

        <section className="activity-feed">

            <h2>Actividad reciente</h2>

            {activities.map((item) => (

                <div
                    key={item.time + item.text}
                    className="activity-item"
                >

                    <span className="activity-time">

                        {item.time}

                    </span>

                    <p>

                        {item.text}

                    </p>

                </div>

            ))}

        </section>

    );

}

export default ActivityFeed;