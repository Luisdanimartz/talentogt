import { useEffect, useMemo, useState } from "react";

import "./../../styles/theme.css";
import "./../../styles/recruiter/layout/RecruiterDashboard.css";

import {
    Alert,
    Box,
    Button,
    Chip,
    IconButton,
    Paper,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";

import { Close as CloseIcon, Edit as EditIcon } from "@mui/icons-material";

import AdminSidebar from "../../components/admin/AdminSidebar";

import {
    getAdminCompanies,
    setCompanyStatus,
    setCompanyPlan,
    setCompanyCollaborator,
    getPricingPlans,
    savePricingPlan,
    assignPlanToCompany,
    grantFreePosts,
    addUnlockCredits,
    getCompanyPricingHistory,
} from "../../services/adminService";

const PLAN_VACIO = {
    id: null,
    name: "",
    price: "",
    duration_days: 30,
    job_limit: "",
    is_active: true,
};

function fechaCorta(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-GT", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function Companies() {

    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const [busqueda, setBusqueda] = useState("");
    const [seleccionada, setSeleccionada] = useState(null);

    const [plans, setPlans] = useState([]);
    const [planForm, setPlanForm] = useState(null);
    const [historial, setHistorial] = useState([]);

    const [gratisCantidad, setGratisCantidad] = useState(1);
    const [gratisNota, setGratisNota] = useState("");
    const [creditosCantidad, setCreditosCantidad] = useState(5);

    useEffect(() => {

        cargar();
        cargarPlanes();

    }, []);

    async function cargar() {

        setLoading(true);
        setError(null);

        const { data, error } = await getAdminCompanies();

        if (error) setError(error.message);

        setCompanies(data || []);
        setLoading(false);

    }

    async function cargarPlanes() {

        const { data, error } = await getPricingPlans();

        if (error) setError(error.message);

        setPlans(data || []);

    }

    async function seleccionar(company) {

        setSeleccionada(company);
        setGratisCantidad(1);
        setGratisNota("");

        const { data, error } = await getCompanyPricingHistory(company.id);

        if (error) setError(error.message);

        setHistorial(data || []);

    }

    async function toggleStatus(company) {

        const nuevo = company.status === "activa" ? "suspendida" : "activa";

        const confirmacion =
            nuevo === "suspendida"
                ? `¿Dar de baja a ${company.company_name}? Sus vacantes dejarán de verse en /vacantes de inmediato.`
                : `¿Reactivar a ${company.company_name}? Sus vacantes vuelven a verse.`;

        if (!window.confirm(confirmacion)) return;

        setBusyId(company.id);
        const { error } = await setCompanyStatus(company.id, nuevo);
        setBusyId(null);

        if (error) { setError(error.message); return; }

        setCompanies((prev) =>
            prev.map((c) => (c.id === company.id ? { ...c, status: nuevo } : c))
        );

    }

    async function togglePlanBadge(company) {

        const nuevo = company.plan === "vip" ? "gratis" : "vip";

        setBusyId(company.id);
        const { error } = await setCompanyPlan(company.id, nuevo);
        setBusyId(null);

        if (error) { setError(error.message); return; }

        setCompanies((prev) =>
            prev.map((c) => (c.id === company.id ? { ...c, plan: nuevo } : c))
        );

    }

    async function toggleColaboradora(company) {

        const nuevo = !company.is_collaborator;

        setBusyId(company.id);
        const { error } = await setCompanyCollaborator(company.id, nuevo);
        setBusyId(null);

        if (error) { setError(error.message); return; }

        setCompanies((prev) =>
            prev.map((c) =>
                c.id === company.id ? { ...c, is_collaborator: nuevo } : c
            )
        );

    }

    async function guardarPlan() {

        if (!planForm.name.trim()) {
            setError("La tarifa necesita un nombre.");
            return;
        }

        const { error } = await savePricingPlan(planForm);

        if (error) { setError(error.message); return; }

        setPlanForm(null);
        cargarPlanes();

    }

    async function asignarPlan(plan) {

        if (!seleccionada) return;

        if (
            !window.confirm(
                `¿Asignar "${plan.name}" a ${seleccionada.company_name} por ${plan.duration_days} días?`
            )
        ) return;

        const { error } = await assignPlanToCompany(seleccionada.id, plan.id);

        if (error) { setError(error.message); return; }

        const { data } = await getCompanyPricingHistory(seleccionada.id);
        setHistorial(data || []);

    }

    async function darPublicacionesGratis() {

        if (!seleccionada || !gratisCantidad) return;

        const { error } = await grantFreePosts(
            seleccionada.id,
            Number(gratisCantidad),
            gratisNota
        );

        if (error) { setError(error.message); return; }

        setGratisCantidad(1);
        setGratisNota("");

        const { data } = await getCompanyPricingHistory(seleccionada.id);
        setHistorial(data || []);

    }

    async function darCreditosBusqueda() {

        if (!seleccionada || !creditosCantidad) return;

        const { data, error } = await addUnlockCredits(
            seleccionada.id,
            Number(creditosCantidad)
        );

        if (error) { setError(error.message); return; }

        setSeleccionada((prev) =>
            prev ? { ...prev, unlock_credits: data } : prev
        );

        setCompanies((prev) =>
            prev.map((c) =>
                c.id === seleccionada.id
                    ? { ...c, unlock_credits: data }
                    : c
            )
        );

    }

    const filtradas = useMemo(() => {

        const q = busqueda.trim().toLowerCase();

        if (!q) return companies;

        return companies.filter((c) =>
            [c.company_name, c.nit, c.email, c.phone]
                .filter(Boolean)
                .some((campo) => campo.toLowerCase().includes(q))
        );

    }, [companies, busqueda]);

    return (

        <div className="dashboard">

            <AdminSidebar />

            <main className="dashboard-content">

                <Box sx={{ py: 4, px: { xs: 2, md: 3 } }}>

                    <Typography variant="h4" fontWeight="bold" color="#0B1F3A">
                        Empresas
                    </Typography>

                    <Typography color="text.secondary" mb={3}>
                        {companies.length} empresa{companies.length === 1 ? "" : "s"} registrada
                        {companies.length === 1 ? "" : "s"}.
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start", flexWrap: "wrap" }}>

                        {/* ===== Columna izquierda: lista ===== */}

                        <Box sx={{ flex: "2 1 560px", minWidth: 320 }}>

                            <TextField
                                size="small"
                                placeholder="Buscar por nombre, NIT, teléfono o correo…"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                sx={{ mb: 2, width: "100%", maxWidth: 420, background: "#fff" }}
                            />

                            {loading && <Typography>Cargando…</Typography>}

                            {!loading && (

                                <Paper
                                    elevation={0}
                                    sx={{ borderRadius: 3, border: "1px solid #E6E8EC", overflowX: "auto" }}
                                >

                                    <Table size="small">

                                        <TableHead>
                                            <TableRow>
                                                <TableCell><strong>Empresa</strong></TableCell>
                                                <TableCell><strong>Vacantes</strong></TableCell>
                                                <TableCell><strong>Postulaciones</strong></TableCell>
                                                <TableCell><strong>Estado</strong></TableCell>
                                                <TableCell><strong>Plan</strong></TableCell>
                                                <TableCell><strong>Colaboradora</strong></TableCell>
                                                <TableCell align="center"><strong>Acciones</strong></TableCell>
                                            </TableRow>
                                        </TableHead>

                                        <TableBody>

                                            {filtradas.map((c) => (

                                                <TableRow
                                                    key={c.id}
                                                    hover
                                                    selected={seleccionada?.id === c.id}
                                                    onClick={() => seleccionar(c)}
                                                    sx={{ cursor: "pointer" }}
                                                >

                                                    <TableCell>
                                                        <strong>{c.company_name}</strong>
                                                        <br />
                                                        <Typography fontSize={12} color="text.secondary">
                                                            {c.nit} · {c.email}
                                                        </Typography>
                                                    </TableCell>

                                                    <TableCell>{c.total_vacantes}</TableCell>
                                                    <TableCell>{c.total_postulaciones}</TableCell>

                                                    <TableCell>
                                                        <Chip
                                                            size="small"
                                                            label={c.status === "activa" ? "Activa" : "Suspendida"}
                                                            color={c.status === "activa" ? "success" : "error"}
                                                        />
                                                    </TableCell>

                                                    <TableCell>
                                                        <Chip
                                                            size="small"
                                                            label={c.plan === "vip" ? "VIP" : "Gratis"}
                                                            sx={
                                                                c.plan === "vip"
                                                                    ? { background: "#FFF3D6", color: "#8A6100" }
                                                                    : undefined
                                                            }
                                                        />
                                                    </TableCell>

                                                    <TableCell>
                                                        <Chip
                                                            size="small"
                                                            label={c.is_collaborator ? "Sí" : "No"}
                                                            sx={
                                                                c.is_collaborator
                                                                    ? { background: "#E4F5F0", color: "#0E8F73" }
                                                                    : undefined
                                                            }
                                                        />
                                                    </TableCell>

                                                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>

                                                        <Button
                                                            size="small"
                                                            color={c.status === "activa" ? "error" : "success"}
                                                            disabled={busyId === c.id}
                                                            onClick={() => toggleStatus(c)}
                                                            sx={{ textTransform: "none", mr: 1 }}
                                                        >
                                                            {c.status === "activa" ? "Dar de baja" : "Reactivar"}
                                                        </Button>

                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            disabled={busyId === c.id}
                                                            onClick={() => togglePlanBadge(c)}
                                                            sx={{ textTransform: "none", mr: 1 }}
                                                        >
                                                            {c.plan === "vip" ? "Quitar VIP" : "Marcar VIP"}
                                                        </Button>

                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            disabled={busyId === c.id}
                                                            onClick={() => toggleColaboradora(c)}
                                                            sx={{ textTransform: "none" }}
                                                        >
                                                            {c.is_collaborator ? "Quitar colaboradora" : "Marcar colaboradora"}
                                                        </Button>

                                                    </TableCell>

                                                </TableRow>

                                            ))}

                                            {filtradas.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={7}>
                                                        <Typography color="text.secondary" sx={{ py: 3 }}>
                                                            No se encontraron empresas con ese criterio.
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                        </TableBody>

                                    </Table>

                                </Paper>

                            )}

                        </Box>

                        {/* ===== Columna derecha: tarifario ===== */}

                        <Box sx={{ flex: "1 1 340px", minWidth: 300 }}>

                            {/* Empresa seleccionada */}

                            <Paper
                                elevation={0}
                                sx={{ p: 2.5, mb: 2.5, borderRadius: 3, border: "1px solid #E6E8EC" }}
                            >

                                {!seleccionada ? (

                                    <Typography fontSize={14} color="text.secondary">
                                        Haz clic en una empresa de la lista para asignarle
                                        una tarifa o darle publicaciones gratis.
                                    </Typography>

                                ) : (

                                    <>

                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>

                                            <Typography fontWeight="bold" color="#0B1F3A">
                                                {seleccionada.company_name}
                                            </Typography>

                                            <IconButton size="small" onClick={() => setSeleccionada(null)}>
                                                <CloseIcon fontSize="small" />
                                            </IconButton>

                                        </Box>

                                        <Typography fontSize={13} color="text.secondary" mb={2}>
                                            Asignar tarifa:
                                        </Typography>

                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>

                                            {plans.filter((p) => p.is_active).map((p) => (
                                                <Button
                                                    key={p.id}
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => asignarPlan(p)}
                                                    sx={{ textTransform: "none", justifyContent: "space-between" }}
                                                >
                                                    <span>{p.name}</span>
                                                    <span>Q{p.price} · {p.duration_days}d</span>
                                                </Button>
                                            ))}

                                            {plans.filter((p) => p.is_active).length === 0 && (
                                                <Typography fontSize={13} color="text.secondary">
                                                    No hay tarifas activas todavía. Crea una abajo.
                                                </Typography>
                                            )}

                                        </Box>

                                        <Typography fontSize={13} color="text.secondary" mb={1}>
                                            O regalar publicaciones gratis:
                                        </Typography>

                                        <Box sx={{ display: "flex", gap: 1, mb: 1 }}>

                                            <TextField
                                                size="small"
                                                type="number"
                                                value={gratisCantidad}
                                                onChange={(e) => setGratisCantidad(e.target.value)}
                                                sx={{ width: 90 }}
                                                inputProps={{ min: 1 }}
                                            />

                                            <Button
                                                size="small"
                                                variant="contained"
                                                onClick={darPublicacionesGratis}
                                                sx={{ textTransform: "none", background: "#0E8F73" }}
                                            >
                                                Regalar
                                            </Button>

                                        </Box>

                                        <TextField
                                            size="small"
                                            placeholder="Nota (opcional)"
                                            value={gratisNota}
                                            onChange={(e) => setGratisNota(e.target.value)}
                                            sx={{ width: "100%", mb: 2 }}
                                        />

                                        <Typography fontSize={13} color="text.secondary" mb={1}>
                                            Créditos de búsqueda de candidatos
                                            (tiene {seleccionada.unlock_credits ?? 0}):
                                        </Typography>

                                        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>

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
                                                sx={{ textTransform: "none", background: "#C98A2C" }}
                                            >
                                                Agregar créditos
                                            </Button>

                                        </Box>

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
                                                        {h.plan_name || `${h.free_posts_granted} publicación(es) gratis`}
                                                    </strong>
                                                    <br />
                                                    <span style={{ color: "#64748B" }}>
                                                        {fechaCorta(h.started_at)}
                                                        {h.expires_at && ` → ${fechaCorta(h.expires_at)}`}
                                                        {h.notes && ` · ${h.notes}`}
                                                    </span>
                                                </Box>
                                            ))
                                        )}

                                    </>

                                )}

                            </Paper>

                            {/* Catalogo de tarifas */}

                            <Paper
                                elevation={0}
                                sx={{ p: 2.5, borderRadius: 3, border: "1px solid #E6E8EC" }}
                            >

                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>

                                    <Typography fontWeight="bold" color="#0B1F3A">
                                        Tarifario ({plans.length}/10)
                                    </Typography>

                                    {plans.length < 10 && !planForm && (
                                        <Button
                                            size="small"
                                            onClick={() => setPlanForm(PLAN_VACIO)}
                                            sx={{ textTransform: "none" }}
                                        >
                                            + Nueva
                                        </Button>
                                    )}

                                </Box>

                                {planForm && (

                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, mb: 2, p: 1.5, background: "#F7F8FA", borderRadius: 2 }}>

                                        <TextField
                                            size="small"
                                            label="Nombre"
                                            value={planForm.name}
                                            onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                                        />

                                        <Box sx={{ display: "flex", gap: 1 }}>

                                            <TextField
                                                size="small"
                                                label="Precio (Q)"
                                                type="number"
                                                value={planForm.price}
                                                onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                                                sx={{ flex: 1 }}
                                            />

                                            <TextField
                                                size="small"
                                                label="Días"
                                                type="number"
                                                value={planForm.duration_days}
                                                onChange={(e) => setPlanForm({ ...planForm, duration_days: e.target.value })}
                                                sx={{ flex: 1 }}
                                            />

                                        </Box>

                                        <TextField
                                            size="small"
                                            label="Límite de publicaciones (vacío = ilimitado)"
                                            type="number"
                                            value={planForm.job_limit}
                                            onChange={(e) => setPlanForm({ ...planForm, job_limit: e.target.value })}
                                        />

                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                onClick={guardarPlan}
                                                sx={{ textTransform: "none", background: "#0E8F73" }}
                                            >
                                                Guardar
                                            </Button>
                                            <Button
                                                size="small"
                                                onClick={() => setPlanForm(null)}
                                                sx={{ textTransform: "none" }}
                                            >
                                                Cancelar
                                            </Button>
                                        </Box>

                                    </Box>

                                )}

                                {plans.map((p) => (

                                    <Box
                                        key={p.id}
                                        sx={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            py: 1,
                                            borderBottom: "1px solid #F0F2F6",
                                        }}
                                    >

                                        <Box>
                                            <Typography fontSize={13.5} fontWeight={600}>
                                                {p.name}
                                            </Typography>
                                            <Typography fontSize={12} color="text.secondary">
                                                Q{p.price} · {p.duration_days}d ·{" "}
                                                {p.job_limit ? `${p.job_limit} publicaciones` : "ilimitado"}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: "flex", alignItems: "center" }}>

                                            <Switch
                                                size="small"
                                                checked={p.is_active}
                                                onChange={() =>
                                                    savePricingPlan({ ...p, is_active: !p.is_active }).then(cargarPlanes)
                                                }
                                            />

                                            <IconButton size="small" onClick={() => setPlanForm(p)}>
                                                <EditIcon fontSize="inherit" />
                                            </IconButton>

                                        </Box>

                                    </Box>

                                ))}

                                {plans.length === 0 && !planForm && (
                                    <Typography fontSize={13} color="text.secondary">
                                        Todavía no has creado ninguna tarifa.
                                    </Typography>
                                )}

                            </Paper>

                        </Box>

                    </Box>

                </Box>

            </main>

        </div>

    );

}

export default Companies;
