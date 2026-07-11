import "./../../../styles/recruiter/dashboard/StatusOverview.css";

/*
  Distribución real de tus vacantes por estado.
  100% calculado de la tabla jobs — nada inventado.
*/

const STATUSES = [
    { key: "published", label: "Publicadas", tone: "teal" },
    { key: "draft", label: "Borradores", tone: "slate" },
    { key: "paused", label: "Pausadas", tone: "amber" },
    { key: "closed", label: "Cerradas", tone: "red" },
];

function StatusOverview({ jobs, loading }) {

    const total = jobs.length;

    return (

        <section className="status-overview">

            <h2>Estado de tus vacantes</h2>

            {loading && <p className="status-loading">Cargando…</p>}

            {!loading && total === 0 && (
                <p className="status-loading">
                    Aquí verás el resumen cuando publiques tu primera
                    vacante.
                </p>
            )}

            {!loading && total > 0 && STATUSES.map((status) => {

                const count = jobs.filter(
                    (job) =>
                        (job.status || "").toLowerCase() === status.key
                ).length;

                const percent = total > 0
                    ? Math.round((count / total) * 100)
                    : 0;

                return (

                    <div
                        key={status.key}
                        className="status-item"
                    >

                        <div className="status-item-head">

                            <span>{status.label}</span>

                            <strong>{count}</strong>

                        </div>

                        <div className="status-bar">

                            <div
                                className={`status-bar-fill ${status.tone}`}
                                style={{ width: `${percent}%` }}
                            />

                        </div>

                    </div>

                );

            })}

        </section>

    );

}

export default StatusOverview;
