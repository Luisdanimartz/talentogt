import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./../../styles/theme.css";
import "./../../styles/recruiter/layout/RecruiterDashboard.css";

import { Box, Paper, Typography, Chip } from "@mui/material";

import AdminSidebar from "../../components/admin/AdminSidebar";

import {
    getAdminExperienciaCandidato,
    getAdminVacantesSinPostulaciones,
    getAdminRankingRespuesta,
    getAdminDeadlinesProximos,
} from "../../services/adminService";

import { tituloConFecha } from "../../utils/resolution";

const tarjeta = {
    p: 3,
    borderRadius: 3,
    border: "1px solid #E6E8EC",
};

function Kpi({ titulo, valor, nota, acento = "#0B1F3A" }) {

    return (

        <Paper elevation={0} sx={{ ...tarjeta, p: 2.5, textAlign: "center" }}>

            <Typography fontSize={12.5} color="text.secondary">
                {titulo}
            </Typography>

            <Typography
                fontSize={30}
                fontWeight={700}
                sx={{ color: acento, lineHeight: 1.2, my: 0.4 }}
            >
                {valor}
            </Typography>

            {nota && (
                <Typography fontSize={11.5} color="text.secondary">
                    {nota}
                </Typography>
            )}

        </Paper>

    );

}

function CandidateHealth() {

    const navigate = useNavigate();

    const [kpis, setKpis] = useState(null);
    const [sinCandidatos, setSinCandidatos] = useState([]);
    const [ranking, setRanking] = useState([]);
    const [deadlines, setDeadlines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {

        cargar();

    }, []);

    async function cargar() {

        setLoading(true);
        setError(null);

        const [kpiRes, sinRes, rankRes, deadRes] = await Promise.all([
            getAdminExperienciaCandidato(),
            getAdminVacantesSinPostulaciones(3),
            getAdminRankingRespuesta(15),
            getAdminDeadlinesProximos(5),
        ]);

        const fallo =
            kpiRes.error || sinRes.error || rankRes.error || deadRes.error;

        if (fallo) {
            setError(fallo.message || "No se pudo cargar el panel.");
        }

        setKpis(kpiRes.data?.[0] || null);
        setSinCandidatos(sinRes.data || []);
        setRanking(rankRes.data || []);
        setDeadlines(deadRes.data || []);

        setLoading(false);

    }

    const pct = Number(kpis?.pct_respuesta || 0);

    const colorPct = pct >= 80 ? "#0E8F73" : pct >= 50 ? "#B8860B" : "#C0392B";

    const autoResueltas = Number(kpis?.resueltas_por_sistema || 0);

    return (

        <div className="dashboard">

            <AdminSidebar />

            <main className="dashboard-content">

                <Typography
                    variant="h4"
                    fontWeight="bold"
                    color="#0B1F3A"
                    sx={{ letterSpacing: "-0.02em" }}
                >
                    Salud del candidato
                </Typography>

                <Typography color="text.secondary" sx={{ mt: 0.7, mb: 3 }}>
                    Quién está cumpliendo con los candidatos, quién no, y
                    qué vacantes no están recibiendo gente.
                </Typography>

                {error && (
                    <Paper
                        elevation={0}
                        sx={{ ...tarjeta, mb: 3, borderColor: "#F09595" }}
                    >
                        <Typography color="#A32D2D">{error}</Typography>
                    </Paper>
                )}

                {loading ? (

                    <Typography color="text.secondary">
                        Cargando…
                    </Typography>

                ) : (

                    <>

                        {/* ===== KPIs ===== */}

                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                    xs: "1fr 1fr",
                                    md: "repeat(5, 1fr)",
                                },
                                gap: 2,
                                mb: 3,
                            }}
                        >

                            <Kpi
                                titulo="Postulaciones respondidas"
                                valor={`${pct}%`}
                                nota={`${kpis?.respondidas || 0} de ${kpis?.total_postulaciones || 0}`}
                                acento={colorPct}
                            />

                            <Kpi
                                titulo="Sin responder"
                                valor={kpis?.sin_responder || 0}
                                nota="Siguen esperando"
                                acento={
                                    Number(kpis?.sin_responder) > 0
                                        ? "#C0392B"
                                        : "#0E8F73"
                                }
                            />

                            <Kpi
                                titulo="Resueltas por el sistema"
                                valor={autoResueltas}
                                nota="La empresa no respondió"
                                acento={autoResueltas > 0 ? "#B8860B" : "#0E8F73"}
                            />

                            <Kpi
                                titulo="Primera respuesta"
                                valor={
                                    kpis?.horas_primera_respuesta
                                        ? `${Math.round(Number(kpis.horas_primera_respuesta) / 24)} d`
                                        : "—"
                                }
                                nota="Promedio de la plataforma"
                            />

                            <Kpi
                                titulo="Vacantes sin candidatos"
                                valor={kpis?.vacantes_sin_candidatos || 0}
                                nota={`De ${kpis?.vacantes_publicadas || 0} publicadas`}
                                acento={
                                    Number(kpis?.vacantes_sin_candidatos) > 0
                                        ? "#B8860B"
                                        : "#0E8F73"
                                }
                            />

                        </Box>

                        {autoResueltas > 0 && (

                            <Paper
                                elevation={0}
                                sx={{
                                    ...tarjeta,
                                    mb: 3,
                                    background: "#FBF0DF",
                                    borderColor: "#F0D5A0",
                                }}
                            >
                                <Typography fontSize={13.5} color="#7A5405">
                                    <strong>
                                        ChanceGT resolvió {autoResueltas} postulación(es)
                                        que la empresa dejó vencer.
                                    </strong>{" "}
                                    La promesa se está cumpliendo, pero con el
                                    sistema tapando el hueco. Si este número
                                    sube mes a mes, las empresas no están
                                    cambiando de conducta — hay que llamarlas.
                                </Typography>
                            </Paper>

                        )}

                        {/* ===== Plazos por vencer ===== */}

                        <Paper elevation={0} sx={{ ...tarjeta, mb: 3 }}>

                            <Typography variant="h6" fontWeight="bold" color="#0B1F3A">
                                A quién llamar esta semana
                            </Typography>

                            <Typography fontSize={13} color="text.secondary" mb={2}>
                                Vacantes cuyo plazo vence en 5 días o menos y
                                todavía tienen candidatos sin resolver.
                            </Typography>

                            {deadlines.length === 0 ? (

                                <Typography fontSize={14} color="text.secondary">
                                    Nadie está por vencerse. Todo al día.
                                </Typography>

                            ) : (

                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>

                                    {deadlines.map((d) => (

                                        <Box
                                            key={d.job_id}
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                gap: 2,
                                                flexWrap: "wrap",
                                                borderBottom: "1px solid #F0F2F5",
                                                pb: 1.2,
                                            }}
                                        >

                                            <Box>
                                                <Typography fontSize={14} fontWeight={600}>
                                                    {d.company_name}
                                                </Typography>
                                                <Typography fontSize={12.5} color="text.secondary">
                                                    {d.job_title} · {d.pendientes} sin resolver
                                                    {Number(d.ampliaciones) > 0 &&
                                                        ` · ya amplió ${d.ampliaciones} vez(ces)`}
                                                </Typography>
                                            </Box>

                                            <Chip
                                                size="small"
                                                label={
                                                    Number(d.dias_restantes) < 0
                                                        ? "Vencido"
                                                        : Number(d.dias_restantes) === 0
                                                            ? "Vence hoy"
                                                            : `${d.dias_restantes} día(s)`
                                                }
                                                sx={{
                                                    fontWeight: 700,
                                                    background:
                                                        Number(d.dias_restantes) <= 0
                                                            ? "#FCEBEB"
                                                            : "#FBF0DF",
                                                    color:
                                                        Number(d.dias_restantes) <= 0
                                                            ? "#8C2727"
                                                            : "#7A5405",
                                                }}
                                            />

                                        </Box>

                                    ))}

                                </Box>

                            )}

                        </Paper>

                        {/* ===== Vacantes sin candidatos ===== */}

                        <Paper elevation={0} sx={{ ...tarjeta, mb: 3 }}>

                            <Typography variant="h6" fontWeight="bold" color="#0B1F3A">
                                Vacantes que no reciben candidatos
                            </Typography>

                            <Typography fontSize={13} color="text.secondary" mb={2}>
                                Publicadas hace 3 días o más y todavía en cero.
                                Compara las vistas: si nadie la ve, es
                                problema de tráfico; si la ven y no aplican,
                                es problema de la publicación.
                            </Typography>

                            {sinCandidatos.length === 0 ? (

                                <Typography fontSize={14} color="text.secondary">
                                    Todas las vacantes publicadas han recibido
                                    al menos un candidato.
                                </Typography>

                            ) : (

                                <Box sx={{ overflowX: "auto" }}>

                                    <Box
                                        component="table"
                                        sx={{
                                            width: "100%",
                                            borderCollapse: "collapse",
                                            fontSize: 13.5,
                                            "& th": {
                                                textAlign: "left",
                                                color: "#5C6B7A",
                                                fontWeight: 600,
                                                fontSize: 12,
                                                py: 1,
                                                borderBottom: "1px solid #E6E8EC",
                                            },
                                            "& td": {
                                                py: 1.2,
                                                borderBottom: "1px solid #F0F2F5",
                                            },
                                        }}
                                    >

                                        <thead>
                                            <tr>
                                                <th>Vacante</th>
                                                <th>Empresa</th>
                                                <th>Días</th>
                                                <th>Vistas</th>
                                                <th>Salario</th>
                                                <th>Diagnóstico</th>
                                            </tr>
                                        </thead>

                                        <tbody>

                                            {sinCandidatos.map((v) => {

                                                const vistas = Number(v.vistas) || 0;

                                                const diagnostico =
                                                    vistas === 0
                                                        ? "Nadie la ve"
                                                        : vistas < 10
                                                            ? "Poco tráfico"
                                                            : "La ven y no aplican";

                                                return (

                                                    <tr key={v.job_id}>

                                                        <td style={{ fontWeight: 600 }}>
                                                            {tituloConFecha(
                                                                v.job_title,
                                                                v.published_at
                                                            )}
                                                        </td>

                                                        <td>{v.company_name}</td>

                                                        <td>{v.dias_abierta}</td>

                                                        <td>{vistas}</td>

                                                        <td>
                                                            {v.salario
                                                                ? `Q${Number(v.salario).toLocaleString("en-US")}`
                                                                : "—"}
                                                        </td>

                                                        <td>
                                                            <Chip
                                                                size="small"
                                                                label={diagnostico}
                                                                sx={{
                                                                    fontSize: 11.5,
                                                                    background:
                                                                        vistas >= 10
                                                                            ? "#FCEBEB"
                                                                            : "#EEF1F5",
                                                                    color:
                                                                        vistas >= 10
                                                                            ? "#8C2727"
                                                                            : "#5C6B7A",
                                                                }}
                                                            />
                                                        </td>

                                                    </tr>

                                                );

                                            })}

                                        </tbody>

                                    </Box>

                                </Box>

                            )}

                        </Paper>

                        {/* ===== Ranking de respuesta ===== */}

                        <Paper elevation={0} sx={tarjeta}>

                            <Typography variant="h6" fontWeight="bold" color="#0B1F3A">
                                Empresas por porcentaje de respuesta
                            </Typography>

                            <Typography fontSize={13} color="text.secondary" mb={2}>
                                De peor a mejor. Las de arriba son las que
                                están gastando la reputación de la plataforma.
                            </Typography>

                            {ranking.length === 0 ? (

                                <Typography fontSize={14} color="text.secondary">
                                    Todavía no hay empresas con postulaciones.
                                </Typography>

                            ) : (

                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.4 }}>

                                    {ranking.map((e) => {

                                        const p = Number(e.pct_respuesta) || 0;

                                        const color =
                                            p >= 80
                                                ? "#0E8F73"
                                                : p >= 50
                                                    ? "#B8860B"
                                                    : "#C0392B";

                                        return (

                                            <Box
                                                key={e.company_id}
                                                onClick={() =>
                                                    navigate(`/admin/empresas/${e.company_id}`)
                                                }
                                                sx={{
                                                    cursor: "pointer",
                                                    "&:hover": { opacity: 0.75 },
                                                }}
                                            >

                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "baseline",
                                                        gap: 1,
                                                        mb: 0.5,
                                                    }}
                                                >

                                                    <Typography fontSize={13.5} fontWeight={600}>
                                                        {e.company_name}
                                                    </Typography>

                                                    <Typography
                                                        fontSize={13}
                                                        fontWeight={700}
                                                        sx={{ color, whiteSpace: "nowrap" }}
                                                    >
                                                        {p}%
                                                        <span
                                                            style={{
                                                                color: "#5C6B7A",
                                                                fontWeight: 500,
                                                            }}
                                                        >
                                                            {" "}· {e.respondidas}/{e.total}
                                                            {Number(e.auto_resueltas) > 0 &&
                                                                ` · ${e.auto_resueltas} por el sistema`}
                                                        </span>
                                                    </Typography>

                                                </Box>

                                                <Box
                                                    sx={{
                                                        height: 8,
                                                        borderRadius: 999,
                                                        background: "#EEF1F5",
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: `${Math.max(p, 2)}%`,
                                                            height: "100%",
                                                            background: color,
                                                        }}
                                                    />
                                                </Box>

                                            </Box>

                                        );

                                    })}

                                </Box>

                            )}

                        </Paper>

                    </>

                )}

            </main>

        </div>

    );

}

export default CandidateHealth;
