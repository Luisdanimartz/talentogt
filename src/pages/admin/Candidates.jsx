import { useEffect, useMemo, useState } from "react";

import "./../../styles/theme.css";
import "./../../styles/recruiter/layout/RecruiterDashboard.css";
import "./../../styles/admin/Print.css";

import { toTitleCase } from "../../utils/textFormat";

import {
    Alert,
    Avatar,
    Box,
    Button,
    Chip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import { Download as DownloadIcon } from "@mui/icons-material";

import AdminSidebar from "../../components/admin/AdminSidebar";
import {
    getAdminCandidates,
    setCandidateStatus,
} from "../../services/adminService";

function nombreCompleto(c) {
    return [c.first_name, c.last_name].filter(Boolean).join(" ") || "Candidato";
}

function fechaCorta(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-GT", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function Candidates() {

    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [busqueda, setBusqueda] = useState("");

    useEffect(() => {

        cargar();

    }, []);

    async function cargar() {

        setLoading(true);
        setError(null);

        const { data, error } = await getAdminCandidates();

        if (error) {
            setError(error.message);
        }

        setCandidates(data || []);
        setLoading(false);

    }

    async function toggleStatus(candidate) {

        const nuevo = candidate.status === "activa" ? "suspendida" : "activa";

        const confirmacion =
            nuevo === "suspendida"
                ? `¿Suspender a ${nombreCompleto(candidate)}? No podrá postularse a nuevas vacantes (sus postulaciones ya hechas siguen visibles para las empresas).`
                : `¿Reactivar a ${nombreCompleto(candidate)}?`;

        if (!window.confirm(confirmacion)) return;

        setBusyId(candidate.id);

        const { error } = await setCandidateStatus(candidate.id, nuevo);

        setBusyId(null);

        if (error) {
            setError(error.message);
            return;
        }

        setCandidates((prev) =>
            prev.map((c) =>
                c.id === candidate.id ? { ...c, status: nuevo } : c
            )
        );

    }

    const filtrados = useMemo(() => {

        const q = busqueda.trim().toLowerCase();

        if (!q) return candidates;

        return candidates.filter((c) =>
            [nombreCompleto(c), c.email, c.phone, c.profession, c.department]
                .filter(Boolean)
                .some((campo) => campo.toLowerCase().includes(q))
        );

    }, [candidates, busqueda]);

    return (

        <div className="dashboard">

            <AdminSidebar />

            <main className="dashboard-content">

                <Box sx={{ maxWidth: 1300, py: 4, px: { xs: 2, md: 0 } }}>

                    <Box
                        className="no-print"
                        sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}
                    >

                        <Box>
                            <Typography variant="h4" fontWeight="bold" color="#0B1F3A">
                                Candidatos
                            </Typography>
                            <Typography color="text.secondary" mb={2}>
                                {candidates.length} candidato{candidates.length === 1 ? "" : "s"} registrado
                                {candidates.length === 1 ? "" : "s"}.
                            </Typography>
                        </Box>

                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={() => window.print()}
                            disabled={loading || filtrados.length === 0}
                            sx={{ textTransform: "none" }}
                        >
                            Descargar / Imprimir
                        </Button>

                    </Box>

                    <TextField
                        size="small"
                        className="no-print"
                        placeholder="Buscar por nombre, correo, teléfono, profesión o departamento…"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        sx={{ mb: 3, width: "100%", maxWidth: 460, background: "#fff" }}
                    />

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }} className="no-print">
                            {error}
                        </Alert>
                    )}

                    {loading && <Typography>Cargando…</Typography>}

                    {!loading && (

                        <Paper
                            elevation={0}
                            sx={{ borderRadius: 3, border: "1px solid #E6E8EC", overflowX: "auto" }}
                        >

                            <Table size="small">

                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Candidato</strong></TableCell>
                                        <TableCell><strong>Contacto</strong></TableCell>
                                        <TableCell><strong>Profesión</strong></TableCell>
                                        <TableCell><strong>Ubicación</strong></TableCell>
                                        <TableCell><strong>Postulaciones</strong></TableCell>
                                        <TableCell><strong>Registrado</strong></TableCell>
                                        <TableCell><strong>Estado</strong></TableCell>
                                        <TableCell align="center" className="no-print"><strong>Acciones</strong></TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>

                                    {filtrados.map((c) => (

                                        <TableRow key={c.id}>

                                            <TableCell>

                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>

                                                    <Avatar sx={{ width: 30, height: 30, fontSize: 13 }} className="no-print">
                                                        {nombreCompleto(c).charAt(0)}
                                                    </Avatar>

                                                    <Typography fontWeight={600} fontSize={13.5}>
                                                        {nombreCompleto(c)}
                                                    </Typography>

                                                </Box>

                                            </TableCell>

                                            <TableCell>
                                                <Typography fontSize={12.5}>{c.email}</Typography>
                                                <Typography fontSize={12.5} color="text.secondary">
                                                    {c.phone || "—"}
                                                </Typography>
                                            </TableCell>

                                            <TableCell>{c.profession || "—"}</TableCell>

                                            <TableCell>
                                                {[c.department, c.municipality].filter(Boolean).map(toTitleCase).join(", ") || "—"}
                                            </TableCell>

                                            <TableCell>{c.total_postulaciones}</TableCell>

                                            <TableCell>{fechaCorta(c.created_at)}</TableCell>

                                            <TableCell>
                                                <Chip
                                                    size="small"
                                                    label={c.status === "activa" ? "Activo" : "Suspendido"}
                                                    color={c.status === "activa" ? "success" : "error"}
                                                />
                                            </TableCell>

                                            <TableCell align="center" className="no-print">
                                                <Button
                                                    size="small"
                                                    color={c.status === "activa" ? "error" : "success"}
                                                    disabled={busyId === c.id}
                                                    onClick={() => toggleStatus(c)}
                                                    sx={{ textTransform: "none" }}
                                                >
                                                    {c.status === "activa" ? "Suspender" : "Reactivar"}
                                                </Button>
                                            </TableCell>

                                        </TableRow>

                                    ))}

                                    {filtrados.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8}>
                                                <Typography color="text.secondary" sx={{ py: 3 }}>
                                                    {candidates.length === 0
                                                        ? "Todavía no hay candidatos registrados."
                                                        : "No se encontraron candidatos con ese criterio."}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}

                                </TableBody>

                            </Table>

                        </Paper>

                    )}

                </Box>

            </main>

        </div>

    );

}

export default Candidates;
