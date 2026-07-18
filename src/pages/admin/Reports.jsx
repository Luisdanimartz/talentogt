import { useEffect, useState } from "react";

import "./../../styles/theme.css";
import "./../../styles/recruiter/layout/RecruiterDashboard.css";

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

/* Barra compacta de cada sección: rango de fechas propio, atajos y
   descarga CSV. Las secciones de estado actual solo llevan CSV. */
function BarraSeccion({
    conFecha, filtro, onCampo, onAplicar, onAtajo, onCsv, hayDatos, nota,
}) {

    return (

        <Box
            sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                alignItems: "center",
                mb: 2,
            }}
        >

            {conFecha && (
                <>
                    <TextField
                        label="Desde"
                        type="date"
                        size="small"
                        value={filtro.desde}
                        onChange={(e) => onCampo("desde", e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: 150 }}
                    />

                    <TextField
                        label="Hasta"
                        type="date"
                        size="small"
                        value={filtro.hasta}
                        onChange={(e) => onCampo("hasta", e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ width: 150 }}
                    />

                    <Button
                        variant="contained"
                        size="small"
                        onClick={onAplicar}
                        sx={{ background: "#0B1F3A", "&:hover": { background: "#122B4F" } }}
                    >
                        Aplicar
                    </Button>

                    <Button size="small" onClick={() => onAtajo("hoy")}>Hoy</Button>
                    <Button size="small" onClick={() => onAtajo("mes")}>Mes</Button>
                    <Button size="small" onClick={() => onAtajo("anio")}>Año</Button>
                    <Button size="small" onClick={() => onAtajo("todo")}>Todo</Button>
                </>
            )}

            {!conFecha && nota && (
                <Typography fontSize={12} color="text.secondary">
                    {nota}
                </Typography>
            )}

            <Box sx={{ flexGrow: 1 }} />

            <Button
                variant="outlined"
                size="small"
                disabled={!hayDatos}
                onClick={onCsv}
            >
                Descargar CSV
            </Button>

        </Box>

    );

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

    /* Filtro de fechas independiente por sección
       (vacío = todo el histórico) */
    const [filtros, setFiltros] = useState({});

    const filtroDe = (clave) => filtros[clave] || { desde: "", hasta: "" };

    function cambiarFiltro(clave, campo, valor) {
        setFiltros((prev) => ({
            ...prev,
            [clave]: { ...filtroDe(clave), [campo]: valor },
        }));
    }

    /* Recarga SOLO la sección indicada con su propio rango */
    async function recargarSeccion(clave, filtroManual) {

        const { desde, hasta } = filtroManual || filtroDe(clave);
        let res;

        switch (clave) {
            case "funnel":
                res = await getAdminHiringFunnel(desde, hasta);
                setFunnel(res.data || null);
                break;
            case "vistas":
                res = await getAdminJobViewsVsApplications(desde, hasta);
                setVistasVsAplicaciones(res.data || []);
                break;
            case "top":
                res = await getAdminTopCompanies(10, desde, hasta);
                setTopEmpresas(res.data || []);
                break;
            case "depto":
                res = await getAdminCandidatesByDepartment(desde, hasta);
                setPorDepartamento(res.data || []);
                break;
            case "empresasUbicacion":
                res = await getAdminCompaniesByLocation(desde, hasta);
                setEmpresasPorUbicacion(res.data || []);
                break;
            case "candidatosUbicacion":
                res = await getAdminCandidatesByLocation(desde, hasta);
                setCandidatosPorUbicacion(res.data || []);
                break;
            case "edad":
                res = await getAdminCandidatesByAge(desde, hasta);
                setCandidatosPorEdad(res.data || []);
                break;
            case "genero":
                res = await getAdminCandidatesByGender(desde, hasta);
                setCandidatosPorGenero(res.data || []);
                break;
            default:
                return;
        }

        if (res?.error) setError(res.error.message);

    }

    function atajoSeccion(clave, tipo) {

        const rango = rangoAtajo(tipo);
        setFiltros((prev) => ({ ...prev, [clave]: rango }));
        recargarSeccion(clave, rango);

    }

    function csvSeccion(clave) {

        const { desde, hasta } = filtroDe(clave);
        const sufijo =
            desde || hasta
                ? `_${desde || "inicio"}_a_${hasta || "hoy"}`
                : "_historico";

        const datasets = {
            funnel: [funnel ? [funnel] : [], "embudo_contratacion"],
            vistas: [vistasVsAplicaciones, "vistas_vs_postulaciones"],
            top: [topEmpresas, "top_empresas"],
            depto: [porDepartamento, "candidatos_por_departamento"],
            empresasUbicacion: [empresasPorUbicacion, "empresas_por_ubicacion"],
            candidatosUbicacion: [candidatosPorUbicacion, "candidatos_por_ubicacion"],
            edad: [candidatosPorEdad, "candidatos_por_edad"],
            genero: [candidatosPorGenero, "candidatos_por_genero"],
            pendientes: [pendientes, "pendientes_de_respuesta"],
            sinPublicar: [sinPublicar, "empresas_sin_publicar"],
        };

        const [filas, nombre] = datasets[clave];
        descargarCsv(filas, `chancegt_${nombre}${sufijo}.csv`);

    }

    /* Props compartidas para la barra de cada sección */
    function propsBarra(clave, conFecha, hayDatos, nota) {
        return {
            conFecha,
            hayDatos,
            nota,
            filtro: filtroDe(clave),
            onCampo: (campo, valor) => cambiarFiltro(clave, campo, valor),
            onAplicar: () => recargarSeccion(clave),
            onAtajo: (tipo) => atajoSeccion(clave, tipo),
            onCsv: () => csvSeccion(clave),
        };
    }

    useEffect(() => {

        setLoading(true);

        Promise.all([
            getAdminHiringFunnel("", ""),
            getAdminTopCompanies(10, "", ""),
            getAdminCandidatesByDepartment("", ""),
            getAdminPendingResponses(),
            getAdminCompaniesWithoutJobs(),
            getAdminCompaniesByLocation("", ""),
            getAdminCandidatesByLocation("", ""),
            getAdminCandidatesByAge("", ""),
            getAdminCandidatesByGender("", ""),
            getAdminJobViewsVsApplications("", ""),
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

                                <BarraSeccion {...propsBarra("funnel", true, !!funnel)} />

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

                                <BarraSeccion {...propsBarra("vistas", true, vistasVsAplicaciones.length > 0)} />

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

                                <BarraSeccion {...propsBarra("pendientes", false, pendientes.length > 0, "Estado actual de la plataforma (sin filtro de fecha).")} />

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

                                <BarraSeccion {...propsBarra("sinPublicar", false, sinPublicar.length > 0, "Estado actual de la plataforma (sin filtro de fecha).")} />

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

                                <BarraSeccion {...propsBarra("top", true, topEmpresas.length > 0)} />

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

                                <BarraSeccion {...propsBarra("depto", true, porDepartamento.length > 0)} />

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

                                <BarraSeccion {...propsBarra("empresasUbicacion", true, empresasPorUbicacion.length > 0)} />

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

                                <BarraSeccion {...propsBarra("candidatosUbicacion", true, candidatosPorUbicacion.length > 0)} />

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

                                        <BarraSeccion {...propsBarra("edad", true, candidatosPorEdad.length > 0)} />

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

                                        <BarraSeccion {...propsBarra("genero", true, candidatosPorGenero.length > 0)} />

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
