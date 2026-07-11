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
import { computeMatches } from "../../utils/matching";
import { getDepartments } from "../../services/locationService";

/* Dias que un candidato lleva esperando respuesta */
function diasEsperando(appliedAt) {
    if (!appliedAt) return 0;
    return Math.floor(
        (Date.now() - new Date(appliedAt).getTime()) / 86400000
    );
}

function nombreCandidato(profile) {

    if (!profile) return "Candidato";

    return [profile.first_name, profile.last_name]
        .filter(Boolean)
        .join(" ") || "Candidato";

}

function Applicants() {

    const [company, setCompany] = useState(null);
    const [applications, setApplications] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [savingId, setSavingId] = useState(null);

    useEffect(() => {

        loadData();

    }, []);

    async function loadData() {

        setLoading(true);

        const [{ data: companyData }, departmentsRes] =
            await Promise.all([
                getCurrentCompany(),
                getDepartments(),
            ]);

        setDepartments(departmentsRes.data || []);

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

    const pendientes = applications.filter(
        (app) => app.current_status === "applied"
    ).length;

    /*
      Afinidad de cada candidato con SU vacante, calculada con
      el motor compartido (utils/matching.js), y ordenada del
      mejor al menor. Asi el reclutador ve primero a quien mas
      coincide, con verificaciones que puede comprobar.
    */
    const applicationsConAfinidad = applications
        .map((app) => {

            const jobDept = departments.find(
                (d) => d.id === app.jobs?.department_id
            )?.name;

            const match = computeMatches(
                app.candidate_profiles,
                app.jobs,
                jobDept
            );

            return { ...app, match };

        })
        .sort((a, b) => {

            /* Los que exceden el salario de la plaza van al final;
               el resto, del mejor al menor puntaje */
            if (a.match.salaryMismatch !== b.match.salaryMismatch) {
                return a.match.salaryMismatch ? 1 : -1;
            }

            return b.match.score - a.match.score;

        });

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

                {!loading && !loadError && pendientes > 0 && (

                    <div className="applicants-pending-banner">

                        <strong>
                            ⚠ {pendientes}{" "}
                            {pendientes === 1
                                ? "candidato espera"
                                : "candidatos esperan"}{" "}
                            tu respuesta
                        </strong>

                        <p>
                            Cada candidato ve el estado de su proceso en
                            tiempo real, y tu porcentaje de respuesta es
                            público en todas tus vacantes. Responder a
                            todos —aunque sea "No seleccionado"— mejora
                            tu reputación y atrae mejor talento.
                        </p>

                    </div>

                )}

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

                {!loading && applicationsConAfinidad.map((app) => (

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

                                {app.current_status === "applied" && (
                                    <span
                                        className={
                                            diasEsperando(app.applied_at) >= 3
                                                ? "waiting-chip waiting-late"
                                                : "waiting-chip"
                                        }
                                    >
                                        {diasEsperando(app.applied_at) === 0
                                            ? "Esperando respuesta desde hoy"
                                            : `Sin respuesta hace ${diasEsperando(app.applied_at)} ${diasEsperando(app.applied_at) === 1 ? "día" : "días"}`}
                                    </span>
                                )}
                            </p>

                            {app.match.total > 0 && (

                                <details className="applicant-match">

                                    <summary>
                                        <span
                                            className={
                                                app.match.salaryMismatch
                                                    ? "match-chip match-bad"
                                                    : app.match.score >=
                                                        Math.ceil(app.match.total / 2)
                                                        ? "match-chip match-good"
                                                        : "match-chip"
                                            }
                                        >
                                            Afinidad: {app.match.score} de{" "}
                                            {app.match.total}
                                        </span>

                                        {app.match.salaryMismatch && (
                                            <span className="match-chip match-bad">
                                                ⚠ Pretensión salarial arriba del rango
                                            </span>
                                        )}

                                        <em>ver por qué</em>
                                    </summary>

                                    <ul>
                                        {app.match.checks.map((check, i) => (
                                            <li
                                                key={i}
                                                className={
                                                    check.ok
                                                        ? "match-ok"
                                                        : "match-no"
                                                }
                                            >
                                                {check.ok ? "✓" : "•"}{" "}
                                                {check.text}
                                            </li>
                                        ))}
                                    </ul>

                                </details>

                            )}

                            <details className="applicant-profile">

                                <summary>Ver perfil completo</summary>

                                <div className="profile-full">

                                    {app.candidate_profiles?.expected_salary && (
                                        <p>
                                            <strong>Pretensión salarial:</strong>{" "}
                                            Q{Number(app.candidate_profiles.expected_salary).toLocaleString("en-US")}{" "}
                                            mensuales
                                        </p>
                                    )}

                                    {app.candidate_profiles?.skills && (
                                        <p>
                                            <strong>Habilidades:</strong>{" "}
                                            {app.candidate_profiles.skills}
                                        </p>
                                    )}

                                    {app.candidate_profiles?.candidate_experience?.length > 0 && (
                                        <div className="profile-block">
                                            <strong>Experiencia laboral</strong>
                                            <ul>
                                                {app.candidate_profiles.candidate_experience.map((exp, i) => (
                                                    <li key={i}>
                                                        {[
                                                            exp.job_title,
                                                            exp.company,
                                                            exp.years
                                                                ? `${exp.years} años`
                                                                : null,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(" — ")}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {app.candidate_profiles?.candidate_education?.length > 0 && (
                                        <div className="profile-block">
                                            <strong>Formación académica</strong>
                                            <ul>
                                                {app.candidate_profiles.candidate_education.map((edu, i) => (
                                                    <li key={i}>
                                                        {[
                                                            edu.level,
                                                            edu.institution,
                                                            edu.graduation_year,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(" — ")}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {!app.candidate_profiles?.candidate_education?.length &&
                                        !app.candidate_profiles?.candidate_experience?.length &&
                                        !app.candidate_profiles?.skills && (
                                            <p className="profile-empty">
                                                El candidato aún no completa
                                                formación, experiencia ni
                                                habilidades en su perfil.
                                            </p>
                                        )}

                                </div>

                            </details>

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
