import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import "../styles/theme.css";
import "../styles/Jobs.css";

import {
    getPublishedJobs,
    getJobCategories,
    getEmploymentTypes,
    getPublicCompanyResponseSummary,
} from "../services/jobService";
import { getDepartments } from "../services/locationService";
import { formatSalary } from "../utils/formatSalary";
import { tiempoDesde } from "../utils/timeAgo";
import { computeMatches } from "../utils/matching";

import {
    getCurrentCandidateProfile,
    applyToJob,
    getMyApplicationForJob,
} from "../services/candidateService";

import { useAuth } from "../context/AuthContext";

import CompanyResponseBadge from "../components/CompanyResponseBadge";
import { sinVineta } from "../utils/bullets";

const WORK_MODES = ["Presencial", "Remoto", "Híbrido"];

const OPCIONES_FECHA = [
    { value: "", label: "Cualquier fecha" },
    { value: "hoy", label: "Hoy" },
    { value: "3dias", label: "Últimos 3 días" },
    { value: "semana", label: "Última semana" },
    { value: "15dias", label: "Últimos 15 días" },
    { value: "mes", label: "Último mes" },
];

const OPCIONES_SALARIO = [
    { value: "", label: "Cualquier salario" },
    { value: "2000", label: "Q2,000 o más" },
    { value: "4000", label: "Q4,000 o más" },
    { value: "6000", label: "Q6,000 o más" },
    { value: "8000", label: "Q8,000 o más" },
    { value: "10000", label: "Q10,000 o más" },
    { value: "12000", label: "Q12,000 o más" },
];

const OPCIONES_ORDEN = [
    { value: "relevancia", label: "Relevancia" },
    { value: "reciente", label: "Más recientes" },
    { value: "salario", label: "Mejor salario" },
    { value: "respuesta", label: "Empresas que responden más rápido" },
];

const OPCIONES_EXPERIENCIA = [
    { value: "", label: "Cualquier experiencia" },
    { value: "sin_experiencia", label: "Sin experiencia" },
    { value: "1", label: "1 año" },
    { value: "2", label: "2 años" },
    { value: "3", label: "3 años" },
    { value: "4", label: "4 años" },
    { value: "5_10", label: "5 a 10 años" },
    { value: "mas_10", label: "Más de 10 años" },
];

const OPCIONES_CONTRATO = [
    { value: "", label: "Cualquier tipo de contrato" },
    { value: "indefinido", label: "Tiempo indefinido" },
    { value: "determinado", label: "Tiempo determinado" },
];

function diasDesdeFiltro(valor) {

    const ahora = new Date();

    switch (valor) {
        case "hoy": return new Date(ahora.setHours(0, 0, 0, 0));
        case "3dias": return new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        case "semana": return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        case "15dias": return new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
        case "mes": return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        default: return null;
    }

}

/*
  Requisitos y beneficios: si vienen con lineas (viñetas del
  formulario), se muestran como lista ordenada; si es un parrafo
  de una publicacion vieja, se muestra tal cual.
*/
function BloqueLineas({ texto }) {

    const lineas = String(texto || "")
        .split("\n")
        .map((l) => sinVineta(l))
        .filter(Boolean);

    if (lineas.length <= 1) {
        return <p style={{ whiteSpace: "pre-line" }}>{texto}</p>;
    }

    return (
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            {lineas.map((linea, i) => (
                <li key={i}>{linea}</li>
            ))}
        </ul>
    );

}

function Jobs() {

    const navigate = useNavigate();
    const { user } = useAuth();
    const role = user?.user_metadata?.role;

    const [jobs, setJobs] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [employmentTypes, setEmploymentTypes] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    /* Filtros */
    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get("q") || "");
    const [departmentId, setDepartmentId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [workMode, setWorkMode] = useState("");
    const [employmentTypeId, setEmploymentTypeId] = useState("");
    const [experienceLevel, setExperienceLevel] = useState("");
    const [contractType, setContractType] = useState("");
    const [soloUrgentes, setSoloUrgentes] = useState(false);
    const [fechaFiltro, setFechaFiltro] = useState("");
    const [salarioMinFiltro, setSalarioMinFiltro] = useState("");
    const [orden, setOrden] = useState("relevancia");
    const [mostrarFiltros, setMostrarFiltros] = useState(false);

    /* Tiempo de respuesta de cada empresa (para el orden "responde
       más rápido"), companyId -> { total, responded, avg_response_days } */
    const [respuestaPorEmpresa, setRespuestaPorEmpresa] = useState({});

    /* Vista dividida */
    const [selectedId, setSelectedId] = useState(null);
    const [mobileDetail, setMobileDetail] = useState(false);

    /* Postulacion desde el panel */
    const [application, setApplication] = useState(null);
    const [applying, setApplying] = useState(false);
    const [applyError, setApplyError] = useState(null);

    useEffect(() => {

        loadData();

    }, []);

    async function loadData() {

        setLoading(true);

        const peticiones = [
            getPublishedJobs(),
            getDepartments(),
            getJobCategories(),
            getEmploymentTypes(),
            getPublicCompanyResponseSummary(),
        ];

        if (user && role === "candidato") {
            peticiones.push(getCurrentCandidateProfile());
        }

        const [jobsRes, departmentsRes, categoriesRes, employmentRes, respuestaRes, profileRes] =
            await Promise.all(peticiones);

        setJobs(jobsRes.data || []);
        setDepartments(departmentsRes.data || []);
        setCategories(categoriesRes.data || []);
        setEmploymentTypes(employmentRes.data || []);
        setProfile(profileRes?.data || null);

        const mapaRespuesta = {};
        (respuestaRes.data || []).forEach((r) => {
            mapaRespuesta[r.company_id] = r;
        });
        setRespuestaPorEmpresa(mapaRespuesta);

        setLoading(false);

    }

    const departmentName = (id) =>
        departments.find((d) => d.id === id)?.name || "";

    const employmentTypeName = (id) =>
        employmentTypes.find((t) => t.id === id)?.name || "";

    const etiquetaExperiencia = (valor) =>
        OPCIONES_EXPERIENCIA.find((o) => o.value === valor)?.label || "";

    const etiquetaContrato = (valor) =>
        OPCIONES_CONTRATO.find((o) => o.value === valor)?.label || "";

    /* Afinidad de cada vacante con el perfil (si hay perfil) */
    const matchesPorVacante = useMemo(() => {

        if (!profile) return {};

        const resultado = {};

        jobs.forEach((job) => {
            resultado[job.id] = computeMatches(
                profile,
                job,
                departmentName(job.department_id)
            );
        });

        return resultado;

    }, [jobs, profile, departments]);

    /* La plaza con mas posibilidades para este candidato */
    const mejorVacanteId = useMemo(() => {

        let mejor = null;
        let mejorScore = 0;

        Object.entries(matchesPorVacante).forEach(([id, match]) => {
            if (match.score > mejorScore && !match.salaryMismatch) {
                mejor = id;
                mejorScore = match.score;
            }
        });

        return mejor;

    }, [matchesPorVacante]);

    const filteredJobs = useMemo(() => {

        const term = search.trim().toLowerCase();
        const fechaCorte = diasDesdeFiltro(fechaFiltro);
        const salarioMin = salarioMinFiltro ? Number(salarioMinFiltro) : null;

        const resultado = jobs.filter((job) => {

            if (
                term &&
                !(job.title || "").toLowerCase().includes(term) &&
                !(job.company_profiles?.company_name || "")
                    .toLowerCase()
                    .includes(term)
            ) {
                return false;
            }

            if (departmentId && String(job.department_id) !== String(departmentId)) return false;
            if (categoryId && String(job.category_id) !== String(categoryId)) return false;
            if (workMode && job.work_mode !== workMode) return false;
            if (employmentTypeId && String(job.employment_type_id) !== String(employmentTypeId)) return false;
            if (experienceLevel && job.experience_level !== experienceLevel) return false;
            if (contractType && job.contract_type !== contractType) return false;
            if (soloUrgentes && !job.is_urgent) return false;

            if (fechaCorte && (!job.published_at || new Date(job.published_at) < fechaCorte)) {
                return false;
            }

            if (salarioMin) {
                const techoSalario = job.salary_max ?? job.salary_min ?? 0;
                if (techoSalario < salarioMin) return false;
            }

            return true;

        });

        const conRespuesta = (job) => respuestaPorEmpresa[job.company_id] || null;

        const ordenado = [...resultado];

        if (orden === "reciente") {

            ordenado.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

        } else if (orden === "salario") {

            ordenado.sort((a, b) =>
                (b.salary_max ?? b.salary_min ?? 0) - (a.salary_max ?? a.salary_min ?? 0)
            );

        } else if (orden === "respuesta") {

            ordenado.sort((a, b) => {

                const ra = conRespuesta(a);
                const rb = conRespuesta(b);

                const diasA = ra?.avg_response_days ?? Infinity;
                const diasB = rb?.avg_response_days ?? Infinity;

                // Empresas sin historial de respuesta, siempre al final.
                if (diasA === Infinity && diasB === Infinity) return 0;

                return diasA - diasB;

            });

        } else {

            // Relevancia: si hay perfil, primero las de mejor coincidencia;
            // si no hay perfil (visitante o empresa viendo), cae a mas
            // recientes, que es lo mas parecido a "relevante" sin datos.
            if (profile) {

                ordenado.sort((a, b) => {

                    const matchA = matchesPorVacante[a.id]?.score || 0;
                    const matchB = matchesPorVacante[b.id]?.score || 0;

                    return matchB - matchA;

                });

            } else {

                ordenado.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

            }

        }

        // Las urgentes se destacan arriba en Relevancia y Mas recientes
        // (en Mejor salario y Empresas que responden mas rapido se
        // respeta el orden elegido, sin mezclar).
        if (orden === "relevancia" || orden === "reciente") {
            ordenado.sort((a, b) => (b.is_urgent ? 1 : 0) - (a.is_urgent ? 1 : 0));
        }

        return ordenado;

    }, [
        jobs,
        search,
        departmentId,
        categoryId,
        workMode,
        employmentTypeId,
        experienceLevel,
        contractType,
        soloUrgentes,
        fechaFiltro,
        salarioMinFiltro,
        orden,
        respuestaPorEmpresa,
        matchesPorVacante,
        profile,
    ]);

    const selectedJob =
        filteredJobs.find((job) => job.id === selectedId) ||
        filteredJobs[0] ||
        null;

    /* Al cambiar de vacante seleccionada, revisar si ya se postulo */
    useEffect(() => {

        setApplication(null);
        setApplyError(null);

        if (!selectedJob || !user || role !== "candidato") return;

        let activo = true;

        getMyApplicationForJob(selectedJob.id).then(({ data }) => {
            if (activo) setApplication(data || null);
        });

        return () => {
            activo = false;
        };

    }, [selectedJob?.id, user]);

    function seleccionar(job) {

        setSelectedId(job.id);
        setMobileDetail(true);

    }

    async function handleApply() {

        if (!user) {
            navigate("/login");
            return;
        }

        setApplying(true);
        setApplyError(null);

        const { data, error } = await applyToJob(selectedJob.id);

        setApplying(false);

        if (error?.code === "NO_PROFILE") {
            navigate("/candidato/crear-cv");
            return;
        }

        if (error?.code === "DUPLICATE") {
            setApplyError("Ya te habías postulado a esta vacante.");
            return;
        }

        if (error) {
            setApplyError(error.message || "No se pudo enviar tu postulación.");
            return;
        }

        setApplication(data);

    }

    const hayFiltros =
        search || departmentId || categoryId || workMode || employmentTypeId ||
        experienceLevel || contractType || soloUrgentes || fechaFiltro || salarioMinFiltro;

    const contadorFiltrosActivos = [
        departmentId, categoryId, workMode, employmentTypeId,
        experienceLevel, contractType, fechaFiltro, salarioMinFiltro,
    ].filter(Boolean).length + (soloUrgentes ? 1 : 0);

    const selectedMatch = selectedJob
        ? matchesPorVacante[selectedJob.id]
        : null;

    return (

        <div className="jobs-wrap">

            {/* ===== Hero con buscador ===== */}
            <header className="jobs-hero">

                <div className="jobs-hero-inner">

                    <h1>Encuentra tu próxima chance</h1>

                    <p>
                        {loading
                            ? "Cargando vacantes…"
                            : `${filteredJobs.length} ${filteredJobs.length === 1 ? "vacante" : "vacantes"} en Guatemala, con empresas que responden`}
                    </p>

                    <div className="jobs-filters-card">

                    <div className="jobs-search-row">

                        <input
                            type="search"
                            placeholder="Puesto o empresa…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label="Buscar por puesto o empresa"
                            className="jobs-search-input"
                        />

                        <button
                            type="button"
                            className="jobs-filters-toggle"
                            onClick={() => setMostrarFiltros((v) => !v)}
                        >
                            {mostrarFiltros
                                ? "Ocultar filtros ▲"
                                : `Filtros${contadorFiltrosActivos > 0 ? ` (${contadorFiltrosActivos})` : ""} ▼`}
                        </button>

                    </div>

                    <div
                        className={
                            mostrarFiltros
                                ? "jobs-filters"
                                : "jobs-filters jobs-filters-collapsed"
                        }
                    >

                        <select
                            value={departmentId}
                            onChange={(e) => setDepartmentId(e.target.value)}
                            aria-label="Filtrar por departamento"
                        >
                            <option value="">Todo el país</option>
                            {departments.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>

                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            aria-label="Filtrar por área"
                        >
                            <option value="">Todas las áreas</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>

                        <select
                            value={workMode}
                            onChange={(e) => setWorkMode(e.target.value)}
                            aria-label="Filtrar por modalidad"
                        >
                            <option value="">Cualquier modalidad</option>
                            {WORK_MODES.map((mode) => (
                                <option key={mode} value={mode}>{mode}</option>
                            ))}
                        </select>

                        <select
                            value={employmentTypeId}
                            onChange={(e) => setEmploymentTypeId(e.target.value)}
                            aria-label="Filtrar por jornada"
                        >
                            <option value="">Cualquier jornada</option>
                            {employmentTypes.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>

                        <select
                            value={experienceLevel}
                            onChange={(e) => setExperienceLevel(e.target.value)}
                            aria-label="Filtrar por experiencia"
                        >
                            {OPCIONES_EXPERIENCIA.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>

                        <select
                            value={contractType}
                            onChange={(e) => setContractType(e.target.value)}
                            aria-label="Filtrar por tipo de contrato"
                        >
                            {OPCIONES_CONTRATO.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>

                        <select
                            value={fechaFiltro}
                            onChange={(e) => setFechaFiltro(e.target.value)}
                            aria-label="Filtrar por fecha de publicación"
                        >
                            {OPCIONES_FECHA.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>

                        <select
                            value={salarioMinFiltro}
                            onChange={(e) => setSalarioMinFiltro(e.target.value)}
                            aria-label="Filtrar por salario mínimo"
                        >
                            {OPCIONES_SALARIO.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>

                        <select
                            value={orden}
                            onChange={(e) => setOrden(e.target.value)}
                            aria-label="Ordenar vacantes"
                        >
                            {OPCIONES_ORDEN.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>

                        <label className="jobs-filter-checkbox">
                            <input
                                type="checkbox"
                                checked={soloUrgentes}
                                onChange={(e) => setSoloUrgentes(e.target.checked)}
                            />
                            Solo urgentes
                        </label>

                    </div>

                    </div>

                </div>

            </header>

            {/* ===== Vista dividida ===== */}
            <div className="jobs-split">

                {/* --- Lista --- */}
                <aside
                    className={
                        mobileDetail ? "jobs-list mobile-hidden" : "jobs-list"
                    }
                >

                    {!loading && filteredJobs.length === 0 && (
                        <div className="jobs-none">
                            <h3>
                                {hayFiltros
                                    ? "No hay vacantes con estos filtros"
                                    : "No hay vacantes publicadas todavía"}
                            </h3>
                            <p>
                                {hayFiltros
                                    ? "Prueba quitando algún filtro."
                                    : "Vuelve pronto: las empresas publican cada semana."}
                            </p>
                        </div>
                    )}

                    {!loading && filteredJobs.map((job) => {

                        const match = matchesPorVacante[job.id];

                        return (

                            <article
                                key={job.id}
                                className={
                                    selectedJob?.id === job.id
                                        ? "job-item selected"
                                        : "job-item"
                                }
                                onClick={() => seleccionar(job)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") seleccionar(job);
                                }}
                            >

                                {mejorVacanteId === job.id && (
                                    <span className="job-item-best">
                                        ⭐ Recomendada para ti
                                    </span>
                                )}

                                {job.is_urgent && (
                                    <span className="job-item-urgent">
                                        🔥 Urgente
                                    </span>
                                )}

                                <h2>{job.title}</h2>

                                <p className="job-item-company">
                                    {job.company_profiles?.logo && (
                                        <img
                                            src={job.company_profiles.logo}
                                            alt=""
                                            style={{
                                                width: 20,
                                                height: 20,
                                                objectFit: "contain",
                                                borderRadius: 4,
                                                marginRight: 6,
                                                verticalAlign: "middle",
                                            }}
                                        />
                                    )}
                                    {job.company_profiles?.company_name || "Empresa"}
                                </p>

                                <p className="job-item-meta">
                                    📍 {departmentName(job.department_id) || "Guatemala"}
                                    {" · "}
                                    {tiempoDesde(job.published_at)}
                                </p>

                                {respuestaPorEmpresa[job.company_id]?.avg_response_days != null && (
                                    <p className="job-item-meta" style={{ color: "#0E8F73" }}>
                                        ⚡ Responde en promedio en{" "}
                                        {respuestaPorEmpresa[job.company_id].avg_response_days === 1
                                            ? "1 día"
                                            : `${respuestaPorEmpresa[job.company_id].avg_response_days} días`}
                                    </p>
                                )}

                                {match && match.total > 0 && (
                                    <span
                                        className={
                                            match.salaryMismatch
                                                ? "job-item-match match-low"
                                                : match.score >= Math.ceil(match.total / 2)
                                                    ? "job-item-match match-high"
                                                    : "job-item-match"
                                        }
                                    >
                                        Coincidencia: {match.score}/{match.total}
                                    </span>
                                )}

                            </article>

                        );

                    })}

                </aside>

                {/* --- Detalle --- */}
                <section
                    className={
                        mobileDetail
                            ? "jobs-detail"
                            : "jobs-detail mobile-hidden"
                    }
                >

                    {selectedJob && (

                        <>

                            <button
                                className="detail-back"
                                onClick={() => setMobileDetail(false)}
                            >
                                ← Volver a la lista
                            </button>

                            <h2>
                                {selectedJob.title}
                                {selectedJob.is_urgent && (
                                    <span className="job-item-urgent" style={{ marginLeft: 10, verticalAlign: "middle" }}>
                                        🔥 Urgente
                                    </span>
                                )}
                            </h2>

                            <p className="detail-company">
                                {selectedJob.company_profiles?.logo && (
                                    <img
                                        src={selectedJob.company_profiles.logo}
                                        alt=""
                                        style={{
                                            width: 28,
                                            height: 28,
                                            objectFit: "contain",
                                            borderRadius: 6,
                                            marginRight: 8,
                                            verticalAlign: "middle",
                                        }}
                                    />
                                )}
                                {selectedJob.company_profiles?.company_name || "Empresa"}
                                {" · "}
                                {tiempoDesde(selectedJob.published_at)}
                            </p>

                            <CompanyResponseBadge
                                companyId={selectedJob.company_id}
                                companyName={selectedJob.company_profiles?.company_name}
                            />

                            <div className="detail-tags">

                                <span>📍 {departmentName(selectedJob.department_id) || "Guatemala"}</span>

                                {selectedJob.work_mode && (
                                    <span>{selectedJob.work_mode}</span>
                                )}

                                {employmentTypeName(selectedJob.employment_type_id) && (
                                    <span>{employmentTypeName(selectedJob.employment_type_id)}</span>
                                )}

                                {etiquetaExperiencia(selectedJob.experience_level) && (
                                    <span>{etiquetaExperiencia(selectedJob.experience_level)}</span>
                                )}

                                {etiquetaContrato(selectedJob.contract_type) && (
                                    <span>{etiquetaContrato(selectedJob.contract_type)}</span>
                                )}

                                <span className="detail-salary">
                                    {formatSalary(selectedJob.salary_min, selectedJob.salary_max)}
                                </span>

                            </div>

                            {/* Postularme */}
                            {(!user || role === "candidato") && (

                                <div className="detail-apply">

                                    {!application && (
                                        <button
                                            className="apply-btn"
                                            onClick={handleApply}
                                            disabled={applying}
                                        >
                                            {applying
                                                ? "Enviando…"
                                                : user
                                                    ? "Postularme"
                                                    : "Inicia sesión para postularte"}
                                        </button>
                                    )}

                                    {application && (
                                        <span className="applied-badge">
                                            ✓ Ya te postulaste
                                            {application.applied_at &&
                                                ` el ${new Date(application.applied_at).toLocaleDateString("es-GT")}`}
                                        </span>
                                    )}

                                    {applyError && (
                                        <p className="apply-error">{applyError}</p>
                                    )}

                                </div>

                            )}

                            {/* Coincidencias */}
                            {selectedMatch && selectedMatch.total > 0 && (

                                <div className="detail-match">

                                    <strong>
                                        Coincidencias con tu perfil:{" "}
                                        {selectedMatch.score} de {selectedMatch.total}
                                    </strong>

                                    <ul>
                                        {selectedMatch.checks.map((check, i) => (
                                            <li
                                                key={i}
                                                className={check.ok ? "ok" : "no"}
                                            >
                                                {check.ok ? "✓" : "•"} {check.text}
                                            </li>
                                        ))}
                                    </ul>

                                </div>

                            )}

                            <div className="detail-section">
                                <h3>Descripción</h3>
                                <p>{selectedJob.description}</p>
                            </div>

                            {selectedJob.requirements && (
                                <div className="detail-section">
                                    <h3>Requisitos</h3>
                                    <BloqueLineas texto={selectedJob.requirements} />
                                </div>
                            )}

                            {selectedJob.benefits && (
                                <div className="detail-section">
                                    <h3>Beneficios</h3>
                                    <BloqueLineas texto={selectedJob.benefits} />
                                </div>
                            )}

                            {/* Acerca de la empresa */}
                            {selectedJob.company_profiles?.description && (

                                <div className="detail-about">

                                    <h3>
                                        Acerca de{" "}
                                        {selectedJob.company_profiles.company_name}
                                    </h3>

                                    <p>{selectedJob.company_profiles.description}</p>

                                </div>

                            )}

                        </>

                    )}

                </section>

            </div>

        </div>

    );

}

export default Jobs;
