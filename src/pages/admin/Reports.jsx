import { useEffect, useState } from "react";

import "./../../styles/theme.css";
import "./../../styles/recruiter/layout/RecruiterDashboard.css";

import {
    Alert,
    Box,
    Button,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";

import AdminSidebar from "../../components/admin/AdminSidebar";

import {
    getAdminHiringFunnel,
    getAdminTopCompanies,
    getAdminCandidatesByDepartment,
    getAdminPendingResponses,
    getAdminCompaniesWithoutJobs,
    getAdminCompaniesByLocation,
    getAdminCandidatesByLocation,
    getAdminCandidatesByAge,
    getAdminCandidatesByGender,
    getAdminJobViewsVsApplications,
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

const GENERO_LABELS = {
    masculino: "Masculino",
    femenino: "Femenino",
    otro: "Otro",
    prefiero_no_decir: "Prefiero no decir",
    "Sin dato": "Sin dato",
};

function porcentaje(parte, total) {
    if (!total) return 0;
    return Math.round((parte / total) * 100);
}

/* ============ Descarga CSV ============
   Genera el CSV desde las filas tal como vienen de la BD (datos
   reales, sin transformar) y lo descarga con BOM UTF-8 para que
   Excel muestre bien las tildes. */
function descargarCsv(filas, nombreArchivo) {

    if (!filas || filas.length === 0) return;

    const columnas = Object.keys(filas[0]);

    const escapar = (valor) => {
        const texto = valor === null || valor === undefined ? "" : String(valor);
        return /[",\n]/.test(texto)
            ? `"${texto.replace(/"/g, '""')}"`
            : texto;
    };

    const lineas = [
        columnas.join(","),
        ...filas.map((fila) => columnas.map((c) => escapar(fila[c])).join(",")),
    ];

    const blob = new Blob(["\uFEFF" + lineas.join("\n")], {
        type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombreArchivo;
    enlace.click();
    URL.revokeObjectURL(url);

}

/* Atajos de fecha: devuelven { desde, hasta } en yyyy-mm-dd */
function rangoAtajo(tipo) {

    const hoy = new Date();
    const aIso = (fecha) => fecha.toISOString().slice(0, 10);

    if (tipo === "hoy") {
        return { desde: aIso(hoy), hasta: aIso(hoy) };
    }

    if (tipo === "mes") {
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        return { desde: aIso(inicio), hasta: aIso(hoy) };
    }

    if (tipo === "anio") {
        const inicio = new Date(hoy.getFullYear(), 0, 1);
        return { desde: aIso(inicio), hasta: aIso(hoy) };
    }

    return { desde: "", hasta: "" }; // todo el histórico

}

function Reports() {

    const [funnel, setFunnel] = useState(null);
    const [topEmpresas, setTopEmpresas] = useState([]);
    const [porDepartamento, setPorDepartamento] = useState([]);
    const [pendientes, setPendientes] = useState([]);
    const [sinPublicar, setSinPublicar] = useState([]);
    const [empresasPorUbicacion, setEmpresasPorUbicacion] = useState([]);
    const [candidatosPorUbicacion, setCandidatosPorUbicacion] = useState([]);
    const [candidatosPorEdad, setCandidatosPorEdad] = useState([]);
    const [candidatosPorGenero, setCandidatosPorGenero] = useState([]);
    const [vistasVsAplicaciones, setVistasVsAplicaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /* Filtro de fechas (vacío = todo el histórico) */
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");
    const [seccionCsv, setSeccionCsv] = useState("vistas");

    function cargar(fDesde, fHasta) {

        setLoading(true);
        setError(null);

        Promise.all([
            getAdminHiringFunnel(fDesde, fHasta),
            getAdminTopCompanies(10, fDesde, fHasta),
            getAdminCandidatesByDepartment(fDesde, fHasta),
            getAdminPendingResponses(),
            getAdminCompaniesWithoutJobs(),
            getAdminCompaniesByLocation(fDesde, fHasta),
            getAdminCandidatesByLocation(fDesde, fHasta),
            getAdminCandidatesByAge(fDesde, fHasta),
            getAdminCandidatesByGender(fDesde, fHasta),
            getAdminJobViewsVsApplications(fDesde, fHasta),
        ]).then(([
            funnelRes, topRes, deptoRes, pendientesRes, sinPublicarRes,
            empresasUbicacionRes, candidatosUbicacionRes, candidatosEdadRes,
            candidatosGeneroRes, vistasVsAplicacionesRes,
        ]) => {

            const primerError =
                funnelRes.error || topRes.error || deptoRes.error ||
                pendientesRes.error || sinPublicarRes.error ||
                empresasUbicacionRes.error || candidatosUbicacionRes.error ||
                candidatosEdadRes.error || candidatosGeneroRes.error ||
                vistasVsAplicacionesRes.error;

            if (primerError) {
                setError(primerError.message);
            }

            setFunnel(funnelRes.data || null);
            setTopEmpresas(topRes.data || []);
            setPorDepartamento(deptoRes.data || []);
            setPendientes(pendientesRes.data || []);
            setSinPublicar(sinPublicarRes.data || []);
            setEmpresasPorUbicacion(empresasUbicacionRes.data || []);
            setCandidatosPorUbicacion(candidatosUbicacionRes.data || []);
            setCandidatosPorEdad(candidatosEdadRes.data || []);
            setCandidatosPorGenero(candidatosGeneroRes.data || []);
            setVistasVsAplicaciones(vistasVsAplicacionesRes.data || []);

            setLoading(false);

        });

    }

    useEffect(() => {

        cargar("", "");

    }, []);

    function aplicarAtajo(tipo) {

        const rango = rangoAtajo(tipo);
        setDesde(rango.desde);
        setHasta(rango.hasta);
        cargar(rango.desde, rango.hasta);

    }

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

                    {/* Filtros de fecha y descarga CSV */}

                    <Paper
                        elevation={0}
                        sx={{ p: 2.5, mb: 4, borderRadius: 3, border: "1px solid #E6E8EC" }}
                    >

                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>

                            <TextField
                                label="Desde"
                                type="date"
                                size="small"
                                value={desde}
                                onChange={(e) => setDesde(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />

                            <TextField
                                label="Hasta"
                                type="date"
                                size="small"
                                value={hasta}
                                onChange={(e) => setHasta(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />

                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => cargar(desde, hasta)}
                                sx={{ background: "#0B1F3A", "&:hover": { background: "#122B4F" } }}
                            >
                                Aplicar
                            </Button>

                            <Button size="small" onClick={() => aplicarAtajo("hoy")}>Hoy</Button>
                            <Button size="small" onClick={() => aplicarAtajo("mes")}>Este mes</Button>
                            <Button size="small" onClick={() => aplicarAtajo("anio")}>Este año</Button>
                            <Button size="small" onClick={() => aplicarAtajo("todo")}>Todo</Button>

                        </Box>

                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", mt: 2 }}>

                            <TextField
                                select
                                label="Descargar reporte"
                                size="small"
                                value={seccionCsv}
                                onChange={(e) => setSeccionCsv(e.target.value)}
                                sx={{ minWidth: 260 }}
                            >
                                <MenuItem value="vistas">Vistas vs postulaciones</MenuItem>
                                <MenuItem value="funnel">Embudo de contratación</MenuItem>
                                <MenuItem value="top">Top empresas</MenuItem>
                                <MenuItem value="depto">Candidatos por departamento</MenuItem>
                                <MenuItem value="empresasUbicacion">Empresas por ubicación</MenuItem>
                                <MenuItem value="candidatosUbicacion">Candidatos por ubicación</MenuItem>
                                <MenuItem value="edad">Candidatos por edad</MenuItem>
                                <MenuItem value="genero">Candidatos por género</MenuItem>
                                <MenuItem value="pendientes">Pendientes de respuesta</MenuItem>
                                <MenuItem value="sinPublicar">Empresas sin publicar</MenuItem>
                            </TextField>

                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {

                                    const sufijo =
                                        desde || hasta
                                            ? `_${desde || "inicio"}_a_${hasta || "hoy"}`
                                            : "_historico";

                                    const datasets = {
                                        vistas: [vistasVsAplicaciones, "vistas_vs_postulaciones"],
                                        funnel: [funnel ? [funnel] : [], "embudo_contratacion"],
                                        top: [topEmpresas, "top_empresas"],
                                        depto: [porDepartamento, "candidatos_por_departamento"],
                                        empresasUbicacion: [empresasPorUbicacion, "empresas_por_ubicacion"],
                                        candidatosUbicacion: [candidatosPorUbicacion, "candidatos_por_ubicacion"],
                                        edad: [candidatosPorEdad, "candidatos_por_edad"],
                                        genero: [candidatosPorGenero, "candidatos_por_genero"],
                                        pendientes: [pendientes, "pendientes_de_respuesta"],
                                        sinPublicar: [sinPublicar, "empresas_sin_publicar"],
                                    };

                                    const [filas, nombre] = datasets[seccionCsv];
                                    descargarCsv(filas, `chancegt_${nombre}${sufijo}.csv`);

                                }}
                            >
                                Descargar CSV
                            </Button>

                        </Box>

                        <Typography color="text.secondary" fontSize={12} mt={1.5}>
                            Los reportes demográficos se filtran por fecha de registro
                            del perfil. Pendientes de respuesta y Empresas sin publicar
                            muestran el estado actual (el filtro de fecha no les aplica).
                        </Typography>

                    </Paper>

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

                            {/* Vistas vs postulaciones por vacante */}

                            <Paper
                                elevation={0}
                                sx={{ p: 3, mb: 4, borderRadius: 3, border: "1px solid #E6E8EC" }}
                            >

                                <Typography variant="h6" fontWeight="bold" color="#0B1F3A" mb={0.5}>
                                    Vistas vs postulaciones por vacante
                                </Typography>

                                <Typography color="text.secondary" fontSize={13} mb={2}>
                                    Si una vacante tiene vistas pero pocas postulaciones, el
                                    problema es de conversión. Si casi no tiene vistas, el
                                    problema es de alcance (poca gente está llegando a verla).
                                </Typography>

                                {vistasVsAplicaciones.length === 0 ? (
                                    <Typography color="text.secondary" fontSize={14}>
                                        Todavía no hay datos de vistas registrados.
                                    </Typography>
                                ) : (
                                    <Box sx={{ overflowX: "auto" }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell><strong>Vacante</strong></TableCell>
                                                    <TableCell><strong>Empresa</strong></TableCell>
                                                    <TableCell align="right"><strong>Vistas</strong></TableCell>
                                                    <TableCell align="right"><strong>Postulaciones</strong></TableCell>
                                                    <TableCell align="right"><strong>Conversión</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {vistasVsAplicaciones.map((v) => (
                                                    <TableRow key={v.job_id}>
                                                        <TableCell>{v.job_title}</TableCell>
                                                        <TableCell>{v.company_name || "—"}</TableCell>
                                                        <TableCell align="right">{v.total_views}</TableCell>
                                                        <TableCell align="right">{v.total_applications}</TableCell>
                                                        <TableCell align="right">{v.conversion_rate}%</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
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

                            {/* Empresas registradas sin ninguna vacante publicada */}

                            <Paper
                                elevation={0}
                                sx={{ p: 3, mb: 4, borderRadius: 3, border: "1px solid #E6E8EC" }}
                            >

                                <Typography variant="h6" fontWeight="bold" color="#0B1F3A" mb={0.5}>
                                    Empresas registradas sin ninguna vacante publicada
                                </Typography>

                                <Typography color="text.secondary" fontSize={13.5} mb={2}>
                                    Ordenadas por antigüedad: arriba las que llevan más tiempo
                                    registradas sin publicar nada.
                                </Typography>

                                {sinPublicar.length === 0 ? (
                                    <Typography color="text.secondary" fontSize={14}>
                                        Todas las empresas registradas ya publicaron al menos
                                        una vacante.
                                    </Typography>
                                ) : (
                                    <Box sx={{ overflowX: "auto" }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell><strong>Empresa</strong></TableCell>
                                                    <TableCell><strong>Correo</strong></TableCell>
                                                    <TableCell><strong>Departamento</strong></TableCell>
                                                    <TableCell><strong>Plan</strong></TableCell>
                                                    <TableCell><strong>Estado</strong></TableCell>
                                                    <TableCell align="right"><strong>Días registrada</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {sinPublicar.map((e) => {

                                                    const critico = e.dias_registrada >= 14;

                                                    return (
                                                        <TableRow key={e.id}>
                                                            <TableCell>{e.company_name}</TableCell>
                                                            <TableCell>{e.email}</TableCell>
                                                            <TableCell>{e.department_name || "—"}</TableCell>
                                                            <TableCell>{e.plan || "—"}</TableCell>
                                                            <TableCell>{e.status}</TableCell>
                                                            <TableCell
                                                                align="right"
                                                                sx={{ fontWeight: 600, color: critico ? "#C0392B" : "inherit" }}
                                                            >
                                                                {e.dias_registrada}
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

                            {/* Empresas por departamento y municipio */}

                            <Paper
                                elevation={0}
                                sx={{ p: 3, mb: 4, borderRadius: 3, border: "1px solid #E6E8EC" }}
                            >

                                <Typography variant="h6" fontWeight="bold" color="#0B1F3A" mb={2}>
                                    Empresas por departamento y municipio
                                </Typography>

                                {empresasPorUbicacion.length === 0 ? (
                                    <Typography color="text.secondary" fontSize={14}>
                                        Todavía no hay empresas registradas.
                                    </Typography>
                                ) : (
                                    <Box sx={{ overflowX: "auto" }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell><strong>Departamento</strong></TableCell>
                                                    <TableCell><strong>Municipio</strong></TableCell>
                                                    <TableCell align="right"><strong>Empresas</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {empresasPorUbicacion.map((e, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell>{e.department_name}</TableCell>
                                                        <TableCell>{e.municipality_name}</TableCell>
                                                        <TableCell align="right">{e.total}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </Box>
                                )}

                            </Paper>

                            {/* Candidatos por departamento y municipio */}

                            <Paper
                                elevation={0}
                                sx={{ p: 3, mb: 4, borderRadius: 3, border: "1px solid #E6E8EC" }}
                            >

                                <Typography variant="h6" fontWeight="bold" color="#0B1F3A" mb={0.5}>
                                    Candidatos por departamento y municipio
                                </Typography>

                                <Typography color="text.secondary" fontSize={13} mb={2}>
                                    El candidato escribe su ubicación como texto libre al crear
                                    su CV, así que variaciones de mayúsculas o tildes pueden
                                    aparecer como filas separadas.
                                </Typography>

                                {candidatosPorUbicacion.length === 0 ? (
                                    <Typography color="text.secondary" fontSize={14}>
                                        Todavía no hay candidatos registrados.
                                    </Typography>
                                ) : (
                                    <Box sx={{ overflowX: "auto" }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell><strong>Departamento</strong></TableCell>
                                                    <TableCell><strong>Municipio</strong></TableCell>
                                                    <TableCell align="right"><strong>Candidatos</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {candidatosPorUbicacion.map((c, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell>{c.department_name}</TableCell>
                                                        <TableCell>{c.municipality_name}</TableCell>
                                                        <TableCell align="right">{c.total}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </Box>
                                )}

                            </Paper>

                            {/* Candidatos por edad y género */}

                            <Paper
                                elevation={0}
                                sx={{ p: 3, mb: 4, borderRadius: 3, border: "1px solid #E6E8EC" }}
                            >

                                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 4 }}>

                                    <Box>

                                        <Typography variant="h6" fontWeight="bold" color="#0B1F3A" mb={2}>
                                            Candidatos por edad
                                        </Typography>

                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell><strong>Rango</strong></TableCell>
                                                    <TableCell align="right"><strong>Candidatos</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {candidatosPorEdad.map((r) => (
                                                    <TableRow key={r.rango}>
                                                        <TableCell>{r.rango}</TableCell>
                                                        <TableCell align="right">{r.total}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>

                                    </Box>

                                    <Box>

                                        <Typography variant="h6" fontWeight="bold" color="#0B1F3A" mb={0.5}>
                                            Candidatos por género
                                        </Typography>

                                        <Typography color="text.secondary" fontSize={13} mb={1.5}>
                                            Dato nuevo: solo lo tienen los candidatos que se
                                            registraron o actualizaron su CV después de este cambio.
                                        </Typography>

                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell><strong>Género</strong></TableCell>
                                                    <TableCell align="right"><strong>Candidatos</strong></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {candidatosPorGenero.map((g) => (
                                                    <TableRow key={g.gender}>
                                                        <TableCell>{GENERO_LABELS[g.gender] || g.gender}</TableCell>
                                                        <TableCell align="right">{g.total}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>

                                    </Box>

                                </Box>

                            </Paper>

                        </>

                    )}

                </Box>

            </main>

        </div>

    );

}

export default Reports;
