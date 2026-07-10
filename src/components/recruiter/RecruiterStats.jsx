import "../../styles/recruiter/RecruiterStats.css";

function RecruiterStats() {

    const stats = [

        {
            number: "12",
            title: "Vacantes activas"
        },

        {
            number: "148",
            title: "Candidatos"
        },

        {
            number: "8",
            title: "Entrevistas"
        },

        {
            number: "32 h",
            title: "Tiempo de respuesta"
        }

    ];

    return (

        <section className="recruiter-stats">

            {stats.map((item,index)=>(

                <div
                    key={index}
                    className="stat-card"
                >

                    <h2>{item.number}</h2>

                    <p>{item.title}</p>

                </div>

            ))}

        </section>

    );

}

export default RecruiterStats;