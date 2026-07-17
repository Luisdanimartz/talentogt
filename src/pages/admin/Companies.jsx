import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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

import { Edit as EditIcon } from "@mui/icons-material";

import AdminSidebar from "../../components/admin/AdminSidebar";

import {
    getAdminCompanies,
    setCompanyStatus,
    setCompanyPlan,
    setCompanyCollaborator,
    getPricingPlans,
    savePricingPlan,
    getUpcomingPlanExpirations,
} from "../../services/adminService";

const PLAN_VACIO = {
    id: null,
    name: "",
    price: "",
    duration_days: 30,
    job_limit: "",
    seat_limit: "",
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

    const navigate = useNavigate();

    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const [busqueda, setBusqueda] = useState("");

    const [plans, setPlans] = useState([]);
    const [planForm, setPlanForm] = useState(null);

    const [vencimientos, setVencimientos] = useState([]);

    useEffect(() => {

        cargar();
        cargarPlanes();
        cargarVencimientos();

    }, []);

    async function cargarVencimientos() {

        const { data } = await getUpcomingPlanExpirations(14);

        setVencimientos(data || []);

    }

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

                    {vencimientos.length > 0 && (
                        <Alert severity="warning" sx={{ mb: 3 }}>
                            <strong>
                                {vencimientos.length}{" "}
                                {vencimientos.length === 1
                                    ? "plan vence"
                                    : "planes vencen"}{" "}
                                en los próximos 14 días:
                            </strong>{" "}
                            {vencimientos.map((v, i) => (
                                <span key={v.company_id}>
                                    {i > 0 && ", "}
                                    {v.company_name} ({v.plan_name},{" "}
                                    {v.dias_restantes === 0
                                        ? "vence hoy"
                                        : `${v.dias_restantes}d`})
                                </span>
                            ))}
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
                                                <TableCell><strong>Postulac.</strong></TableCell>
                                                <TableCell><strong>Estado</strong></TableCell>
                                                <TableCell><strong>Tarifa</strong></TableCell>
                                                <TableCell><strong>Vence</strong></TableCell>
                                                <TableCell><strong>Colaboradora</strong></TableCell>
                                                <TableCell align="center"><strong>Acciones</strong></TableCell>
                                            </TableRow>
                                        </TableHead>

                                        <TableBody>

                                            {filtradas.map((c) => (

                                                <TableRow
                                                    key={c.id}
                                                    hover
                                                    onClick={() => navigate(`/admin/empresas/${c.id}`)}
                                                    sx={{ cursor: "pointer" }}
                                                >

                                                    <TableCell>
                                                        <strong>{c.company_name}</strong>
                                                        {c.plan === "vip" && (
                                                            <span
                                                                title="Destacada (VIP)"
                                                                style={{
                                                                    marginLeft: 6,
                                                                    fontSize: 11,
                                                                    fontWeight: 700,
                                                                    color: "#8A6100",
                                                                    background: "#FFF3D6",
                                                                    padding: "1px 6px",
                                                                    borderRadius: 999,
                                                                }}
                                                            >
                                                                VIP
                                                            </span>
                                                        )}
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
                                                        <Typography fontSize={13}>
                                                            {c.active_plan_name || "Sin plan asignado"}
                                                            {c.active_plan_job_limit != null &&
                                                                ` (${c.active_plan_job_limit})`}
                                                        </Typography>
                                                    </TableCell>

                                                    <TableCell>
                                                        {c.plan_expires_at ? (
                                                            <Typography
                                                                fontSize={12.5}
                                                                fontWeight={600}
                                                                color={c.dias_para_vencer <= 3 ? "#A32D2D" : "#854F0B"}
                                                            >
                                                                {fechaCorta(c.plan_expires_at)}
                                                                <br />
                                                                <span style={{ fontWeight: 400 }}>
                                                                    {c.dias_para_vencer === 0
                                                                        ? "vence hoy"
                                                                        : `${c.dias_para_vencer}d restantes`}
                                                                </span>
                                                            </Typography>
                                                        ) : (
                                                            <Typography fontSize={12.5} color="text.secondary">—</Typography>
                                                        )}
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

                                        <TextField
                                            size="small"
                                            label="Límite de usuarios de equipo (vacío = ilimitado)"
                                            type="number"
                                            value={planForm.seat_limit}
                                            onChange={(e) => setPlanForm({ ...planForm, seat_limit: e.target.value })}
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
                                                {" · "}
                                                {p.seat_limit ? `${p.seat_limit} usuarios` : "usuarios ilimitados"}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>

                                            <Typography
                                                fontSize={12}
                                                fontWeight={700}
                                                color={p.is_active ? "#0E8F73" : "#94A3B8"}
                                                sx={{ mr: 0.5 }}
                                            >
                                                {p.is_active ? "Activo" : "Inactivo"}
                                            </Typography>

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
