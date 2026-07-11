import "./../../../styles/recruiter/dashboard/RecentActivity.css";

/*
  Actividad reciente construida SOLO con los timestamps reales
  de la tabla jobs (created_at, published_at). Cuando existan
  applications, agregaremos aquí las postulaciones.
*/

function buildEvents(jobs) {

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

function RecentActivity({ jobs, loading }) {

    const events = buildEvents(jobs);

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
