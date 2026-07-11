import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./../../../styles/recruiter/dashboard/JobsTable.css";

import { formatSalary } from "../../../utils/formatSalary";

const STATUS_LABELS = {
    draft: "Borrador",
    published: "Publicada",
    paused: "Pausada",
    closed: "Cerrada",
};

/* Cuántas vacantes se muestran antes del botón "Mostrar todas" */
const VISIBLE_JOBS = 5;

function StatusBadge({ status }) {

    const className = `job-status-badge job-status-${status || "draft"}`;

    return (
        <span className={className}>
            {STATUS_LABELS[status] || status || "—"}
        </span>
    );

}

function JobsTable({ jobs, loading, searching }) {

    const navigate = useNavigate();

    const [showAll, setShowAll] = useState(false);

    const visibleJobs = showAll
        ? jobs
        : jobs.slice(0, VISIBLE_JOBS);

    const hiddenCount = jobs.length - VISIBLE_JOBS;

    return (

        <section className="jobs-table">

            <div className="jobs-header">

                <h2>
                    Tus vacantes
                    {!loading && jobs.length > 0 && (
                        <span className="jobs-count">{jobs.length}</span>
                    )}
                </h2>

                <button onClick={() => navigate("/empresa/nueva-vacante")}>
                    Publicar vacante
                </button>

            </div>

            {loading && (

                <div className="jobs-skeleton" aria-hidden="true">
                    <div className="skeleton-row" />
                    <div className="skeleton-row" />
                    <div className="skeleton-row" />
                </div>

            )}

            {!loading && jobs.length === 0 && !searching && (

                <div className="jobs-empty">

                    <h3>Todavía no has publicado vacantes</h3>

                    <p>
                        Publica tu primera vacante y aparecerá aquí y en
                        el portal público de ChanceGT.
                    </p>

                    <button onClick={() => navigate("/empresa/nueva-vacante")}>
                        Publicar mi primera vacante
                    </button>

                </div>

            )}

            {!loading && jobs.length === 0 && searching && (

                <div className="jobs-empty">

                    <h3>Sin resultados</h3>

                    <p>
                        Ninguna de tus vacantes coincide con la búsqueda.
                    </p>

                </div>

            )}

            {!loading && visibleJobs.map((job) => (

                <div
                    key={job.id}
                    className="job-row"
                >

                    <div className="job-main">

                        <h3>{job.title}</h3>

                        <StatusBadge status={job.status} />

                    </div>

                    <div className="job-data">

                        <div>
                            <strong>{job.vacancies ?? "—"}</strong>
                            <small>Plazas</small>
                        </div>

                        <div>
                            <strong>
                                {job.published_at
                                    ? new Date(job.published_at).toLocaleDateString("es-GT")
                                    : "Sin publicar"}
                            </strong>
                            <small>Publicada</small>
                        </div>

                        <div>
                            <strong>
                                {formatSalary(job.salary_min, job.salary_max)}
                            </strong>
                            <small>Salario</small>
                        </div>

                        <button onClick={() => navigate(`/empresa/vacante/${job.id}`)}>
                            Ver detalle
                        </button>

                    </div>

                </div>

            ))}

            {!loading && hiddenCount > 0 && (

                <button
                    className="jobs-show-all"
                    onClick={() => setShowAll((prev) => !prev)}
                >
                    {showAll
                        ? "Mostrar menos"
                        : `Mostrar todas (${hiddenCount} más)`}
                </button>

            )}

        </section>

    );

}

export default JobsTable;
