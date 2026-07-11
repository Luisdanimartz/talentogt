import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/theme.css";
import "../styles/Jobs.css";

import { getPublishedJobs, getJobCategories } from "../services/jobService";
import { getDepartments } from "../services/locationService";
import { formatSalary } from "../utils/formatSalary";

const WORK_MODES = ["Presencial", "Remoto", "Híbrido"];

function Jobs() {

    const navigate = useNavigate();

    const [jobs, setJobs] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    /* Filtros estilo bolsa de empleo */
    const [search, setSearch] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [workMode, setWorkMode] = useState("");

    useEffect(() => {

        loadData();

    }, []);

    async function loadData() {

        setLoading(true);

        const [jobsRes, departmentsRes, categoriesRes] =
            await Promise.all([
                getPublishedJobs(),
                getDepartments(),
                getJobCategories(),
            ]);

        setJobs(jobsRes.data || []);
        setDepartments(departmentsRes.data || []);
        setCategories(categoriesRes.data || []);

        setLoading(false);

    }

    const departmentName = (id) =>
        departments.find((d) => d.id === id)?.name || "";

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

            if (departmentId && job.department_id !== departmentId) {
                return false;
            }

            if (categoryId && job.category_id !== categoryId) {
                return false;
            }

            if (workMode && job.work_mode !== workMode) {
                return false;
            }

            return true;

        });

    }, [jobs, search, departmentId, categoryId, workMode]);

    const hayFiltros =
        search || departmentId || categoryId || workMode;

    function limpiarFiltros() {
        setSearch("");
        setDepartmentId("");
        setCategoryId("");
        setWorkMode("");
    }

    return (

        <div className="jobs-page">

            <h1>Vacantes disponibles</h1>

            <p className="jobs-subtitle">
                {loading
                    ? "Cargando vacantes…"
                    : `${filteredJobs.length} ${filteredJobs.length === 1 ? "vacante" : "vacantes"} ${hayFiltros ? "con estos filtros" : "publicadas"}`}
            </p>

            {/* Barra de búsqueda y filtros */}
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
                        <option key={d.id} value={d.id}>
                            {d.name}
                        </option>
                    ))}
                </select>

                <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    aria-label="Filtrar por categoría"
                >
                    <option value="">Todas las áreas</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>

                <select
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value)}
                    aria-label="Filtrar por modalidad"
                >
                    <option value="">Cualquier modalidad</option>
                    {WORK_MODES.map((mode) => (
                        <option key={mode} value={mode}>
                            {mode}
                        </option>
                    ))}
                </select>

                {hayFiltros && (
                    <button
                        className="jobs-clear"
                        onClick={limpiarFiltros}
                    >
                        Limpiar filtros
                    </button>
                )}

            </div>

            {!loading && filteredJobs.length === 0 && (

                <div className="jobs-none">

                    <h3>
                        {hayFiltros
                            ? "No hay vacantes con estos filtros"
                            : "No hay vacantes publicadas todavía"}
                    </h3>

                    <p>
                        {hayFiltros
                            ? "Prueba quitando algún filtro o buscando otra palabra."
                            : "Vuelve pronto, las empresas publican nuevas plazas cada semana."}
                    </p>

                </div>

            )}

            {!loading && filteredJobs.map((job) => (

                <article
                    key={job.id}
                    className="job-card"
                >

                    <div className="job-card-info">

                        <h2>{job.title}</h2>

                        <p className="job-card-company">
                            {job.company_profiles?.company_name || "Empresa"}
                        </p>

                        <div className="job-card-tags">

                            {departmentName(job.department_id) && (
                                <span>📍 {departmentName(job.department_id)}</span>
                            )}

                            {job.work_mode && (
                                <span>{job.work_mode}</span>
                            )}

                            <span className="job-card-salary">
                                {formatSalary(job.salary_min, job.salary_max)}
                            </span>

                        </div>

                    </div>

                    <button
                        className="job-card-btn"
                        onClick={() => navigate(`/vacantes/${job.id}`)}
                    >
                        Ver detalle
                    </button>

                </article>

            ))}

        </div>

    );

}

export default Jobs;
