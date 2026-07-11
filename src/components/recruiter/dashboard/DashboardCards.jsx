import "./../../../styles/recruiter/dashboard/DashboardCards.css";

import {
  Work as WorkIcon,
  RocketLaunch as RocketIcon,
  Groups as GroupsIcon,
  Event as EventIcon,
} from "@mui/icons-material";

/*
  Tarjetas del dashboard.

  Reales (calculadas de la tabla jobs):
    - Vacantes activas (status = published)
    - Publicadas esta semana (published_at >= lunes de esta semana)

  Reales (calculadas de la tabla applications):
    - Candidatos por revisar (current_status = applied)

  Honestas (aún sin tablas/lógica detrás):
    - Entrevistas hoy -> se activa con el módulo de entrevistas
*/

function inicioDeSemana() {

    const hoy = new Date();
    const dia = hoy.getDay(); // 0 = domingo

    const diffALunes = dia === 0 ? 6 : dia - 1;

    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - diffALunes);
    lunes.setHours(0, 0, 0, 0);

    return lunes;

}

function DashboardCards({ jobs, applications = [], applicationsError, loading, onCardClick }) {

    const lunes = inicioDeSemana();

    const activas = jobs.filter(
        (job) => (job.status || "").toLowerCase() === "published"
    ).length;

    const estaSemana = jobs.filter(
        (job) =>
            job.published_at && new Date(job.published_at) >= lunes
    ).length;

    const cards = [
        {
            title: "Vacantes activas",
            value: activas,
            icon: WorkIcon,
            tone: "teal",
            target: "jobs",
        },
        {
            title: "Publicadas esta semana",
            value: estaSemana,
            icon: RocketIcon,
            tone: "amber",
            target: "jobs",
        },
        applicationsError
            ? {
                title: "Candidatos por revisar",
                icon: GroupsIcon,
                tone: "navy",
                soon: "Sin acceso a postulaciones (revisar permisos)",
            }
            : {
                title: "Candidatos por revisar",
                value: applications.filter(
                    (app) => (app.current_status || "applied") === "applied"
                ).length,
                icon: GroupsIcon,
                tone: "navy",
                target: "candidatos",
            },
        {
            title: "Entrevistas hoy",
            icon: EventIcon,
            tone: "slate",
            soon: "Se activará con el módulo de entrevistas",
        },
    ];

    return (

        <section className="dashboard-cards">

            {cards.map((card) => (

                <article
                    key={card.title}
                    className={
                        card.soon
                            ? `dashboard-card soon ${card.tone}`
                            : card.target
                                ? `dashboard-card clickable ${card.tone}`
                                : `dashboard-card ${card.tone}`
                    }
                    onClick={
                        card.target && !card.soon
                            ? () => onCardClick?.(card.target)
                            : undefined
                    }
                    role={card.target && !card.soon ? "button" : undefined}
                    tabIndex={card.target && !card.soon ? 0 : undefined}
                    onKeyDown={
                        card.target && !card.soon
                            ? (e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onCardClick?.(card.target);
                                }
                            }
                            : undefined
                    }
                >

                    <span className={`card-icon ${card.tone}`}>
                        <card.icon fontSize="small" />
                    </span>

                    <div className="card-body">

                        <span className="card-title">
                            {card.title}
                        </span>

                        {card.soon ? (

                            <>
                                <span className="card-soon-badge">
                                    Próximamente
                                </span>

                                <small className="card-soon-note">
                                    {card.soon}
                                </small>
                            </>

                        ) : (

                            <h2>
                                {loading ? "…" : card.value}
                            </h2>

                        )}

                    </div>

                </article>

            ))}

        </section>

    );

}

export default DashboardCards;
