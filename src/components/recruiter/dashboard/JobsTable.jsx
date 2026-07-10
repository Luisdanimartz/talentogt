import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./../../../styles/recruiter/dashboard/JobsTable.css";

import { getCurrentCompany } from "../../../services/companyService";
import { getCompanyJobs } from "../../../services/jobService";

function JobsTable() {

    const navigate = useNavigate();

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        loadJobs();

    }, []);

    async function loadJobs() {

        setLoading(true);

        const { data: company } = await getCurrentCompany();

        if (!company) {
            setLoading(false);
            return;
        }

        const { data } = await getCompanyJobs(company.id);

        setJobs(data || []);

        setLoading(false);

    }

    return (

        <section className="jobs-table">

            <div className="jobs-header">

                <h2>Vacantes</h2>

                <button onClick={() => navigate("/empresa/nueva-vacante")}>
                    Publicar vacante
                </button>

            </div>

            {loading && <p>Cargando vacantes...</p>}

            {!loading && jobs.length === 0 && (
                <p>
                    Todavía no has publicado ninguna vacante.
                </p>
            )}

            {!loading && jobs.map((job) => (

                <div
                    key={job.id}
                    className="job-row"
                >

                    <div className="job-main">

                        <h3>{job.title}</h3>

                        <span className="status">
                            {job.status || "—"}
                        </span>

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
                                {job.salary_min && job.salary_max
                                    ? `Q${job.salary_min} - Q${job.salary_max}`
                                    : "No especificado"}
                            </strong>
                            <small>Salario</small>
                        </div>

                        <button onClick={() => navigate("/empresa/nueva-vacante")}>
                            Ver →
                        </button>

                    </div>

                </div>

            ))}

        </section>

    );

}

export default JobsTable;
