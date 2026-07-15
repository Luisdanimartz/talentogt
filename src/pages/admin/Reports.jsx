import { useEffect, useState } from "react";

import "./../../styles/theme.css";
import "./../../styles/recruiter/layout/RecruiterDashboard.css";

import {
    Alert,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";

import AdminSidebar from "../../components/admin/AdminSidebar";

import {
    getAdminHiringFunnel,
    getAdminTopCompanies,
    getAdminCandidatesByDepartment,
    getAdminPendingResponses,
} from "../../services/adminService";

/*
  Reportes de toda la plataforma. Mismo criterio honesto que el
  reporte por empresa (011/012_reportes.sql): el embudo cuenta
  cuantas postulaciones LLEGARON a cada etapa alguna vez, no solo
  el estado actual.
*/

const ETAPAS = [
    { key: "total_postulaciones", label: "Postulados", color: "#94A3B8" },
    { key: "en_revision", label: "En revisión", color: "#D9A441" },
    { key: "en_entrevista", label: "Entrevista", color: "#1A4B9B" },
    { key: "contratados", label: "Contratados", color: "#0E8F73" },
];

function porcentaje(parte, total) {
    if (!total) return 0;
    return Math.round((parte / total) * 100);
}

function Reports() {

    const [funnel, setFunnel] = useState(null);
    const [topEmpresas, setTopEmpresas] = useState([]);
    const [porDepartamento, setPorDepartamento] = useState([]);
    const [pendientes, setPendientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {

        Promise.all([
            getAdminHiringFunnel(),
            getAdminTopCompanies(10),
            getAdminCandidatesByDepartment(),
            getAdminPendingResponses(),
        ]).then(([funnelRes, topRes, deptoRes, pendientesRes]) => {

            const primerError =
                funnelRes.error || topRes.error || deptoRes.error || pendientesRes.error;

            if (primerError) {
                setError(primerError.message);
            }

            setFunnel(funnelRes.data || null);
            setTopEmpresas(topRes.data || []);
            setPorDepartamento(deptoRes.data || []);
            setPendientes(pendientesRes.data || []);

            setLoading(false);

        });

    }, []);

    const total = Number(funnel?.total_postulaciones || 0);
    const maxDepto = Math.max(1, ...porDepartamento.map((d) => Number(d.total)));

    return (

        <div className="dashboard">

            <AdminSidebar />

            <main className="dashboard-content">

                <Box sx={{ maxWidth: 1100, py: 4, px: { xs: 2, md: 0 } }}>

                    <Typography variant="h4" fontWeight="bold" color="#0B1F3A">
                        Reportes
                    </Typography>

                    <Typography color="text.secondary" mb={4}>
                        Números reales de toda la plataforma.
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {loading && <Typography>Cargando…</Typography>}

                    {!loading && (

                        <>

                            {/* Embudo general */}

                            <Paper
                                elevation={0}
                                sx={{ p: 3, mb: 4, borderRadius: 3, border: "1px solid #E6E8EC" }}
                            >

                                <Typography variant="h6" fontWeight="bold" color="#0B1F3A" mb={2}>
                                    Embudo de contratación (toda la plataforma)
                                </Typography>

                                {total === 0 ? (
                                    <Typography color="text.secondary" fontSize={14}>
                                        Todavía no hay postulaciones registradas.
                                    </Typography>
                                ) : (
                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

                                        {ETAPAS.map((etapa) => {

                                            const valor = Number(funnel?.[etapa.key] || 0);
                                            const pct = porcentaje(valor, total);

                                            return (

                                                <Box key={etapa.key}>

                                                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                                                        <Typography fontSize={14} fontWeight={600} color="#0B1F3A">
                                                            {etapa.label}
                                                        </Typography>
                                                        <Typography fontSize={14} color="text.secondary">
                                                            {valor} · {pct}%
                                                        </Typography>
                                                    </Box>

                                                    <Box sx={{ height: 12, borderRadius: 6, background: "#F0F2F6", overflow: "hidden" }}>
                                                        <Box
                                                            sx={{
                                                                height: "100%",
                                                                width: `${pct}%`,
                                                                background: etapa.color,
                                                                borderRadius: 6,
                                                            }}
                                                        />
                                                    </Box>

                                                </Box>

                                            );

                                        })}

                                    </Box>
                                )}

                            </Paper>

                            {/* Candidatos sin respuesta - por empresa y vacante */}

                            <Paper
                                elevation={0}
                                sx={{ p: 3, mb: 4, borderRadius: 3, border: "1px solid #E6E8EC" }}
                            >

                                <Typography variant="h6" fontWeight="bold" color="#0B1F3A" mb={0.5}>
                                    Candidatos sin respuesta, por empresa y vacante
                                </Typography>

                                <Typography color="text.secondary" fontSize={13.5} mb={2}>
                                    Ordenado de peor a mejor: arriba las vacantes con más
                                    candidatos pendientes de respuesta.
                                </Typography>

                                {pendientes.length === 0 ? (
                                    <Typography color="text.secondary" fontSize={14}>
                                        Todavía no hay vacantes con postulaciones registradas.
                                    </Typography>
                                ) : (
                                    <Box sx={{ overflowX: "auto" }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell><strong>Empresa</strong></TableCell>
                                                    <TableCell><strong>Vacante</strong></TableCell>
                                                    <TableCell align="right"><strong>Postulados</strong></TableCell>
                                                    <TableCell align="right"><strong>Sin responder</strong></TableCell>
                                                    <TableCell align="right"><strong>% Respuesta</strong></TableCell>
                                                    <TableCell align="right"><strong>Días (más antigua)</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {pendientes.map((p) => {

                                                    const critico = p.pendientes > 0 && p.dias_pendiente_mas_antiguo >= 5;

                                                    return (
                                                        <TableRow key={p.job_id}>
                                                            <TableCell>{p.company_name}</TableCell>
                                                            <TableCell>{p.job_title}</TableCell>
                                                            <TableCell align="right">{p.total_postulaciones}</TableCell>
                                                            <TableCell
                                                                align="right"
                                                                sx={{ fontWeight: 600, color: critico ? "#C0392B" : "inherit" }}
                                                            >
                                                                {p.pendientes}
                                                            </TableCell>
                                                            <TableCell align="right">{p.pct_respuesta}%</TableCell>
                                                            <TableCell
                                                                align="right"
                                                                sx={{ color: critico ? "#C0392B" : "inherit" }}
                                                            >
                                                                {p.pendientes > 0 ? p.dias_pendiente_mas_antiguo : "—"}
                                                            </TableCell>
                                                        </TableRow>
                                                    );

                                                })}
                                            </TableBody>
                                        </Table>
                                    </Box>
                                )}

                            </Paper>

                            {/* Top empresas */}

                            <Paper
                                elevation={0}
                                sx={{ p: 3, mb: 4, borderRadius: 3, border: "1px solid #E6E8EC" }}
                            >

                                <Typography variant="h6" fontWeight="bold" color="#0B1F3A" mb={2}>
                                    Empresas con más postulaciones recibidas
                                </Typography>

                                {topEmpresas.length === 0 ? (
                                    <Typography color="text.secondary" fontSize={14}>
                                        Todavía no hay datos suficientes.
                                    </Typography>
                                ) : (
                                    <Box sx={{ overflowX: "auto" }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell><strong>Empresa</strong></TableCell>
                                                    <TableCell><strong>Vacantes</strong></TableCell>
                                                    <TableCell><strong>Postulaciones</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {topEmpresas.map((e) => (
                                                    <TableRow key={e.company_name}>
                                                        <TableCell>{e.company_name}</TableCell>
                                                        <TableCell>{e.total_vacantes}</TableCell>
                                                        <TableCell>{e.total_postulaciones}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </Box>
                                )}

                            </Paper>

                            {/* Candidatos por departamento */}

                            <Paper
                                elevation={0}
                                sx={{ p: 3, borderRadius: 3, border: "1px solid #E6E8EC" }}
                            >

                                <Typography variant="h6" fontWeight="bold" color="#0B1F3A" mb={2}>
                                    Candidatos por departamento
                                </Typography>

                                {porDepartamento.length === 0 ? (
                                    <Typography color="text.secondary" fontSize={14}>
                                        Todavía no hay candidatos registrados.
                                    </Typography>
                                ) : (
                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>

                                        {porDepartamento.map((d) => (

                                            <Box key={d.department}>

                                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.4 }}>
                                                    <Typography fontSize={13.5}>{d.department}</Typography>
                                                    <Typography fontSize={13.5} color="text.secondary">
                                                        {d.total}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ height: 8, borderRadius: 4, background: "#F0F2F6", overflow: "hidden" }}>
                                                    <Box
                                                        sx={{
                                                            height: "100%",
                                                            width: `${porcentaje(Number(d.total), maxDepto)}%`,
                                                            background: "#1A4B9B",
                                                            borderRadius: 4,
                                                        }}
                                                    />
                                                </Box>

                                            </Box>

                                        ))}

                                    </Box>
                                )}

                            </Paper>

                        </>

                    )}

                </Box>

            </main>

        </div>

    );

}

export default Reports;
