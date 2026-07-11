import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { getJobById } from "../services/jobService";
import { formatSalary } from "../utils/formatSalary";

import {
    applyToJob,
    getMyApplicationForJob,
    getCurrentCandidateProfile,
} from "../services/candidateService";

import { getDepartments } from "../services/locationService";

import { useAuth } from "../context/AuthContext";

function JobDetail() {

    const { id } = useParams();
    const navigate = useNavigate();

    const { user } = useAuth();
    const role = user?.user_metadata?.role;

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);

    const [application, setApplication] = useState(null);
    const [profile, setProfile] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [applying, setApplying] = useState(false);
    const [applyError, setApplyError] = useState(null);

    useEffect(() => {

        loadJob();

    }, [id, user]);

    async function loadJob() {

        setLoading(true);

        const { data, error } = await getJobById(id);

        if (!error) {
            setJob(data);
        }

        /* Si es candidato, revisamos si ya se postuló
           y traemos su perfil para las coincidencias */
        if (user && role === "candidato") {

            const [existingRes, profileRes, departmentsRes] =
                await Promise.all([
                    getMyApplicationForJob(id),
                    getCurrentCandidateProfile(),
                    getDepartments(),
                ]);

            setApplication(existingRes.data || null);
            setProfile(profileRes.data || null);
            setDepartments(departmentsRes.data || []);

        }

        setLoading(false);

    }

    async function handleApply() {

        /* Sin sesión: primero debe iniciar sesión */
        if (!user) {
            navigate("/login");
            return;
        }

        setApplying(true);
        setApplyError(null);

        const { data, error } = await applyToJob(id);

        setApplying(false);

        if (error?.code === "NO_PROFILE") {
            alert(
                "Antes de postularte necesitas completar tu perfil. " +
                "Te llevamos al formulario."
            );
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

    if (loading) {
        return <p style={{ textAlign: "center", marginTop: 40 }}>Cargando...</p>;
    }

    if (!job) {
        return <p style={{ textAlign: "center", marginTop: 40 }}>Vacante no encontrada.</p>;
    }

    /* La empresa no se postula a sus propias vacantes */
    const showApplyButton = !user || role === "candidato";

    return (

        <div style={{ maxWidth: 800, margin: "0 auto", padding: "130px 20px 60px" }}>

            <h1>{job.title}</h1>

            <p style={{ color: "#555", marginBottom: 20 }}>
                {job.company_profiles?.company_name || "Empresa"}
            </p>

            {showApplyButton && !application && (

                <button
                    onClick={handleApply}
                    disabled={applying}
                    style={{
                        background: "#0E8F73",
                        color: "white",
                        border: "none",
                        borderRadius: 8,
                        padding: "12px 28px",
                        marginBottom: 12,
                        cursor: applying ? "default" : "pointer",
                        fontWeight: 600,
                        fontSize: 15,
                        opacity: applying ? 0.7 : 1,
                    }}
                >
                    {applying
                        ? "Enviando postulación..."
                        : user
                            ? "Postularme"
                            : "Inicia sesión para postularte"}
                </button>

            )}

            {showApplyButton && application && (

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        flexWrap: "wrap",
                        marginBottom: 12,
                    }}
                >

                    <div
                        style={{
                            background: "#E4F5F0",
                            color: "#0E8F73",
                            borderRadius: 8,
                            padding: "12px 20px",
                            fontWeight: 600,
                        }}
                    >
                        ✓ Ya te postulaste a esta vacante
                        {application.applied_at &&
                            ` el ${new Date(application.applied_at).toLocaleDateString("es-GT")}`}
                    </div>

                    <button
                        onClick={() => navigate("/candidato/dashboard")}
                        style={{
                            background: "#0B1F3A",
                            color: "white",
                            border: "none",
                            borderRadius: 8,
                            padding: "12px 20px",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: 14,
                        }}
                    >
                        Ver mis postulaciones
                    </button>

                    <button
                        onClick={() => navigate("/vacantes")}
                        style={{
                            background: "transparent",
                            color: "#0E8F73",
                            border: "1px solid #0E8F73",
                            borderRadius: 8,
                            padding: "12px 20px",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: 14,
                        }}
                    >
                        Seguir viendo vacantes
                    </button>

                </div>

            )}

            {applyError && (
                <p style={{ color: "#B3261E", marginBottom: 12 }}>
                    {applyError}
                </p>
            )}

            {/* Coincidencias honestas: comparación básica del
                perfil real contra la vacante, sin porcentajes
                inventados */}
            {role === "candidato" && profile && (() => {

                const jobDept = departments.find(
                    (d) => d.id === job.department_id
                )?.name;

                const mismaUbicacion =
                    jobDept &&
                    profile.department &&
                    jobDept.toLowerCase() ===
                        profile.department.toLowerCase();

                const textoVacante = [
                    job.title,
                    job.description,
                    job.requirements,
                ]
                    .join(" ")
                    .toLowerCase();

                const palabrasProfesion = (profile.profession || "")
                    .toLowerCase()
                    .split(/\s+/)
                    .filter((palabra) => palabra.length > 3);

                const profesionCoincide =
                    palabrasProfesion.length > 0 &&
                    palabrasProfesion.some((palabra) =>
                        textoVacante.includes(palabra)
                    );

                const checks = [
                    jobDept && {
                        ok: mismaUbicacion,
                        text: mismaUbicacion
                            ? `La vacante está en tu departamento (${jobDept})`
                            : `La vacante está en ${jobDept}${profile.department ? ` y tu perfil dice ${profile.department}` : ""}`,
                    },
                    palabrasProfesion.length > 0 && {
                        ok: profesionCoincide,
                        text: profesionCoincide
                            ? "Tu profesión coincide con lo que buscan"
                            : "Tu profesión no aparece en la descripción (igual puedes aplicar)",
                    },
                ].filter(Boolean);

                if (checks.length === 0) return null;

                return (

                    <div
                        style={{
                            background: "#F6F7F9",
                            border: "1px solid #E6E8EC",
                            borderRadius: 12,
                            padding: "14px 18px",
                            margin: "16px 0",
                        }}
                    >

                        <strong style={{ fontSize: 14 }}>
                            Coincidencias con tu perfil
                        </strong>

                        <ul
                            style={{
                                margin: "8px 0 4px",
                                paddingLeft: 0,
                                listStyle: "none",
                            }}
                        >

                            {checks.map((check, i) => (
                                <li
                                    key={i}
                                    style={{
                                        fontSize: 14,
                                        marginBottom: 4,
                                        color: check.ok
                                            ? "#0E8F73"
                                            : "#64748B",
                                    }}
                                >
                                    {check.ok ? "✓" : "•"} {check.text}
                                </li>
                            ))}

                        </ul>

                        <small style={{ color: "#94A0B1", fontSize: 12 }}>
                            Comparación básica según tu perfil. Completa tu
                            perfil para mejores coincidencias.
                        </small>

                    </div>

                );

            })()}

            <div style={{ marginBottom: 16, marginTop: 16 }}>
                <strong>Modalidad:</strong> {job.work_mode || "No especificada"}
            </div>

            <div style={{ marginBottom: 16 }}>
                <strong>Salario:</strong>{" "}
                {formatSalary(job.salary_min, job.salary_max)}
            </div>

            <div style={{ marginBottom: 16 }}>
                <strong>Descripción</strong>
                <p>{job.description}</p>
            </div>

            <div style={{ marginBottom: 16 }}>
                <strong>Requisitos</strong>
                <p style={{ whiteSpace: "pre-line" }}>{job.requirements}</p>
            </div>

            <div style={{ marginBottom: 16 }}>
                <strong>Beneficios</strong>
                <p style={{ whiteSpace: "pre-line" }}>{job.benefits}</p>
            </div>

        </div>

    );

}

export default JobDetail;
