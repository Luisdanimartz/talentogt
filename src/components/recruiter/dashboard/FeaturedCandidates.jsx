import "./../../../styles/recruiter/dashboard/FeaturedCandidates.css";

function FeaturedCandidates() {

    const candidates = [

        {
            name: "Ana Castillo",
            score: "92%",
            status: "Perfil completo"
        },

        {
            name: "Jorge Salazar",
            score: "88%",
            status: "Experiencia validada"
        },

        {
            name: "Diego Ruiz",
            score: "81%",
            status: "Disponible inmediato"
        }

    ];

    return (

        <section className="featured-candidates">

            <div className="featured-header">

                <h2>Candidatos recomendados</h2>

                <button>Ver todos</button>

            </div>

            {candidates.map((candidate) => (

                <article
                    key={candidate.name}
                    className="candidate-card"
                >

                    <div>

                        <h3>{candidate.name}</h3>

                        <p>{candidate.status}</p>

                    </div>

                    <span>

                        {candidate.score}

                    </span>

                </article>

            ))}

        </section>

    );

}

export default FeaturedCandidates;