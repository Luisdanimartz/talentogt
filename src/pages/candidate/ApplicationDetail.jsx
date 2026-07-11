import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import "../../styles/theme.css";
import "../../styles/ApplicationDetail.css";

import { getMyApplicationDetail } from "../../services/candidateService";
import { getJobApplicantStats } from "../../services/jobService";
import { formatSalary } from "../../utils/formatSalary";
import { statusLabel } from "../../utils/applicationStatus";
import CompanyResponseBadge from "../../components/CompanyResponseBadge";

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
    { key: "reviewing", label: "En revisión", detail: "La empresa está revisando tu perfil" },
    { key: "interview", label: "Entrevista", detail: "¡Te llamaron a entrevista!" },
    { key: "decision", label: "Decisión", detail: "Resultado del proceso" },
];

function etapaDe(status) {

    if (status === "hired" || status === "rejected") return "decision";

    return status;

}

function ApplicationDetail() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [application, setApplication] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

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

    /* Fecha por etapa (la mas reciente de cada una) */
    const fechaPorEtapa = {};

    eventos.forEach((evento) => {
        fechaPorEtapa[etapaDe(evento.status)] = evento.created_at;
    });

    const etapaActual = etapaDe(application.current_status);

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

                    </div>

                    <button
                        className="appdetail-verjob"
                        onClick={() => navigate(`/vacantes/${job?.id}`)}
                    >
                        Ver la publicación
                    </button>

                </header>

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

                        {application.current_status === "applied" && (
                            <p className="timeline-note">
                                La empresa aún no responde. En ChanceGT su
                                reputación de respuesta es pública, así que
                                le conviene hacerlo pronto.
                            </p>
                        )}

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

            </div>

        </div>

    );

}

export default ApplicationDetail;
