import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import "./../../styles/theme.css";
import "./../../styles/recruiter/layout/RecruiterDashboard.css";

import {
    Alert,
    Box,
    Button,
    Chip,
    Paper,
    TextField,
    Typography,
} from "@mui/material";

import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";

import AdminSidebar from "../../components/admin/AdminSidebar";

import {
    getAdminCompanies,
    getPricingPlans,
    assignPlanToCompany,
    grantFreePosts,
    grantDestacadoCredits,
    setSeatLimit,
    addUnlockCredits,
    getCompanyPricingHistory,
    getCompanyUsage,
    setAssignmentActive,
    getCurrentAssignmentId,
} from "../../services/adminService";

function fechaCorta(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-GT", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function CompanyDetail() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [plans, setPlans] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [uso, setUso] = useState(null);

    const [gratisCantidad, setGratisCantidad] = useState(0);
    const [destacadoCantidad, setDestacadoCantidad] = useState(0);
    const [seatLimitValor, setSeatLimitValor] = useState(0);
    const [extrasNota, setExtrasNota] = useState("");

    const [creditosCantidad, setCreditosCantidad] = useState(5);
    const [creditosMsg, setCreditosMsg] = useState(null);
    const [dandoCreditos, setDandoCreditos] = useState(false);

    const [assignmentActualId, setAssignmentActualId] = useState(null);
    const [assignmentActiva, setAssignmentActiva] = useState(true);

    useEffect(() => {

        cargarTodo();

    }, [id]);

    async function cargarTodo() {

        setLoading(true);
        setError(null);

        const [companiesRes, plansRes, historialRes, usoRes, assignmentIdRes] = await Promise.all([
            getAdminCompanies(),
            getPricingPlans(),
            getCompanyPricingHistory(id),
            getCompanyUsage(id),
            getCurrentAssignmentId(id),
        ]);

        if (companiesRes.error) setError(companiesRes.error.message);

        const encontrada = (companiesRes.data || []).find((c) => c.id === id);
        const historialData = historialRes.data || [];

        setCompany(encontrada || null);
        setPlans(plansRes.data || []);
        setHistorial(historialData);
        setUso(usoRes.data || null);

        const actualId = assignmentIdRes.data || null;
        setAssignmentActualId(actualId);
        setAssignmentActiva(
            historialData.find((h) => h.id === actualId)?.is_active ?? true
        );

        setLoading(false);

    }

    async function refrescar() {

        const [companiesRes, historialRes, usoRes, assignmentIdRes] = await Promise.all([
            getAdminCompanies(),
            getCompanyPricingHistory(id),
            getCompanyUsage(id),
            getCurrentAssignmentId(id),
        ]);

        const encontrada = (companiesRes.data || []).find((c) => c.id === id);
        const historialData = historialRes.data || [];

        setCompany(encontrada || null);
        setHistorial(historialData);
        setUso(usoRes.data || null);

        const actualId = assignmentIdRes.data || null;
        setAssignmentActualId(actualId);
        setAssignmentActiva(
            historialData.find((h) => h.id === actualId)?.is_active ?? true
        );

    }

    async function asignarPlan(plan) {

        if (!company) return;

        if (
            !window.confirm(
                `¿Asignar "${plan.name}" a ${company.company_name} por ${plan.duration_days} días?`
            )
        ) return;

        const { error } = await assignPlanToCompany(company.id, plan.id);

        if (error) { setError(error.message); return; }

        await refrescar();

    }

    async function agregarExtras() {

        if (!company) return;

        const acciones = [];

        if (Number(gratisCantidad) > 0) {
            acciones.push(grantFreePosts(company.id, Number(gratisCantidad), extrasNota));
        }

        if (Number(destacadoCantidad) > 0) {
            acciones.push(grantDestacadoCredits(company.id, Number(destacadoCantidad), extrasNota));
        }

        if (Number(seatLimitValor) > 0) {
            acciones.push(setSeatLimit(company.id, Number(seatLimitValor), extrasNota));
        }

        if (acciones.length === 0) return;

        const resultados = await Promise.all(acciones);
        const conError = resultados.find((r) => r.error);

        if (conError) { setError(conError.error.message); return; }

        setGratisCantidad(0);
        setDestacadoCantidad(0);
        setSeatLimitValor(0);
        setExtrasNota("");

        await refrescar();

    }

    async function darCreditosBusqueda() {

        if (!company) return;

        const cantidad = Number(creditosCantidad);

        if (!cantidad || cantidad <= 0) {
            setCreditosMsg("Ingresa una cantidad mayor a 0.");
            return;
        }

        setCreditosMsg(null);
        setDandoCreditos(true);

        try {

            const { data, error } = await addUnlockCredits(company.id, cantidad);

            if (error) {
                setCreditosMsg(error.message);
                return;
            }

            setCreditosMsg(`Listo, ahora tiene ${data} de "Ver perfil completo".`);

            await refrescar();

        } catch (e) {
            console.error("Error agregando créditos:", e);
            setCreditosMsg("Ocurrió un error inesperado. Intenta de nuevo.");
        } finally {
            setDandoCreditos(false);
        }

    }

    async function toggleAsignacionActual() {

        if (!assignmentActualId) return;

        const { error } = await setAssignmentActive(assignmentActualId, !assignmentActiva);

        if (error) { setError(error.message); return; }

        await refrescar();

    }

    return (

        <div className="dashboard">

            <AdminSidebar />

            <main className="dashboard-content">

                <Box sx={{ py: 4, px: { xs: 2, md: 3 }, maxWidth: 720 }}>

                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate("/admin/empresas")}
                        sx={{ mb: 2, textTransform: "none", fontWeight: 600, color: "#0B1F3A" }}
                    >
                        Volver a Empresas
                    </Button>

                    {loading && <Typography>Cargando…</Typography>}

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {!loading && !company && (
                        <Alert severity="warning">No se encontró esta empresa.</Alert>
                    )}

                    {!loading && company && (

                        <>

                            <Typography variant="h4" fontWeight="bold" color="#0B1F3A">
                                {company.company_name}
                            </Typography>

                            <Typography color="text.secondary" mb={2}>
                                {company.email || "Sin correo registrado"}
                                {company.nit && ` · NIT ${company.nit}`}
                            </Typography>

                            <Chip
                                size="small"
                                label={`Plan actual: ${company.active_plan_name || "Sin plan asignado"}${
                                    company.active_plan_job_limit != null
                                        ? ` (${company.active_plan_job_limit})`
                                        : ""
                                }`}
                                sx={{
                                    mb: 3,
                                    background: "#E4F5F0",
                                    color: "#0E8F73",
                                    fontWeight: 600,
                                }}
                            />

                            <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, borderRadius: 3, border: "1px solid #E6E8EC" }}>

                                <Typography fontSize={13} color="text.secondary" mb={2}>
                                    Asignar tarifa:
                                </Typography>

                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>

                                    {plans.filter((p) => p.is_active).map((p) => {

                                        const esLaActiva =
                                            p.name === company.active_plan_name && assignmentActiva;

                                        return (
                                            <Box
                                                key={p.id}
                                                sx={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    gap: 1,
                                                    border: "1px solid",
                                                    borderColor: esLaActiva ? "#0E8F73" : "#E6E8EC",
                                                    background: esLaActiva ? "#E4F5F0" : "transparent",
                                                    borderRadius: 2,
                                                    px: 1.5,
                                                    py: 1,
                                                }}
                                            >
                                                <Box>
                                                    <Typography fontSize={13} fontWeight={600}>
                                                        {p.name}
                                                    </Typography>
                                                    <Typography fontSize={12} color="text.secondary">
                                                        Q{p.price} · {p.duration_days}d
                                                    </Typography>
                                                </Box>

                                                {esLaActiva ? (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        onClick={toggleAsignacionActual}
                                                        sx={{ textTransform: "none", background: "#0E8F73", flexShrink: 0 }}
                                                    >
                                                        Activo · Desactivar
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={() => asignarPlan(p)}
                                                        sx={{ textTransform: "none", flexShrink: 0 }}
                                                    >
                                                        Activar
                                                    </Button>
                                                )}

                                            </Box>
                                        );

                                    })}

                                    {plans.filter((p) => p.is_active).length === 0 && (
                                        <Typography fontSize={13} color="text.secondary">
                                            No hay tarifas activas todavía. Ve a Empresas para crear una.
                                        </Typography>
                                    )}

                                </Box>

                                <Typography fontSize={13} fontWeight={700} color="#0B1F3A" mt={1} mb={0.5}>
                                    O agrega extras sueltos
                                </Typography>

                                <Typography fontSize={12} color="text.secondary" mb={1.5}>
                                    Deja en 0 lo que no quieras cambiar. Puedes llenar más de uno a la vez.
                                </Typography>

                                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, mb: 1.5 }}>

                                    <Box>
                                        <Typography fontSize={11.5} color="text.secondary" mb={0.5}>
                                            Publicaciones
                                        </Typography>
                                        <TextField
                                            size="small"
                                            type="number"
                                            fullWidth
                                            value={gratisCantidad}
                                            onChange={(e) => setGratisCantidad(e.target.value)}
                                            inputProps={{ min: 0 }}
                                        />
                                    </Box>

                                    <Box>
                                        <Typography fontSize={11.5} color="text.secondary" mb={0.5}>
                                            Destacadas 🔥
                                        </Typography>
                                        <TextField
                                            size="small"
                                            type="number"
                                            fullWidth
                                            value={destacadoCantidad}
                                            onChange={(e) => setDestacadoCantidad(e.target.value)}
                                            inputProps={{ min: 0 }}
                                        />
                                    </Box>

                                    <Box>
                                        <Typography fontSize={11.5} color="text.secondary" mb={0.5}>
                                            Usuarios
                                        </Typography>
                                        <TextField
                                            size="small"
                                            type="number"
                                            fullWidth
                                            value={seatLimitValor}
                                            onChange={(e) => setSeatLimitValor(e.target.value)}
                                            inputProps={{ min: 0 }}
                                        />
                                    </Box>

                                </Box>

                                <TextField
                                    size="small"
                                    placeholder="Nota (opcional)"
                                    value={extrasNota}
                                    onChange={(e) => setExtrasNota(e.target.value)}
                                    sx={{ width: "100%", mb: 1.5 }}
                                />

                                <Button
                                    size="small"
                                    variant="contained"
                                    fullWidth
                                    onClick={agregarExtras}
                                    sx={{ textTransform: "none", background: "#0E8F73", mb: 2 }}
                                >
                                    Agregar
                                </Button>

                                {uso && (

                                    <Box
                                        sx={{
                                            display: "flex",
                                            gap: 2,
                                            flexWrap: "wrap",
                                            mb: 2,
                                            p: 1.2,
                                            background: "#FFFFFF",
                                            borderRadius: 2,
                                            border: "1px solid #E6E8EC",
                                        }}
                                    >

                                        <Typography fontSize={12.5} color="text.secondary">
                                            Vacantes:{" "}
                                            <strong style={{ color: "#0B1F3A" }}>
                                                {uso.vacantes_activas}
                                            </strong>
                                            {" / "}
                                            {uso.job_limit === null
                                                ? "ilimitadas"
                                                : uso.job_limit}
                                            {uso.job_limit !== null && (
                                                <span style={{ color: "#0E8F73" }}>
                                                    {" "}({uso.vacantes_disponibles} disponibles)
                                                </span>
                                            )}
                                        </Typography>

                                        <Typography fontSize={12.5} color="text.secondary">
                                            Publicaciones gratis acumuladas:{" "}
                                            <strong style={{ color: "#0B1F3A" }}>
                                                {uso.publicaciones_gratis_acumuladas}
                                            </strong>
                                        </Typography>

                                        <Typography fontSize={12.5} color="text.secondary">
                                            "Ver perfil completo" usados:{" "}
                                            <strong style={{ color: "#0B1F3A" }}>
                                                {uso.creditos_usados}
                                            </strong>
                                        </Typography>

                                    </Box>

                                )}

                                {uso && uso.plan_expires_at && (

                                    <Box
                                        sx={{
                                            mb: 2,
                                            p: 1.2,
                                            background: uso.dias_para_vencer <= 3
                                                ? "#FCEBEB"
                                                : "#FAEEDA",
                                            borderRadius: 2,
                                        }}
                                    >

                                        <Typography
                                            fontSize={12.5}
                                            fontWeight={600}
                                            color={uso.dias_para_vencer <= 3 ? "#A32D2D" : "#854F0B"}
                                        >
                                            {uso.dias_para_vencer === 0
                                                ? "Su plan vence hoy"
                                                : `Su plan vence en ${uso.dias_para_vencer} día${uso.dias_para_vencer === 1 ? "" : "s"}`}
                                            {" "}({fechaCorta(uso.plan_expires_at)})
                                        </Typography>

                                    </Box>

                                )}

                                <Typography fontSize={13} color="text.secondary" mb={1}>
                                    "Ver perfil completo" disponibles
                                    (tiene {company.unlock_credits ?? 0}):
                                </Typography>

                                <Box sx={{ display: "flex", gap: 1, mb: 1 }}>

                                    <TextField
                                        size="small"
                                        type="number"
                                        value={creditosCantidad}
                                        onChange={(e) => setCreditosCantidad(e.target.value)}
                                        sx={{ width: 90 }}
                                    />

                                    <Button
                                        size="small"
                                        variant="contained"
                                        onClick={darCreditosBusqueda}
                                        disabled={dandoCreditos}
                                        sx={{ textTransform: "none", background: "#C98A2C" }}
                                    >
                                        {dandoCreditos ? "Agregando…" : "Agregar"}
                                    </Button>

                                </Box>

                                {creditosMsg && (
                                    <Typography
                                        fontSize={12.5}
                                        color={creditosMsg.startsWith("Listo") ? "#0E8F73" : "error"}
                                        mb={2}
                                    >
                                        {creditosMsg}
                                    </Typography>
                                )}

                                <Typography fontSize={13} fontWeight={600} color="#0B1F3A" mb={1}>
                                    Historial
                                </Typography>

                                {historial.length === 0 ? (
                                    <Typography fontSize={12.5} color="text.secondary">
                                        Sin tarifas ni regalos asignados todavía.
                                    </Typography>
                                ) : (
                                    historial.map((h) => (
                                        <Box key={h.id} sx={{ fontSize: 12.5, mb: 1, pb: 1, borderBottom: "1px solid #F0F2F6" }}>
                                            <strong>
                                                {h.plan_name
                                                    || (h.free_posts_granted
                                                        ? `${h.free_posts_granted} publicación(es) gratis`
                                                        : h.notes || "Movimiento")}
                                            </strong>
                                            <br />
                                            <span style={{ color: "#64748B" }}>
                                                {fechaCorta(h.started_at)}
                                                {h.expires_at && (h.plan_name || h.free_posts_granted > 0) && ` → ${fechaCorta(h.expires_at)}`}
                                                {h.notes && (h.plan_name || h.free_posts_granted) && ` · ${h.notes}`}
                                            </span>
                                        </Box>
                                    ))
                                )}

                            </Paper>

                        </>

                    )}

                </Box>

            </main>

        </div>

    );

}

export default CompanyDetail;
