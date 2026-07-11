import { useEffect, useState } from "react";

import "./../../styles/theme.css";
import "./../../styles/recruiter/layout/RecruiterDashboard.css";
import "./../../styles/recruiter/Applicants.css";

import RecruiterSidebar from "../../components/recruiter/layout/RecruiterSidebar";

import { getCurrentCompany } from "../../services/companyService";

import {
    getCompanyApplications,
    updateApplicationStatus,
} from "../../services/applicationService";

import { APPLICATION_STATUSES } from "../../utils/applicationStatus";

function nombreCandidato(profile) {

    if (!profile) return "Candidato";

    return [profile.first_name, profile.last_name]
        .filter(Boolean)
        .join(" ") || "Candidato";

}

function Applicants() {

    const [company, setCompany] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [savingId, setSavingId] = useState(null);

    useEffect(() => {

        loadData();

    }, []);

    async function loadData() {

        setLoading(true);

        const { data: companyData } = await getCurrentCompany();

        if (!companyData) {
            setLoading(false);
            return;
        }

        setCompany(companyData);

        const { data, error } =
            await getCompanyApplications(companyData.id);

        if (error) {
            setLoadError(error.message);
        }

        setApplications(data || []);

        setLoading(false);

    }

    async function handleStatusChange(applicationId, status) {

        setSavingId(applicationId);

        const { error } =
            await updateApplicationStatus(applicationId, status);

        setSavingId(null);

        if (error) {
            alert(
                "No se pudo actualizar el estado: " + error.message
            );
            return;
        }

        setApplications((prev) =>
            prev.map((app) =>
                app.id === applicationId
                    ? { ...app, current_status: status }
                    : app
            )
        );

    }

    /* Los "por revisar" primero, luego el resto por fecha */
    const pendientes = applications.filter(
        (app) => app.current_status === "applied"
    ).length;

    return (

        <div className="dashboard">

            <RecruiterSidebar company={company} />

            <main className="dashboard-content">

                <header className="applicants-header">

                    <div>

                        <h1>Candidatos</h1>

                        <p>
                            {loading
                                ? "Cargando postulaciones…"
                                : pendientes > 0
                                    ? `Tienes ${pendientes} ${pendientes === 1 ? "candidato" : "candidatos"} por revisar. Cambia su estado para que sepan cómo va su proceso.`
                                    : "Postulaciones a tus vacantes. Cambia su estado para que cada candidato sepa cómo va su proceso."}
                        </p>

                    </div>

                </header>

                {loadError && (

                    <div className="applicants-error">
                        No se pudieron cargar las postulaciones:
                        {" "}{loadError}
                    </div>

                )}

                {!loading && !loadError && applications.length === 0 && (

                    <div className="applicants-empty">

                        <h3>Aún no tienes postulaciones</h3>

                        <p>
                            Cuando un candidato se postule a alguna de tus
                            vacantes, aparecerá aquí para que lo revises.
                        </p>

                    </div>

                )}

                {!loading && applications.map((app) => (

                    <article
                        key={app.id}
                        className="applicant-card"
                    >

                        <div className="applicant-avatar">
                            {nombreCandidato(app.candidate_profiles)
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div className="applicant-info">

                            <h3>
                                {nombreCandidato(app.candidate_profiles)}
                            </h3>

                            <p className="applicant-meta">
                                {[
                                    app.candidate_profiles?.profession,
                                    app.candidate_profiles?.municipality,
                                    app.candidate_profiles?.phone,
                                ]
                                    .filter(Boolean)
                                    .join(" · ") || "Sin datos de perfil"}
                            </p>

                            <p className="applicant-job">
                                Postulado a{" "}
                                <strong>{app.jobs?.title}</strong>
                                {app.applied_at &&
                                    ` el ${new Date(app.applied_at).toLocaleDateString("es-GT")}`}
                            </p>

                        </div>

                        <div className="applicant-status">

                            <label htmlFor={`status-${app.id}`}>
                                Estado
                            </label>

                            <select
                                id={`status-${app.id}`}
                                value={app.current_status || "applied"}
                                disabled={savingId === app.id}
                                onChange={(e) =>
                                    handleStatusChange(app.id, e.target.value)
                                }
                                className={`status-select status-${app.current_status || "applied"}`}
                            >

                                {APPLICATION_STATUSES.map((status) => (
                                    <option
                                        key={status.value}
                                        value={status.value}
                                    >
                                        {status.label}
                                    </option>
                                ))}

                            </select>

                        </div>

                    </article>

                ))}

            </main>

        </div>

    );

}

export default Applicants;
