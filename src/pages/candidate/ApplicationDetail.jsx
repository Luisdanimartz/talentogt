import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import "../../styles/theme.css";
import "../../styles/ApplicationDetail.css";

import {
    getMyApplicationDetail,
    getCurrentCandidateProfile,
    getOpenJobsForSuggestions,
    getMyApplications,
    withdrawApplication,
} from "../../services/candidateService";
import { getDepartments } from "../../services/locationService";
import { computeMatches } from "../../utils/matching";
import { getJobApplicantStats } from "../../services/jobService";
import { getMyInterviewsForApplication } from "../../services/interviewService";
import { formatSalary } from "../../utils/formatSalary";
import CompanyResponseBadge from "../../components/CompanyResponseBadge";
import ResolutionBadge from "../../components/ResolutionBadge";

/*
  Estado del proceso de seleccion — la version ChanceGT.

  - Linea de tiempo REAL (tabla application_status_history).
  - Comparativa con los demas postulantes usando solo numeros
    agregados (funcion job_applicant_stats) — nunca datos de
    otras personas.
*/

/* Etapas del proceso, en orden */
const PIPELINE = [
    { key: "applied", label: "Postulado", detail: "Tu postulación llegó a la empresa" },
    { key: "cv_viewed", label: "CV abierto", detail: "Alguien de la empresa abrió tu CV" },
    { key: "reviewing", label: "En revisión", detail: "La empresa está revisando tu perfil" },
    { key: "interview", label: "Entrevista", detail: "¡Te llamaron a entrevista!" },
    { key: "decision", label: "Decisión", detail: "Resultado del proceso" },
];

/*
  "CV abierto" no es un estado que la empresa elija: es un hecho que
  el sistema detecta solo (applications.cv_viewed_at). Por eso no
  vive en current_status — si viviera ahí, abrir un CV le subiría la
  reputación de respuesta a la empresa sin que haya respondido nada.
  Ver database/058_cv_abierto_automatico.sql.
*/
function etapaDe(status, cvVisto) {

    if (status === "hired" || status === "rejected") return "decision";

    if (status === "applied" && cvVisto) return "cv_viewed";

    return status;

}

function ApplicationDetail() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [application, setApplication] = useState(null);
    const [stats, setStats] = useState(null);
    const [interview, setInterview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const [profile, setProfile] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [sugeridas, setSugeridas] = useState([]);
    const [retirando, setRetirando] = useState(false);

    useEffect(() => {

        loadData();

    }, [id]);

    async function loadData() {

        setLoading(true);

        const { data, error } = await getMyApplicationDetail(id);

        if (error) {
            setLoadError(error.message);
        }

        setApplication(data);

        if (data?.jobs?.id) {

            const { data: statsData } =
                await getJobApplicantStats(data.jobs.id);

            if (statsData && statsData.length > 0) {
                setStats(statsData[0]);
            }

        }

        /*
          Perfil y departamentos: para poder decirle al candidato
          que cumple y que le falta de ESTA plaza, con el mismo
          motor que usa la empresa (utils/matching.js).
        */
        const [perfilRes, deptosRes] = await Promise.all([
            getCurrentCandidateProfile(),
            getDepartments(),
        ]);

        setProfile(perfilRes.data || null);
        setDepartments(deptosRes.data || []);

        /*
          Otras plazas que le encajan. Se calculan aqui y no en el
          servidor porque el motor de coincidencias vive en el
          cliente y ya esta probado.
        */
        if (perfilRes.data) {

            const [abiertasRes, misRes] = await Promise.all([
                getOpenJobsForSuggestions(30),
                getMyApplications(),
            ]);

            const yaPostuladas = new Set(
                (misRes.data || [])
                    .map((app) => app.jobs?.id)
                    .filter(Boolean)
            );

            const deptos = deptosRes.data || [];

            const candidatas = (abiertasRes.data || [])
                .filter((vacante) => !yaPostuladas.has(vacante.id))
                .map((vacante) => {

                    const nombreDepto = deptos.find(
                        (d) => d.id === vacante.department_id
                    )?.name;

                    const match = computeMatches(
                        perfilRes.data,
                        vacante,
                        nombreDepto
                    );

                    return { ...vacante, match };

                })
                .filter((vacante) => vacante.match.score > 0)
                .sort((a, b) => b.match.score - a.match.score)
                .slice(0, 3);

            setSugeridas(candidatas);

        }

        /*
          ¿Hay entrevista agendada? (funcion candidate_interviews:
          solo fecha, modalidad, lugar/enlace y estado — nunca las
          notas internas del reclutador). Si el SQL 009 aun no se
          corre, simplemente no se muestra nada.
        */
        if (data?.id) {

            const { data: interviewData } =
                await getMyInterviewsForApplication(data.id);

            const programada = (interviewData || []).find(
                (i) => i.status === "programada"
            );

            setInterview(programada || null);

        }

        setLoading(false);

    }

    if (loading) {
        return (
            <div className="appdetail-wrap">
                <p className="appdetail-loading">Cargando tu proceso…</p>
            </div>
        );
    }

    if (!application) {
        return (
            <div className="appdetail-wrap">
                <p className="appdetail-loading">
                    {loadError
                        ? `No se pudo cargar tu proceso: ${loadError}`
                        : "No encontramos esta postulación."}
                </p>
            </div>
        );
    }

    const job = application.jobs;

    /*
      Eventos reales del historial; si la postulacion es anterior
      a la tabla de historial, reconstruimos con lo que sabemos.
    */
    let eventos = (application.application_status_history || [])
        .slice()
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    if (!eventos.some((e) => e.status === "applied")) {
        eventos = [
            { status: "applied", created_at: application.applied_at },
            ...eventos,
        ];
    }

    if (
        application.current_status !== "applied" &&
        !eventos.some((e) => e.status === application.current_status)
    ) {
        eventos.push({
            status: application.current_status,
            created_at: application.updated_at,
        });
    }

    async function handleRetirar() {

        const motivo = window.prompt(
            "¿Por qué te retiras de este proceso? (opcional)\n\n" +
            "Por ejemplo: ya conseguí trabajo, el salario no me sirve, " +
            "queda muy lejos. Nos ayuda a mejorar."
        );

        /* Cancel en el prompt devuelve null: ahi no se hace nada */
        if (motivo === null) return;

        const seguro = window.confirm(
            "¿Seguro que quieres retirar tu candidatura? " +
            "La empresa dejará de considerarte y no se puede deshacer."
        );

        if (!seguro) return;

        setRetirando(true);

        const { error } = await withdrawApplication(application.id, motivo);

        setRetirando(false);

        if (error) {
            alert(error.message);
            return;
        }

        loadData();

    }

    /* Fecha por etapa (la mas reciente de cada una) */
    const fechaPorEtapa = {};

    eventos.forEach((evento) => {
        fechaPorEtapa[etapaDe(evento.status)] = evento.created_at;
    });

    /* La fecha del paso "CV abierto" no viene del historial de
       estados sino del sello que deja el sistema al abrirlo. */
    if (application.cv_viewed_at) {
        fechaPorEtapa.cv_viewed = application.cv_viewed_at;
    }

    const etapaActual = etapaDe(
        application.current_status,
        application.cv_viewed_at
    );

    const indexActual = PIPELINE.findIndex(
        (paso) => paso.key === etapaActual
    );

    const rechazado = application.current_status === "rejected";
    const contratado = application.current_status === "hired";

    /* Comparativa */
    const total = Number(stats?.total) || 0;
    const responded = Number(stats?.responded) || 0;
    const enDepto = Number(stats?.in_department) || 0;
    const avgExpected = stats?.avg_expected
        ? Math.round(Number(stats.avg_expected))
        : null;

    return (

        <div className="appdetail-wrap">

            <div className="appdetail-inner">

                <button
                    className="appdetail-back"
                    onClick={() => navigate("/candidato/dashboard")}
                >
                    ← Volver a mi panel
                </button>

                {/* ===== Encabezado ===== */}
                <header className="appdetail-hero">

                    <div>

                        <h1>{job?.title}</h1>

                        <p>
                            {job?.company_profiles?.company_name}
                            {" · Postulado el "}
                            {new Date(application.applied_at).toLocaleDateString("es-GT")}
                            {" · "}
                            {formatSalary(job?.salary_min, job?.salary_max)}
                        </p>

                        <CompanyResponseBadge
                            companyId={job?.company_id}
                            companyName={job?.company_profiles?.company_name}
                        />

                        {/* Mientras el proceso siga abierto, el candidato
                            ve cuanto falta para que la empresa resuelva.
                            Si ya se resolvio, no tiene sentido mostrarlo. */}
                        {application.current_status !== "hired" &&
                            application.current_status !== "rejected" && (
                                <ResolutionBadge job={job} />
                            )}

                        {application.auto_resolved && (
                            <div className="res-badge res-vencido">
                                <strong>
                                    ChanceGT cerró este proceso por ti
                                </strong>
                                <span>
                                    La empresa no resolvió dentro del plazo al
                                    que se comprometió, así que el sistema cerró
                                    el proceso para que no te quedaras esperando
                                    sin respuesta.
                                </span>
                            </div>
                        )}

                    </div>

                    <button
                        className="appdetail-verjob"
                        onClick={() => navigate(`/empleos/${job?.slug || job?.id}`)}
                    >
                        Ver la publicación
                    </button>

                </header>

                {/* ===== Tu entrevista (si hay una programada) ===== */}

                {interview && (

                    <div
                        style={{
                            background: "#E8F0FE",
                            border: "1px solid #BDD3F7",
                            borderRadius: 12,
                            padding: "16px 20px",
                            marginBottom: 24,
                        }}
                    >

                        <strong style={{ color: "#1A4B9B" }}>
                            🗓 Tienes una entrevista agendada
                        </strong>

                        <p style={{ margin: "6px 0 0", color: "#0B1F3A" }}>
                            {new Date(interview.scheduled_at).toLocaleString(
                                "es-GT",
                                {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                }
                            )}
                            {" · "}{interview.modality}
                            {interview.location_or_link && (
                                <>
                                    {" · "}
                                    {interview.modality === "Virtual"
                                        ? "Enlace: "
                                        : interview.modality === "Telefónica"
                                            ? "Teléfono: "
                                            : "Lugar: "}
                                    {interview.location_or_link}
                                </>
                            )}
                        </p>

                    </div>

                )}

                <div className="appdetail-grid">

                    {/* ===== Linea de tiempo ===== */}
                    <section className="appdetail-timeline">

                        <h2>Estado de tu proceso</h2>

                        {PIPELINE.map((paso, index) => {

                            const completado = index <= indexActual;
                            const esActual = index === indexActual;
                            const fecha = fechaPorEtapa[paso.key];

                            let label = paso.label;
                            let detail = paso.detail;

                            if (paso.key === "decision" && contratado) {
                                label = "¡Contratado! 🎉";
                                detail = "Felicidades, la empresa te seleccionó";
                            }

                            if (paso.key === "decision" && rechazado) {
                                label = "No seleccionado";
                                detail = "Esta vez no fue, pero tu perfil sigue creciendo";
                            }

                            return (

                                <div
                                    key={paso.key}
                                    className={
                                        completado
                                            ? esActual
                                                ? `timeline-step done current${rechazado && paso.key === "decision" ? " rejected" : ""}`
                                                : "timeline-step done"
                                            : "timeline-step"
                                    }
                                >

                                    <span className="timeline-dot">
                                        {completado ? "✓" : index + 1}
                                    </span>

                                    <div className="timeline-body">

                                        <strong>{label}</strong>

                                        <p>{detail}</p>

                                        {fecha && completado && (
                                            <small>
                                                {new Date(fecha).toLocaleDateString("es-GT", {
                                                    day: "numeric",
                                                    month: "long",
                                                })}
                                            </small>
                                        )}

                                    </div>

                                </div>

                            );

                        })}

                        {application.current_status === "withdrawn" && (
                            <p className="timeline-note">
                                Te retiraste de este proceso
                                {application.withdrawn_at &&
                                    ` el ${new Date(application.withdrawn_at).toLocaleDateString("es-GT", { day: "numeric", month: "long" })}`}
                                . La empresa ya no te está considerando.
                            </p>
                        )}

                        {application.current_status === "applied" && (
                            <p className="timeline-note">
                                {application.cv_viewed_at
                                    ? "Ya abrieron tu CV, pero la empresa todavía no da su respuesta formal. En ChanceGT su reputación de respuesta es pública, así que le conviene hacerlo pronto."
                                    : "La empresa aún no responde. En ChanceGT su reputación de respuesta es pública, así que le conviene hacerlo pronto."}
                            </p>
                        )}

                    </section>

                    {/* ===== Tu perfil contra esta plaza ===== */}
                    <section className="appdetail-fit">

                        <h2>Tu perfil contra esta plaza</h2>

                        {(() => {

                            if (!profile) {
                                return (
                                    <p className="fit-empty">
                                        Completa tu perfil para ver qué tan
                                        bien encajas con esta plaza.
                                    </p>
                                );
                            }

                            const nombreDepto = departments.find(
                                (d) => d.id === job?.department_id
                            )?.name;

                            const { checks, score, total } = computeMatches(
                                profile,
                                job,
                                nombreDepto
                            );

                            if (total === 0) {
                                return (
                                    <p className="fit-empty">
                                        Esta vacante no tiene requisitos
                                        suficientes para compararte.
                                    </p>
                                );
                            }

                            const faltantes = checks.filter((c) => !c.ok);

                            return (

                                <>

                                    <div className="fit-score">
                                        <strong>{score}</strong> de {total}{" "}
                                        requisitos cumplidos
                                    </div>

                                    <ul className="fit-list">

                                        {checks.map((check, i) => (
                                            <li
                                                key={i}
                                                className={
                                                    check.ok
                                                        ? "fit-ok"
                                                        : "fit-falta"
                                                }
                                            >
                                                {check.ok ? "✓" : "•"}{" "}
                                                {check.text}
                                            </li>
                                        ))}

                                    </ul>

                                    <p className="fit-nota">
                                        {faltantes.length === 0
                                            ? "Cumples con todo lo que pide la plaza. Ahora depende de la empresa."
                                            : "Lo que aparece sin marca es lo que puedes mejorar en tu perfil para las próximas plazas."}
                                    </p>

                                </>

                            );

                        })()}

                    </section>

                    {/* ===== Comparativa ===== */}
                    <aside className="appdetail-compare">

                        <h2>¿Cómo te comparas?</h2>

                        {total <= 1 && (
                            <p className="compare-empty">
                                Por ahora eres {total === 1 ? "el único postulante" : "de los primeros"} —
                                ¡ventaja de madrugador! Cuando haya más
                                candidatos, aquí verás cómo te comparas.
                            </p>
                        )}

                        {total > 1 && (

                            <>

                                <div className="compare-big">
                                    <span>{total}</span>
                                    candidatos postulados a esta plaza
                                </div>

                                <div className="compare-item">
                                    <strong>
                                        {responded} de {total}
                                    </strong>{" "}
                                    ya recibieron respuesta de la empresa
                                </div>

                                <div className="compare-item">
                                    <strong>
                                        {enDepto} de {total}
                                    </strong>{" "}
                                    viven en el departamento de la plaza
                                </div>

                                {avgExpected && total >= 3 && (
                                    <div className="compare-item">
                                        La pretensión salarial promedio es{" "}
                                        <strong>
                                            Q{avgExpected.toLocaleString("en-US")}
                                        </strong>
                                    </div>
                                )}

                                <p className="compare-note">
                                    Datos agregados de todos los postulantes —
                                    nunca mostramos información individual de
                                    nadie, tampoco la tuya.
                                </p>

                            </>

                        )}

                        <div className="compare-tip">
                            💡 Mejora tus coincidencias agregando a tu
                            perfil las palabras clave que pide la vacante.
                            <button
                                onClick={() => navigate("/candidato/crear-cv")}
                            >
                                Editar mi perfil
                            </button>
                        </div>

                    </aside>

                </div>

                {/* ===== Otras plazas que encajan contigo ===== */}

                {sugeridas.length > 0 && (

                    <section className="appdetail-sugeridas">

                        <h2>Otras plazas que encajan contigo</h2>

                        <p className="sugeridas-intro">
                            Mientras esperas respuesta, estas vacantes
                            abiertas coinciden con tu perfil.
                        </p>

                        <div className="sugeridas-lista">

                            {sugeridas.map((vacante) => (

                                <button
                                    key={vacante.id}
                                    type="button"
                                    className="sugerida-card"
                                    onClick={() =>
                                        navigate(`/empleos/${vacante.slug || vacante.id}`)
                                    }
                                >

                                    <strong>{vacante.title}</strong>

                                    <span className="sugerida-empresa">
                                        {vacante.company_profiles?.company_name}
                                    </span>

                                    <span className="sugerida-salario">
                                        {formatSalary(
                                            vacante.salary_min,
                                            vacante.salary_max
                                        )}
                                    </span>

                                    <span className="sugerida-match">
                                        Cumples {vacante.match.score} de{" "}
                                        {vacante.match.total} requisitos
                                    </span>

                                </button>

                            ))}

                        </div>

                    </section>

                )}

                {/* ===== Retirar candidatura ===== */}

                {application.current_status !== "withdrawn" &&
                    application.current_status !== "hired" &&
                    application.current_status !== "rejected" && (

                        <section className="appdetail-retirar">

                            <div>
                                <strong>¿Ya no te interesa esta plaza?</strong>
                                <p>
                                    Puedes retirarte del proceso. La empresa
                                    dejará de considerarte y tu decisión no
                                    afecta su reputación en ChanceGT.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleRetirar}
                                disabled={retirando}
                            >
                                {retirando
                                    ? "Retirando…"
                                    : "Retirar mi candidatura"}
                            </button>

                        </section>

                    )}

            </div>

        </div>

    );

}

export default ApplicationDetail;
