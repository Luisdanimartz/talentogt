import "./../../../styles/recruiter/dashboard/RecentActivity.css";

/*
  Actividad reciente construida con timestamps reales:
  jobs (created_at, published_at) y entrevistas marcadas
  como realizadas (interviews.updated_at).
*/

function nombreCandidato(app) {

    const profile = app?.candidate_profiles;

    if (!profile) return "el candidato";

    return [profile.first_name, profile.last_name]
        .filter(Boolean)
        .join(" ") || "el candidato";

}

function buildEvents(jobs, interviews) {

    const events = [];

    jobs.forEach((job) => {

        if (job.created_at) {
            events.push({
                date: new Date(job.created_at),
                text: `Creaste la vacante "${job.title}".`,
            });
        }

        if (job.published_at) {
            events.push({
                date: new Date(job.published_at),
                text: `Publicaste "${job.title}".`,
            });
        }

    });

    interviews
        .filter((iv) => iv.status === "realizada")
        .forEach((iv) => {

            if (!iv.updated_at) return;

            events.push({
                date: new Date(iv.updated_at),
                text: `Marcaste como realizada la entrevista de ${nombreCandidato(iv.applications)} para "${iv.applications?.jobs?.title || "una vacante"}".`,
            });

        });

    return events
        .sort((a, b) => b.date - a.date)
        .slice(0, 6);

}

function formatDate(date) {

    return date.toLocaleDateString("es-GT", {
        day: "numeric",
        month: "short",
    });

}

function RecentActivity({ jobs, interviews = [], loading }) {

    const events = buildEvents(jobs, interviews);

    return (

        <section className="recent-activity">

            <h2>Actividad reciente</h2>

            {loading && <p className="activity-empty">Cargando…</p>}

            {!loading && events.length === 0 && (
                <p className="activity-empty">
                    Tu actividad aparecerá aquí cuando crees o
                    publiques vacantes.
                </p>
            )}

            {!loading && events.map((event, index) => (

                <div
                    key={index}
                    className="activity-item"
                >

                    <span className="activity-time">
                        {formatDate(event.date)}
                    </span>

                    <p>{event.text}</p>

                </div>

            ))}

        </section>

    );

}

export default RecentActivity;
