import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import "../styles/theme.css";
import "../styles/Jobs.css";

import { getPublishedJobs, getJobCategories } from "../services/jobService";
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
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    /* Filtros */
    const [searchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get("q") || "");
    const [departmentId, setDepartmentId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [workMode, setWorkMode] = useState("");

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
        ];

        if (user && role === "candidato") {
            peticiones.push(getCurrentCandidateProfile());
        }

        const [jobsRes, departmentsRes, categoriesRes, profileRes] =
            await Promise.all(peticiones);

        setJobs(jobsRes.data || []);
        setDepartments(departmentsRes.data || []);
        setCategories(categoriesRes.data || []);
        setProfile(profileRes?.data || null);

        setLoading(false);

    }

    const departmentName = (id) =>
        departments.find((d) => d.id === id)?.name || "";

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

        return jobs.filter((job) => {

            if (
                term &&
                !(job.title || "").toLowerCase().includes(term) &&
                !(job.company_profiles?.company_name || "")
                    .toLowerCase()
                    .includes(term)
            ) {
                return false;
            }

            if (departmentId && job.department_id !== departmentId) return false;
            if (categoryId && job.category_id !== categoryId) return false;
            if (workMode && job.work_mode !== workMode) return false;

            return true;

        });

    }, [jobs, search, departmentId, categoryId, workMode]);

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

    const hayFiltros = search || departmentId || categoryId || workMode;

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

                    <div className="jobs-filters">

                        <input
                            type="search"
                            placeholder="Puesto o empresa…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label="Buscar por puesto o empresa"
                        />

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

                            <h2>{selectedJob.title}</h2>

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
