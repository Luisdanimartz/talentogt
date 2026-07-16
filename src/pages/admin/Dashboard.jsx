import { useEffect, useState } from "react";

import "./../../styles/theme.css";
import "./../../styles/recruiter/layout/RecruiterDashboard.css";
import "./../../styles/admin/Dashboard.css";

import {
    Alert,
    Box,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import { Download as DownloadIcon } from "@mui/icons-material";

import AdminSidebar from "../../components/admin/AdminSidebar";
import {
    getAdminOverview,
    getAdminJobsTrend,
    getAdminCandidatesTrend,
    getAdminCompaniesTrend,
    getAdminRevenueOverview,
    getAdminRevenueTrend,
    getAdminRevenueByCompany,
    getAdminTopSellingPlans,
} from "../../services/adminService";

function horasBonito(numero) {
    if (numero === null || numero === undefined) return "—";
    if (numero < 24) return `${Math.round(numero)} h`;
    return `${Math.round((numero / 24) * 10) / 10} días`;
}

function quetzales(numero) {
    const n = Number(numero || 0);
    return `Q${n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fechaCorta(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-GT", { day: "numeric", month: "short", year: "numeric" });
}

const GRANULARIDADES = [
    { value: "day", label: "Día (30 días)" },
    { value: "month", label: "Mes (12 meses)" },
    { value: "year", label: "Año" },
];

function imprimirSeccion(seccion) {
    if (seccion) {
        document.body.setAttribute("data-print-only", seccion);
    } else {
        document.body.removeAttribute("data-print-only");
    }
    window.print();
    setTimeout(() => document.body.removeAttribute("data-print-only"), 500);
}

function hastaInclusivo(hasta) {
    const d = new Date(hasta);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
}

function KpiCard({ titulo, valor, acento, nota }) {
    return (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #E6E8EC", textAlign: "center" }}>
            <Typography variant="h4" fontWeight="bold" color={acento || "#0B1F3A"}>
                {valor}
            </Typography>
            <Typography color="text.secondary" fontSize={13} mt={0.5}>
                {titulo}
            </Typography>
            {nota && (
                <Typography color="text.secondary" fontSize={10.5} mt={0.3} sx={{ fontStyle: "italic" }}>
                    {nota}
                </Typography>
            )}
        </Paper>
    );
}

function BarritasChart({ datos, color = "#1A4B9B" }) {
    const max = Math.max(1, ...datos.map((d) => Number(d.total)));

    if (datos.length === 0) {
        return <Typography color="text.secondary" fontSize={13.5}>Todavía no hay datos en este periodo.</Typography>;
    }

    return (
        <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1, height: 130, overflowX: "auto", pb: 1 }}>
            {datos.map((d) => (
                <Box key={d.periodo} sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 34 }}>
                    <Typography fontSize={10.5} color="text.secondary" mb={0.5}>{d.total}</Typography>
                    <Box sx={{ width: 18, height: `${Math.max(6, (Number(d.total) / max) * 95)}px`, background: color, borderRadius: 1 }} />
                    <Typography fontSize={9.5} color="text.secondary" mt={0.5} sx={{ whiteSpace: "nowrap" }}>{d.periodo}</Typography>
                </Box>
            ))}
        </Box>
    );
}

function FiltroRango({ desde, setDesde, hasta, setHasta, activo, onAplicar, onQuitar, granularidad }) {
    return (
        <Box className="no-print" sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "wrap" }}>

            {granularidad && (
                <>
                    <Typography fontSize={13} color="text.secondary">Periodo:</Typography>
                    <ToggleButtonGroup size="small" value={granularidad.value} exclusive
                        onChange={(e, val) => val && granularidad.onChange(val)}>
                        {GRANULARIDADES.map((g) => (
                            <ToggleButton key={g.value} value={g.value} sx={{ textTransform: "none", px: 1.2, fontSize: 12.5 }}>
                                {g.label}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                    <Typography fontSize={13} color="text.secondary" sx={{ ml: 1 }}>o rango exacto:</Typography>
                </>
            )}

            <TextField size="small" type="date" label="Desde" InputLabelProps={{ shrink: true }}
                value={desde} onChange={(e) => setDesde(e.target.value)} sx={{ width: 155 }} />

            <TextField size="small" type="date" label="Hasta" InputLabelProps={{ shrink: true }}
                value={hasta} onChange={(e) => setHasta(e.target.value)} sx={{ width: 155 }} />

            <Button size="small" variant="contained" disabled={!desde || !hasta}
                onClick={onAplicar} sx={{ textTransform: "none", background: "#0E8F73" }}>
                Aplicar
            </Button>

            {activo && (
                <Button size="small" onClick={onQuitar} sx={{ textTransform: "none" }}>
                    Quitar filtro
                </Button>
            )}

        </Box>
    );
}

function Dashboard() {

    const [kpiDesde, setKpiDesde] = useState("");
    const [kpiHasta, setKpiHasta] = useState("");
    const [kpiActivo, setKpiActivo] = useState(false);
    const [overview, setOverview] = useState(null);

    const [crecGranularidad, setCrecGranularidad] = useState("month");
    const [crecDesde, setCrecDesde] = useState("");
    const [crecHasta, setCrecHasta] = useState("");
    const [crecActivo, setCrecActivo] = useState(false);
    const [jobsTrend, setJobsTrend] = useState([]);
    const [candidatesTrend, setCandidatesTrend] = useState([]);
    const [companiesTrend, setCompaniesTrend] = useState([]);

    const [factGranularidad, setFactGranularidad] = useState("month");
    const [factDesde, setFactDesde] = useState("");
    const [factHasta, setFactHasta] = useState("");
    const [factActivo, setFactActivo] = useState(false);
    const [revenueOverview, setRevenueOverview] = useState(null);
    const [revenueTrend, setRevenueTrend] = useState([]);
    const [revenueByCompany, setRevenueByCompany] = useState([]);
    const [topPlans, setTopPlans] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {

        setLoading(true);

        Promise.all([
            cargarKpis(null, null),
            cargarCrecimiento("month", null, null),
            cargarFacturacion("month", null, null),
        ]).then(() => setLoading(false));

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function cargarKpis(desde, hasta) {

        const { data, error } = await getAdminOverview(desde, hasta);

        if (error) setError(error.message);

        setOverview(data || null);

    }

    async function cargarCrecimiento(g, desde, hasta) {

        const [jobs, candidatos, empresas] = await Promise.all([
            getAdminJobsTrend(g, desde, hasta),
            getAdminCandidatesTrend(g, desde, hasta),
            getAdminCompaniesTrend(g, desde, hasta),
        ]);

        const primerError = jobs.error || candidatos.error || empresas.error;
        if (primerError) setError(primerError.message);

        setJobsTrend(jobs.data || []);
        setCandidatesTrend(candidatos.data || []);
        setCompaniesTrend(empresas.data || []);

    }

    async function cargarFacturacion(g, desde, hasta) {

        const [revOv, revTrend, revByCo, top] = await Promise.all([
            getAdminRevenueOverview(desde, hasta),
            getAdminRevenueTrend(g, desde, hasta),
            getAdminRevenueByCompany(desde, hasta),
            getAdminTopSellingPlans(desde, hasta),
        ]);

        const primerError = revOv.error || revTrend.error || revByCo.error || top.error;
        if (primerError) setError(primerError.message);

        setRevenueOverview(revOv.data || null);
        setRevenueTrend(revTrend.data || []);
        setRevenueByCompany(revByCo.data || []);
        setTopPlans(top.data || []);

    }

    function aplicarKpis() {
        if (!kpiDesde || !kpiHasta) return;
        setKpiActivo(true);
        cargarKpis(kpiDesde, hastaInclusivo(kpiHasta));
    }

    function quitarKpis() {
        setKpiDesde(""); setKpiHasta(""); setKpiActivo(false);
        cargarKpis(null, null);
    }

    function aplicarCrecimiento() {
        if (!crecDesde || !crecHasta) return;
        setCrecActivo(true);
        cargarCrecimiento(crecGranularidad, crecDesde, hastaInclusivo(crecHasta));
    }

    function quitarCrecimiento() {
        setCrecDesde(""); setCrecHasta(""); setCrecActivo(false);
        cargarCrecimiento(crecGranularidad, null, null);
    }

    function cambiarGranularidadCrecimiento(g) {
        setCrecGranularidad(g);
        if (!crecActivo) cargarCrecimiento(g, null, null);
    }

    function aplicarFacturacion() {
        if (!factDesde || !factHasta) return;
        setFactActivo(true);
        cargarFacturacion(factGranularidad, factDesde, hastaInclusivo(factHasta));
    }

    function quitarFacturacion() {
        setFactDesde(""); setFactHasta(""); setFactActivo(false);
        cargarFacturacion(factGranularidad, null, null);
    }

    function cambiarGranularidadFacturacion(g) {
        setFactGranularidad(g);
        if (!factActivo) cargarFacturacion(g, null, null);
    }

    const cards = overview
        ? [
              { title: "Candidatos", value: overview.total_candidatos },
              { title: "Empresas", value: overview.total_empresas },
              { title: "Vacantes publicadas", value: overview.total_vacantes_publicadas },
              { title: "Postulaciones", value: overview.total_postulaciones },
              { title: "Empresas VIP", value: overview.empresas_vip, acento: "#0E8F73", nota: "estado actual" },
              {
                  title: "Empresas suspendidas",
                  value: overview.empresas_suspendidas,
                  acento: overview.empresas_suspendidas > 0 ? "#B3261E" : undefined,
                  nota: "estado actual",
              },
              {
                  title: "Tiempo promedio de respuesta",
                  value: horasBonito(overview.horas_respuesta_promedio),
                  acento: "#1A4B9B",
              },
          ]
        : [];

    return (
        <div className="dashboard">

            <AdminSidebar />

            <main className="dashboard-content">

                <Box sx={{ maxWidth: 1200, py: 4, px: { xs: 2, md: 0 } }}>

                    <Box className="no-print" sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2, mb: 3 }}>
                        <Box>
                            <Typography variant="h4" fontWeight="bold" color="#0B1F3A">Panel administrativo</Typography>
                            <Typography color="text.secondary">Resumen general de ChanceGT — cada sección tiene su propio filtro de periodo.</Typography>
                        </Box>
                        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => imprimirSeccion(null)} sx={{ textTransform: "none" }}>
                            Descargar todo
                        </Button>
                    </Box>

                    {error && <Alert severity="error" sx={{ mb: 3 }} className="no-print">{error}</Alert>}

                    {loading && <Typography>Cargando…</Typography>}

                    {!loading && (
                        <>

                            <Paper elevation={0} className="dash-section" data-section="kpis" sx={{ p: 3, mb: 4, borderRadius: 3, border: "1px solid #E6E8EC" }}>

                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, flexWrap: "wrap", gap: 1 }}>
                                    <Typography variant="h6" fontWeight="bold" color="#0B1F3A">Resumen general</Typography>
                                    <Button size="small" className="no-print" startIcon={<DownloadIcon />} onClick={() => imprimirSeccion("kpis")} sx={{ textTransform: "none" }}>
                                        Descargar esta sección
                                    </Button>
                                </Box>

                                <FiltroRango
                                    desde={kpiDesde} setDesde={setKpiDesde}
                                    hasta={kpiHasta} setHasta={setKpiHasta}
                                    activo={kpiActivo} onAplicar={aplicarKpis} onQuitar={quitarKpis}
                                />

                                {kpiActivo && (
                                    <Alert severity="info" className="no-print" sx={{ mb: 2 }}>
                                        Del {kpiDesde} al {kpiHasta} (VIP/suspendidas siempre muestran el estado actual).
                                    </Alert>
                                )}

                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
                                    {cards.map((c) => (
                                        <KpiCard key={c.title} titulo={c.title} valor={c.value} acento={c.acento} nota={c.nota} />
                                    ))}
                                </Box>

                            </Paper>

                            <Paper elevation={0} className="dash-section" data-section="crecimiento" sx={{ p: 3, mb: 4, borderRadius: 3, border: "1px solid #E6E8EC" }}>

                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, flexWrap: "wrap", gap: 1 }}>
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold" color="#0B1F3A">Crecimiento</Typography>
                                        <Typography fontSize={13} color="text.secondary">Para analizar tendencias y cambiar estrategia con base en datos reales.</Typography>
                                    </Box>
                                    <Button size="small" className="no-print" startIcon={<DownloadIcon />} onClick={() => imprimirSeccion("crecimiento")} sx={{ textTransform: "none" }}>
                                        Descargar esta sección
                                    </Button>
                                </Box>

                                <FiltroRango
                                    desde={crecDesde} setDesde={setCrecDesde}
                                    hasta={crecHasta} setHasta={setCrecHasta}
                                    activo={crecActivo} onAplicar={aplicarCrecimiento} onQuitar={quitarCrecimiento}
                                    granularidad={{ value: crecGranularidad, onChange: cambiarGranularidadCrecimiento }}
                                />

                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 3, mt: 2 }}>
                                    <Box>
                                        <Typography fontSize={13.5} fontWeight={600} color="#0B1F3A" mb={1}>Vacantes publicadas</Typography>
                                        <BarritasChart datos={jobsTrend} color="#1A4B9B" />
                                    </Box>
                                    <Box>
                                        <Typography fontSize={13.5} fontWeight={600} color="#0B1F3A" mb={1}>Candidatos registrados</Typography>
                                        <BarritasChart datos={candidatesTrend} color="#0E8F73" />
                                    </Box>
                                    <Box>
                                        <Typography fontSize={13.5} fontWeight={600} color="#0B1F3A" mb={1}>Empresas registradas</Typography>
                                        <BarritasChart datos={companiesTrend} color="#D9A441" />
                                    </Box>
                                </Box>

                            </Paper>

                            <Paper elevation={0} className="dash-section" data-section="facturacion" sx={{ p: 3, borderRadius: 3, border: "1px solid #E6E8EC" }}>

                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, flexWrap: "wrap", gap: 1 }}>
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold" color="#0B1F3A">Facturación</Typography>
                                        <Typography fontSize={13} color="text.secondary">Solo tarifas de pago reales (no incluye publicaciones gratis regaladas).</Typography>
                                    </Box>
                                    <Button size="small" className="no-print" startIcon={<DownloadIcon />} onClick={() => imprimirSeccion("facturacion")} sx={{ textTransform: "none" }}>
                                        Descargar esta sección
                                    </Button>
                                </Box>

                                <FiltroRango
                                    desde={factDesde} setDesde={setFactDesde}
                                    hasta={factHasta} setHasta={setFactHasta}
                                    activo={factActivo} onAplicar={aplicarFacturacion} onQuitar={quitarFacturacion}
                                    granularidad={{ value: factGranularidad, onChange: cambiarGranularidadFacturacion }}
                                />

                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 2, my: 2 }}>
                                    <KpiCard titulo="Total facturado" valor={quetzales(revenueOverview?.total_facturado)} acento="#0E8F73" />
                                    <KpiCard titulo="Empresas que han pagado" valor={revenueOverview?.empresas_facturando ?? 0} />
                                    <KpiCard titulo="Tarifa más vendida" valor={topPlans[0]?.plan_name || "—"} acento="#1A4B9B" />
                                </Box>

                                <Typography fontSize={13.5} fontWeight={600} color="#0B1F3A" mb={1}>Ingresos por periodo</Typography>
                                <BarritasChart datos={revenueTrend} color="#0E8F73" />

                                <Typography fontSize={13.5} fontWeight={600} color="#0B1F3A" mt={4} mb={1}>Tarifas vendidas</Typography>
                                {topPlans.length === 0 ? (
                                    <Typography color="text.secondary" fontSize={13.5}>Todavía no se ha vendido ninguna tarifa.</Typography>
                                ) : (
                                    <Box sx={{ overflowX: "auto", mb: 4 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell><strong>Tarifa</strong></TableCell>
                                                <TableCell><strong>Veces vendida</strong></TableCell>
                                                <TableCell><strong>Total facturado</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {topPlans.map((p) => (
                                                <TableRow key={p.plan_name}>
                                                    <TableCell>{p.plan_name}</TableCell>
                                                    <TableCell>{p.veces_vendida}</TableCell>
                                                    <TableCell>{quetzales(p.total_facturado)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    </Box>
                                )}

                                <Typography fontSize={13.5} fontWeight={600} color="#0B1F3A" mb={1}>Facturación por empresa</Typography>
                                {revenueByCompany.length === 0 ? (
                                    <Typography color="text.secondary" fontSize={13.5}>Todavía ninguna empresa ha pagado una tarifa.</Typography>
                                ) : (
                                    <Box sx={{ overflowX: "auto" }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell><strong>Empresa</strong></TableCell>
                                                <TableCell><strong>Total pagado</strong></TableCell>
                                                <TableCell><strong>Compras</strong></TableCell>
                                                <TableCell><strong>Última compra</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {revenueByCompany.map((c) => (
                                                <TableRow key={c.company_name}>
                                                    <TableCell>{c.company_name}</TableCell>
                                                    <TableCell>{quetzales(c.total_facturado)}</TableCell>
                                                    <TableCell>{c.compras}</TableCell>
                                                    <TableCell>{fechaCorta(c.ultima_compra)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
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

export default Dashboard;
