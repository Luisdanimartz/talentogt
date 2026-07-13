import { useEffect, useState } from "react";

import "./../../styles/theme.css";
import "./../../styles/recruiter/layout/RecruiterDashboard.css";
import "./../../styles/recruiter/Applicants.css";

import RecruiterSidebar from "../../components/recruiter/layout/RecruiterSidebar";

import {
    getMyCompanyContext,
    puedeGestionarCandidatos,
} from "../../services/teamService";

import {
    scheduleInterview,
    INTERVIEW_MODALITIES,
} from "../../services/interviewService";

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
        .filter(Boolean).join(" ") || "Candidato";

}

/* ¿Ya se realizó al menos una entrevista de esta postulación? */
function tieneEntrevistaRealizada(app) {
    return (app.interviews || []).some((iv) => iv.status === "realizada");
}

function Applicants() {

    const [company, setCompany] = useState(null);
    const [myRole, setMyRole] = useState(null);
    const [applications, setApplications] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [savingId, setSavingId] = useState(null);

    /* Filtro por vacante publicada */
    const [jobFilter, setJobFilter] = useState("todas");

    /* Seleccion masiva (para avisar a varios candidatos a la vez) */
    const [seleccionados, setSeleccionados] = useState([]);
    const [bulkSaving, setBulkSaving] = useState(false);

    /* Agendar entrevista: id de la postulacion abierta y el borrador */
    const [schedulingId, setSchedulingId] = useState(null);
    const [schedulingSaving, setSchedulingSaving] = useState(false);
    const [draft, setDraft] = useState({
        fecha: "",
        hora: "",
        modality: "Presencial",
        locationOrLink: "",
        notes: "",
    });

    useEffect(() => {

        loadData();

    }, []);

    async function loadData() {

        setLoading(true);

        const [{ company: companyData, role }, departmentsRes] =
            await Promise.all([
                getMyCompanyContext(),
                getDepartments(),
            ]);

        setDepartments(departmentsRes.data || []);

        if (!companyData) {
            setLoading(false);
            return;
        }

        setCompany(companyData);
        setMyRole(role);

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

    function toggleSeleccionado(applicationId) {
        setSeleccionados((prev) =>
            prev.includes(applicationId)
                ? prev.filter((id) => id !== applicationId)
                : [...prev, applicationId]
        );
    }

    function limpiarSeleccion() {
        setSeleccionados([]);
    }

    async function handleBulkReject() {

        if (seleccionados.length === 0) return;

        const seguro = window.confirm(
            `¿Marcar ${seleccionados.length} ${seleccionados.length === 1 ? "candidato" : "candidatos"} como "No seleccionado"? Cada uno verá el cambio en su proceso y recibirá el aviso automático.`
        );

        if (!seguro) return;

        setBulkSaving(true);

        const resultados = await Promise.all(
            seleccionados.map((id) => updateApplicationStatus(id, "rejected"))
        );

        setBulkSaving(false);

        const fallidos = resultados.filter((r) => r.error);

        setApplications((prev) =>
            prev.map((app) =>
                seleccionados.includes(app.id)
                    ? { ...app, current_status: "rejected" }
                    : app
            )
        );

        setSeleccionados([]);

        if (fallidos.length > 0) {
            alert(
                `Se actualizaron algunos, pero ${fallidos.length} no se pudieron marcar. Intenta de nuevo con esos.`
            );
        }

    }

    function abrirAgendar(app) {

        setSchedulingId(app.id);

        setDraft({
            fecha: "",
            hora: "",
            modality: "Presencial",
            locationOrLink: "",
            notes: "",
        });

    }

    async function handleAgendar(app) {

        if (!draft.fecha || !draft.hora) {
            alert("Elige fecha y hora para la entrevista.");
            return;
        }

        /* Fecha local del navegador -> timestamp */
        const scheduledAt = new Date(
            `${draft.fecha}T${draft.hora}`
        ).toISOString();

        setSchedulingSaving(true);

        const { error } = await scheduleInterview({
            applicationId: app.id,
            scheduledAt,
            modality: draft.modality,
            locationOrLink: draft.locationOrLink,
            notes: draft.notes,
            currentStatus: app.current_status,
        });

        setSchedulingSaving(false);

        if (error) {
            alert("No se pudo agendar: " + error.message);
            return;
        }

        /* La postulacion pasa a Entrevista (con correo automatico) */
        setApplications((prev) =>
            prev.map((a) =>
                a.id === app.id
                    ? { ...a, current_status: "interview" }
                    : a
            )
        );

        setSchedulingId(null);

        alert(
            "Entrevista agendada. El candidato ve el paso en su proceso y recibe el aviso por correo. La encuentras en la sección Entrevistas."
        );

    }

    const puedoGestionar = puedeGestionarCandidatos(myRole);

    const pendientes = applications.filter(
        (app) => app.current_status === "applied"
    ).length;

    /* Vacantes unicas presentes en las postulaciones, para el filtro */
    const vacantesDisponibles = Array.from(
        new Map(
            applications
                .filter((app) => app.jobs?.id)
                .map((app) => [app.jobs.id, app.jobs.title])
        ).entries()
    ).map(([id, title]) => ({ id, title }));

    /*
      Afinidad de cada candidato con SU vacante, calculada con
      el motor compartido (utils/matching.js), y ordenada del
      mejor al menor. Asi el reclutador ve primero a quien mas
      coincide, con verificaciones que puede comprobar.
    */
    const applicationsConAfinidad = applications
        .filter((app) =>
            jobFilter === "todas" ? true : app.jobs?.id === jobFilter
        )
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

            <RecruiterSidebar company={company} role={myRole} />

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

                    {!loading && vacantesDisponibles.length > 0 && (

                        <div className="applicants-filter">

                            <label htmlFor="job-filter">
                                Filtrar por vacante
                            </label>

                            <select
                                id="job-filter"
                                value={jobFilter}
                                onChange={(e) => {
                                    setJobFilter(e.target.value);
                                    limpiarSeleccion();
                                }}
                            >
                                <option value="todas">
                                    Todas las vacantes
                                </option>

                                {vacantesDisponibles.map((v) => (
                                    <option key={v.id} value={v.id}>
                                        {v.title}
                                    </option>
                                ))}
                            </select>

                        </div>

                    )}

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

                {puedoGestionar && seleccionados.length > 0 && (

                    <div className="bulk-bar">

                        <span>
                            {seleccionados.length}{" "}
                            {seleccionados.length === 1
                                ? "candidato seleccionado"
                                : "candidatos seleccionados"}
                        </span>

                        <div className="bulk-bar-actions">

                            <button
                                type="button"
                                className="bulk-clear"
                                onClick={limpiarSeleccion}
                                disabled={bulkSaving}
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                className="bulk-reject"
                                onClick={handleBulkReject}
                                disabled={bulkSaving}
                            >
                                {bulkSaving
                                    ? "Actualizando…"
                                    : "Marcar como No seleccionado"}
                            </button>

                        </div>

                    </div>

                )}

                {!loading && applicationsConAfinidad.map((app) => (

                    <article
                        key={app.id}
                        className="applicant-card"
                    >

                        {puedoGestionar && (
                            <input
                                type="checkbox"
                                className="applicant-checkbox"
                                aria-label={`Seleccionar a ${nombreCandidato(app.candidate_profiles)}`}
                                checked={seleccionados.includes(app.id)}
                                onChange={() => toggleSeleccionado(app.id)}
                            />
                        )}

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

                            <a
                                href={`/empresa/candidatos/${app.id}/cv`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="applicant-cv-link"
                            >
                                ⬇ Descargar CV
                            </a>

                        </div>

                        <div className="applicant-status">

                            <label htmlFor={`status-${app.id}`}>
                                Estado
                            </label>

                            <select
                                id={`status-${app.id}`}
                                value={app.current_status || "applied"}
                                disabled={
                                    savingId === app.id || !puedoGestionar
                                }
                                title={
                                    !puedoGestionar
                                        ? "Tu rol es de solo lectura"
                                        : undefined
                                }
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

                            {tieneEntrevistaRealizada(app) && (
                                <span className="interview-done-chip">
                                    ✓ Entrevista realizada
                                </span>
                            )}

                            {puedoGestionar && schedulingId !== app.id && (
                                <button
                                    type="button"
                                    className="schedule-button"
                                    onClick={() => abrirAgendar(app)}
                                >
                                    🗓 Agendar entrevista
                                </button>
                            )}

                            {schedulingId === app.id && (

                                <div className="schedule-form">

                                    <strong>Agendar entrevista</strong>

                                    <label>
                                        Fecha
                                        <input
                                            type="date"
                                            value={draft.fecha}
                                            onChange={(e) =>
                                                setDraft((d) => ({
                                                    ...d,
                                                    fecha: e.target.value,
                                                }))
                                            }
                                        />
                                    </label>

                                    <label>
                                        Hora
                                        <input
                                            type="time"
                                            value={draft.hora}
                                            onChange={(e) =>
                                                setDraft((d) => ({
                                                    ...d,
                                                    hora: e.target.value,
                                                }))
                                            }
                                        />
                                    </label>

                                    <label>
                                        Modalidad
                                        <select
                                            value={draft.modality}
                                            onChange={(e) =>
                                                setDraft((d) => ({
                                                    ...d,
                                                    modality: e.target.value,
                                                }))
                                            }
                                        >
                                            {INTERVIEW_MODALITIES.map((m) => (
                                                <option key={m} value={m}>
                                                    {m}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label>
                                        {draft.modality === "Virtual"
                                            ? "Enlace de la reunión"
                                            : draft.modality === "Telefónica"
                                                ? "Teléfono"
                                                : "Dirección"}
                                        <input
                                            type="text"
                                            value={draft.locationOrLink}
                                            onChange={(e) =>
                                                setDraft((d) => ({
                                                    ...d,
                                                    locationOrLink:
                                                        e.target.value,
                                                }))
                                            }
                                            placeholder={
                                                draft.modality === "Virtual"
                                                    ? "https://meet…"
                                                    : ""
                                            }
                                        />
                                    </label>

                                    <label>
                                        Notas internas (opcional)
                                        <textarea
                                            rows={2}
                                            value={draft.notes}
                                            onChange={(e) =>
                                                setDraft((d) => ({
                                                    ...d,
                                                    notes: e.target.value,
                                                }))
                                            }
                                            placeholder="Solo las ve tu equipo"
                                        />
                                    </label>

                                    <div className="schedule-actions">

                                        <button
                                            type="button"
                                            className="schedule-confirm"
                                            disabled={schedulingSaving}
                                            onClick={() => handleAgendar(app)}
                                        >
                                            {schedulingSaving
                                                ? "Agendando…"
                                                : "Confirmar"}
                                        </button>

                                        <button
                                            type="button"
                                            className="schedule-cancel"
                                            onClick={() =>
                                                setSchedulingId(null)
                                            }
                                        >
                                            Cancelar
                                        </button>

                                    </div>

                                </div>

                            )}

                        </div>

                    </article>

                ))}

            </main>

        </div>

    );

}

export default Applicants;
