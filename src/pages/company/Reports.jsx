import { useEffect, useMemo, useState } from "react";

import "./../../styles/theme.css";
import "./../../styles/recruiter/layout/RecruiterDashboard.css";
import "./../../styles/company/Reports.css";

import {
    Alert,
    Box,
    Button,
    MenuItem,
    Paper,
    Select,
    Typography,
} from "@mui/material";
import { Download as DownloadIcon } from "@mui/icons-material";

import RecruiterSidebar from "../../components/recruiter/layout/RecruiterSidebar";

import { getMyCompanyContext } from "../../services/teamService";
import { getHiringFunnel, getJobsReport } from "../../services/reportService";

/*
  Reportes de la empresa: embudo de contratacion, tiempos de
  respuesta y de cierre, desglosados por vacante.

  Filosofia del producto: cero numeros inventados. Cada dato de
  esta pantalla sale de postulaciones y cambios de estado reales
  que la propia empresa registro en su panel de Candidatos.
*/

const ETAPAS = [
    { key: "total_postulaciones", label: "Postulados", color: "#94A3B8" },
    { key: "en_revision", label: "En revisión", color: "#D9A441" },
    { key: "en_entrevista", label: "Entrevista", color: "#1A4B9B" },
    { key: "contratados", label: "Contratados", color: "#0E8F73" },
];

const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = [ANIO_ACTUAL, ANIO_ACTUAL - 1, ANIO_ACTUAL - 2];

/* "todos" + mes 0-11 + año -> { desde, hasta, etiqueta } */
function calcularRango(mes, anio) {

    if (mes === "todos") {
        return { desde: null, hasta: null, etiqueta: "Todo el tiempo" };
    }

    const desde = new Date(anio, mes, 1, 0, 0, 0);
    const hasta = new Date(anio, mes + 1, 1, 0, 0, 0);

    return {
        desde,
        hasta,
        etiqueta: `${MESES[mes]} ${anio}`,
    };

}

function diasBonito(numero) {

    if (numero === null || numero === undefined) return "—";

    const dias = Math.round(numero * 10) / 10;

    if (dias < 1) return "menos de 1 día";

    return `${dias} ${dias === 1 ? "día" : "días"}`;

}

function horasBonito(numero) {

    if (numero === null || numero === undefined) return "—";

    if (numero < 24) {
        const horas = Math.round(numero);
        return `${horas} ${horas === 1 ? "hora" : "horas"}`;
    }

    return diasBonito(numero / 24);

}

function porcentaje(parte, total) {

    if (!total) return 0;

    return Math.round((parte / total) * 100);

}

function KpiCard({ titulo, valor, nota }) {

    return (

        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                borderRadius: 3,
                border: "1px solid #E6E8EC",
                flex: "1 1 220px",
                minWidth: 220,
            }}
        >

            <Typography fontSize={13} color="text.secondary" fontWeight={600}>
                {titulo}
            </Typography>

            <Typography
                fontSize={28}
                fontWeight={800}
                color="#0B1F3A"
                sx={{ mt: 0.5 }}
            >
                {valor}
            </Typography>

            {nota && (
                <Typography fontSize={12.5} color="text.secondary" sx={{ mt: 0.5 }}>
                    {nota}
                </Typography>
            )}

        </Paper>

    );

}

function Embudo({ datos }) {

    const total = datos?.total_postulaciones || 0;

    if (!total) {
        return (
            <Typography color="text.secondary" fontSize={14}>
                Todavía no tienes postulaciones para armar el embudo.
                En cuanto lleguen las primeras, aparecen aquí.
            </Typography>
        );
    }

    return (

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

            {ETAPAS.map((etapa) => {

                const valor = Number(datos?.[etapa.key] || 0);
                const pct = porcentaje(valor, total);

                return (

                    <Box key={etapa.key}>

                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 0.5,
                            }}
                        >

                            <Typography fontSize={14} fontWeight={600} color="#0B1F3A">
                                {etapa.label}
                            </Typography>

                            <Typography fontSize={14} color="text.secondary">
                                {valor} · {pct}%
                            </Typography>

                        </Box>

                        <Box
                            sx={{
                                height: 12,
                                borderRadius: 6,
                                background: "#F0F2F6",
                                overflow: "hidden",
                            }}
                        >

                            <Box
                                sx={{
                                    height: "100%",
                                    width: `${pct}%`,
                                    background: etapa.color,
                                    borderRadius: 6,
                                    transition: "width 0.4s ease",
                                }}
                            />

                        </Box>

                    </Box>

                );

            })}

            {Number(datos?.rechazados || 0) > 0 && (
                <Typography fontSize={13} color="text.secondary" sx={{ mt: 0.5 }}>
                    {datos.rechazados} postulación
                    {datos.rechazados === 1 ? "" : "es"} marcada
                    {datos.rechazados === 1 ? "" : "s"} como no seleccionada
                    {datos.rechazados === 1 ? "" : "s"} en el camino.
                </Typography>
            )}

        </Box>

    );

}

function TablaVacantes({ vacantes }) {

    if (!vacantes.length) {
        return (
            <Typography color="text.secondary" fontSize={14}>
                Todavía no has publicado ninguna vacante.
            </Typography>
        );
    }

    return (

        <Box sx={{ overflowX: "auto" }}>

            <Box
                component="table"
                sx={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: 720,
                }}
            >

                <Box component="thead">
                    <Box
                        component="tr"
                        sx={{ borderBottom: "2px solid #E6E8EC" }}
                    >
                        {[
                            "Vacante",
                            "Postulados",
                            "Revisión",
                            "Entrevista",
                            "Contratados",
                            "Días abierta",
                            "Días para contratar",
                        ].map((titulo) => (
                            <Box
                                component="th"
                                key={titulo}
                                sx={{
                                    textAlign: "left",
                                    fontSize: 13,
                                    color: "text.secondary",
                                    fontWeight: 700,
                                    py: 1.2,
                                    pr: 2,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {titulo}
                            </Box>
                        ))}
                    </Box>
                </Box>

                <Box component="tbody">

                    {vacantes.map((v) => (

                        <Box
                            component="tr"
                            key={v.job_id}
                            sx={{ borderBottom: "1px solid #F0F2F6" }}
                        >

                            <Box
                                component="td"
                                sx={{ py: 1.4, pr: 2, fontWeight: 600, color: "#0B1F3A" }}
                            >
                                {v.title}
                            </Box>

                            <Box component="td" sx={{ py: 1.4, pr: 2 }}>
                                {v.total_postulaciones}
                            </Box>

                            <Box component="td" sx={{ py: 1.4, pr: 2 }}>
                                {v.en_revision}
                            </Box>

                            <Box component="td" sx={{ py: 1.4, pr: 2 }}>
                                {v.en_entrevista}
                            </Box>

                            <Box
                                component="td"
                                sx={{ py: 1.4, pr: 2, fontWeight: 700, color: "#0E8F73" }}
                            >
                                {v.contratados}
                            </Box>

                            <Box component="td" sx={{ py: 1.4, pr: 2 }}>
                                {v.dias_abierta === null || v.dias_abierta === undefined
                                    ? "—"
                                    : `${v.dias_abierta} d`}
                            </Box>

                            <Box component="td" sx={{ py: 1.4, pr: 2 }}>
                                {diasBonito(v.dias_contratacion_promedio)}
                            </Box>

                        </Box>

                    ))}

                </Box>

            </Box>

        </Box>

    );

}

function Reports() {

    const [company, setCompany] = useState(null);
    const [myRole, setMyRole] = useState(null);
    const [funnel, setFunnel] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [mes, setMes] = useState("todos");
    const [anio, setAnio] = useState(ANIO_ACTUAL);

    const rango = useMemo(() => calcularRango(mes, anio), [mes, anio]);

    useEffect(() => {

        loadData(rango);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mes, anio]);

    async function loadData(rangoActual) {

        setLoading(true);
        setError(null);

        const { company: companyData, role } = await getMyCompanyContext();

        if (!companyData) {
            setLoading(false);
            return;
        }

        setCompany(companyData);
        setMyRole(role);

        const [funnelResult, jobsResult] = await Promise.all([
            getHiringFunnel(companyData.id, rangoActual.desde, rangoActual.hasta),
            getJobsReport(companyData.id, rangoActual.desde, rangoActual.hasta),
        ]);

        if (funnelResult.error || jobsResult.error) {
            setError(
                (funnelResult.error || jobsResult.error).message ||
                    "No se pudo cargar el reporte."
            );
        }

        setFunnel(funnelResult.data || null);
        setJobs(jobsResult.data || []);

        setLoading(false);

    }

    const totalPostulaciones = Number(funnel?.total_postulaciones || 0);
    const contratados = Number(funnel?.contratados || 0);
    const tasaContratacion = porcentaje(contratados, totalPostulaciones);

    return (

        <div className="dashboard">

            <RecruiterSidebar company={company} role={myRole} />

            <main className="dashboard-content">

                <Box sx={{ maxWidth: 1040, py: 4, px: { xs: 2, md: 0 } }}>

                    {/* Este bloque solo aparece al imprimir/descargar */}
                    <Box className="reports-print-header">
                        <Typography variant="h5" fontWeight="bold" color="#0B1F3A">
                            {company?.company_name || "Reporte"}
                        </Typography>
                        <Typography fontSize={14} color="text.secondary">
                            Reporte de selección · {rango.etiqueta}
                        </Typography>
                        <Typography fontSize={12} color="text.secondary">
                            Generado el{" "}
                            {new Date().toLocaleDateString("es-GT", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            })}{" "}
                            vía ChanceGT
                        </Typography>
                    </Box>

                    <Box
                        className="no-print"
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            flexWrap: "wrap",
                            gap: 2,
                        }}
                    >

                        <Box>

                            <Typography variant="h4" fontWeight="bold" color="#0B1F3A">
                                Reportes
                            </Typography>

                            <Typography color="text.secondary" sx={{ maxWidth: 560 }}>
                                Números reales de tu propio proceso de selección
                                — nada estimado. Se calculan de las postulaciones
                                y los cambios de estado que tu equipo ya ha
                                registrado.
                            </Typography>

                        </Box>

                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={() => window.print()}
                            disabled={loading || totalPostulaciones === 0}
                            sx={{ textTransform: "none", whiteSpace: "nowrap" }}
                        >
                            Descargar reporte
                        </Button>

                    </Box>

                    {/* Filtro de periodo */}

                    <Box
                        className="no-print"
                        sx={{
                            display: "flex",
                            gap: 1.5,
                            alignItems: "center",
                            mt: 2.5,
                            mb: 3,
                            flexWrap: "wrap",
                        }}
                    >

                        <Typography fontSize={14} color="text.secondary">
                            Periodo:
                        </Typography>

                        <Select
                            size="small"
                            value={mes}
                            onChange={(e) => setMes(e.target.value)}
                            sx={{ minWidth: 160, background: "#fff" }}
                        >
                            <MenuItem value="todos">Todo el tiempo</MenuItem>
                            {MESES.map((nombre, i) => (
                                <MenuItem key={nombre} value={i}>
                                    {nombre}
                                </MenuItem>
                            ))}
                        </Select>

                        {mes !== "todos" && (
                            <Select
                                size="small"
                                value={anio}
                                onChange={(e) => setAnio(e.target.value)}
                                sx={{ minWidth: 110, background: "#fff" }}
                            >
                                {ANIOS.map((a) => (
                                    <MenuItem key={a} value={a}>
                                        {a}
                                    </MenuItem>
                                ))}
                            </Select>
                        )}

                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {loading && <Typography>Calculando reporte…</Typography>}

                    {!loading && !error && totalPostulaciones === 0 && (
                        <Alert severity="info" sx={{ mb: 3 }} className="no-print">
                            {mes === "todos"
                                ? "Todavía no tienes postulaciones registradas. En cuanto empieces a recibir candidatos, este reporte se llena solo."
                                : `No hay postulaciones registradas en ${rango.etiqueta}. Prueba con otro periodo o "Todo el tiempo".`}
                        </Alert>
                    )}

                    {!loading && (

                        <>

                            {/* KPIs */}

                            <Box
                                sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 2,
                                    mb: 4,
                                }}
                            >

                                <KpiCard
                                    titulo="Total de postulaciones"
                                    valor={totalPostulaciones}
                                />

                                <KpiCard
                                    titulo="Tasa de contratación"
                                    valor={`${tasaContratacion}%`}
                                    nota={`${contratados} de ${totalPostulaciones} postulaciones`}
                                />

                                <KpiCard
                                    titulo="Primera respuesta"
                                    valor={horasBonito(funnel?.horas_respuesta_promedio)}
                                    nota="tiempo promedio en pasar del estado inicial"
                                />

                                <KpiCard
                                    titulo="Tiempo de contratación"
                                    valor={diasBonito(funnel?.dias_contratacion_promedio)}
                                    nota="desde que aplican hasta que se contratan"
                                />

                            </Box>

                            {/* Embudo */}

                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    mb: 4,
                                    borderRadius: 3,
                                    border: "1px solid #E6E8EC",
                                }}
                            >

                                <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    color="#0B1F3A"
                                    mb={2}
                                >
                                    Embudo de contratación
                                </Typography>

                                <Embudo datos={funnel} />

                            </Paper>

                            {/* Por vacante */}

                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    border: "1px solid #E6E8EC",
                                }}
                            >

                                <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    color="#0B1F3A"
                                    mb={2}
                                >
                                    Por vacante
                                </Typography>

                                <TablaVacantes vacantes={jobs} />

                            </Paper>

                        </>

                    )}

                </Box>

            </main>

        </div>

    );

}

export default Reports;
