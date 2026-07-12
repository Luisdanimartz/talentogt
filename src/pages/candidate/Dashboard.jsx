import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import {
    getCurrentCandidateProfile,
    getMyApplications,
} from "../../services/candidateService";

import {
    APPLICATION_STATUSES,
    statusLabel,
} from "../../utils/applicationStatus";

const STATUS_COLORS = {
    applied: { bg: "#EEF1F5", color: "#64748B" },
    reviewing: { bg: "#FBF0DF", color: "#C98A2C" },
    interview: { bg: "#E8EDF6", color: "#0B1F3A" },
    hired: { bg: "#E4F5F0", color: "#0E8F73" },
    rejected: { bg: "#FBEAE9", color: "#B3261E" },
};

function CandidateDashboard() {

    const navigate = useNavigate();
    const { user } = useAuth();

    const [profile, setProfile] = useState(null);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        loadData();

    }, []);

    async function loadData() {

        const [profileRes, applicationsRes] = await Promise.all([
            getCurrentCandidateProfile(),
            getMyApplications(),
        ]);

        setProfile(profileRes.data);
        setApplications(applicationsRes.data || []);

        setLoading(false);

    }

    const nombre = profile?.first_name || user?.email;

    /*
      Estadísticas reales del candidato, contadas de sus
      propias postulaciones.
    */
    const stats = APPLICATION_STATUSES.map((status) => ({
        ...status,
        count: applications.filter(
            (app) =>
                (app.current_status || "applied") === status.value
        ).length,
    }));

    return (

        <div style={{ maxWidth: 760, margin: "0 auto", padding: "130px 20px 60px" }}>

            <h1 style={{ marginBottom: 4 }}>Bienvenido, {nombre}</h1>

            {loading && <p>Cargando...</p>}

            {!loading && !profile && (

                <div
                    style={{
                        background: "#FBF0DF",
                        borderRadius: 12,
                        padding: 20,
                        margin: "20px 0 24px",
                    }}
                >
                    <strong>Completa tu perfil</strong>
                    <p style={{ margin: "8px 0 14px" }}>
                        Necesitas un perfil para poder postularte a vacantes.
                        Toma menos de 5 minutos.
                    </p>
                    <button
                        style={botonEstilo("#C98A2C")}
                        onClick={() => navigate("/candidato/crear-cv")}
                    >
                        Crear mi perfil
                    </button>
                </div>

            )}

            {!loading && profile && (

                <p style={{ marginBottom: 24 }}>
                    <button
                        style={botonLink}
                        onClick={() => navigate("/candidato/crear-cv")}
                    >
                        Editar mi perfil
                    </button>
                    {"  ·  "}
                    <button
                        style={botonLink}
                        onClick={() => navigate("/candidato/mi-cv")}
                    >
                        📄 Descargar mi CV
                    </button>
                </p>

            )}

            {/* Resumen real de postulaciones por estado */}
            {!loading && applications.length > 0 && (

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(120px, 1fr))",
                        gap: 12,
                        marginBottom: 28,
                    }}
                >

                    {stats.map((stat) => {

                        const colors =
                            STATUS_COLORS[stat.value] ||
                            STATUS_COLORS.applied;

                        return (

                            <div
                                key={stat.value}
                                style={{
                                    background: colors.bg,
                                    borderRadius: 12,
                                    padding: "14px 16px",
                                }}
                            >

                                <div
                                    style={{
                                        fontSize: 26,
                                        fontWeight: 700,
                                        color: colors.color,
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    {stat.count}
                                </div>

                                <div
                                    style={{
                                        fontSize: 12.5,
                                        color: colors.color,
                                        fontWeight: 600,
                                    }}
                                >
                                    {stat.label}
                                </div>

                            </div>

                        );

                    })}

                </div>

            )}

            <h2 style={{ fontSize: 20 }}>Mis postulaciones</h2>

            {!loading && applications.length === 0 && (
                <p style={{ marginBottom: 24 }}>
                    Todavía no tienes postulaciones. Explora las vacantes
                    disponibles y aplica a la que más te interese.
                </p>
            )}

            {!loading && applications.map((app) => {

                const colors =
                    STATUS_COLORS[app.current_status || "applied"] ||
                    STATUS_COLORS.applied;

                return (

                    <div
                        key={app.id}
                        onClick={() =>
                            navigate(`/candidato/postulacion/${app.id}`)
                        }
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                navigate(`/candidato/postulacion/${app.id}`);
                            }
                        }}
                        style={{
                            border: "1px solid #E6E8EC",
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 12,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 12,
                            flexWrap: "wrap",
                            cursor: "pointer",
                            transition: "0.15s",
                        }}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.borderColor = "#0E8F73")
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.borderColor = "#E6E8EC")
                        }
                    >

                        <div>
                            <strong>{app.jobs?.title || "Vacante"}</strong>
                            <div style={{ color: "#64748B", fontSize: 14 }}>
                                {app.jobs?.company_profiles?.company_name || ""}
                                {app.applied_at &&
                                    ` · Postulado el ${new Date(app.applied_at).toLocaleDateString("es-GT")}`}
                            </div>
                            <div
                                style={{
                                    color: "#0E8F73",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    marginTop: 4,
                                }}
                            >
                                Ver mi proceso →
                            </div>
                        </div>

                        <span
                            style={{
                                textAlign: "right",
                            }}
                        >
                            <span
                                style={{
                                    background: colors.bg,
                                    color: colors.color,
                                    borderRadius: 999,
                                    padding: "6px 14px",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    display: "inline-block",
                                }}
                            >
                                {statusLabel(app.current_status)}
                            </span>

                            {app.current_status !== "applied" &&
                                app.updated_at && (
                                    <span
                                        style={{
                                            display: "block",
                                            color: "#94A0B1",
                                            fontSize: 12,
                                            marginTop: 4,
                                        }}
                                    >
                                        desde el{" "}
                                        {new Date(app.updated_at).toLocaleDateString("es-GT")}
                                    </span>
                                )}
                        </span>

                    </div>

                );

            })}

            <button
                style={{ ...botonEstilo("#0E8F73"), marginTop: 12 }}
                onClick={() => navigate("/vacantes")}
            >
                Ver vacantes disponibles
            </button>

        </div>

    );

}

function botonEstilo(color) {
    return {
        background: color,
        color: "white",
        border: "none",
        borderRadius: 8,
        padding: "12px 24px",
        cursor: "pointer",
        fontWeight: 600,
    };
}

const botonLink = {
    background: "none",
    border: "none",
    color: "#0E8F73",
    cursor: "pointer",
    fontWeight: 600,
    padding: 0,
    fontSize: 15,
    textDecoration: "underline",
};

export default CandidateDashboard;
