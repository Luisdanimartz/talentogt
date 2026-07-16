import { useEffect, useState } from "react";

import "./../../styles/theme.css";
import "./../../styles/recruiter/layout/RecruiterDashboard.css";

import {
    Alert,
    Box,
    Button,
    Chip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";

import AdminSidebar from "../../components/admin/AdminSidebar";
import { getAdminJobs, setJobStatus } from "../../services/adminService";

const ESTADO_CHIP = {
    published: { label: "Publicada", color: "success" },
    closed: { label: "Despublicada", color: "default" },
};

function Jobs() {

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [busyId, setBusyId] = useState(null);

    useEffect(() => {

        cargar();

    }, []);

    async function cargar() {

        setLoading(true);
        setError(null);

        const { data, error } = await getAdminJobs();

        if (error) {
            setError(error.message);
        }

        setJobs(data || []);
        setLoading(false);

    }

    async function toggleStatus(job) {

        const nuevo = job.status === "published" ? "closed" : "published";

        if (
            nuevo === "closed" &&
            !window.confirm(`¿Despublicar "${job.title}"? Dejará de verse en /vacantes.`)
        ) {
            return;
        }

        setBusyId(job.id);

        const { error } = await setJobStatus(job.id, nuevo);

        setBusyId(null);

        if (error) {
            setError(error.message);
            return;
        }

        setJobs((prev) =>
            prev.map((j) => (j.id === job.id ? { ...j, status: nuevo } : j))
        );

    }

    return (

        <div className="dashboard">

            <AdminSidebar />

            <main className="dashboard-content">

                <Box sx={{ maxWidth: 1200, py: 4, px: { xs: 2, md: 0 } }}>

                    <Typography variant="h4" fontWeight="bold" color="#0B1F3A">
                        Vacantes
                    </Typography>

                    <Typography color="text.secondary" mb={3}>
                        {jobs.length} vacante{jobs.length === 1 ? "" : "s"} en total
                        (de todas las empresas).
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    {loading && <Typography>Cargando…</Typography>}

                    {!loading && (

                        <Paper
                            elevation={0}
                            sx={{ borderRadius: 3, border: "1px solid #E6E8EC", overflowX: "auto" }}
                        >

                            <Table>

                                <TableHead>
                                    <TableRow>
                                        <TableCell
                                            sx={{
                                                position: "sticky",
                                                top: 0,
                                                left: 0,
                                                zIndex: 3,
                                                backgroundColor: "#fff",
                                            }}
                                        >
                                            <strong>Vacante</strong>
                                        </TableCell>
                                        <TableCell sx={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#fff" }}><strong>Empresa</strong></TableCell>
                                        <TableCell sx={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#fff" }}><strong>Estado</strong></TableCell>
                                        <TableCell sx={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#fff" }}><strong>Postulantes</strong></TableCell>
                                        <TableCell align="center" sx={{ position: "sticky", top: 0, zIndex: 2, backgroundColor: "#fff" }}><strong>Acciones</strong></TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>

                                    {jobs.map((job) => {

                                        const estado =
                                            ESTADO_CHIP[job.status] || ESTADO_CHIP.closed;

                                        return (

                                            <TableRow key={job.id}>

                                                <TableCell
                                                    sx={{
                                                        position: "sticky",
                                                        left: 0,
                                                        zIndex: 1,
                                                        backgroundColor: "inherit",
                                                    }}
                                                >
                                                    {job.title}
                                                </TableCell>

                                                <TableCell>{job.company_name}</TableCell>

                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        label={estado.label}
                                                        color={estado.color}
                                                    />
                                                </TableCell>

                                                <TableCell>{job.total_postulaciones}</TableCell>

                                                <TableCell align="center">
                                                    <Button
                                                        size="small"
                                                        color={job.status === "published" ? "error" : "success"}
                                                        disabled={busyId === job.id}
                                                        onClick={() => toggleStatus(job)}
                                                        sx={{ textTransform: "none" }}
                                                    >
                                                        {job.status === "published"
                                                            ? "Despublicar"
                                                            : "Publicar"}
                                                    </Button>
                                                </TableCell>

                                            </TableRow>

                                        );

                                    })}

                                    {jobs.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5}>
                                                <Typography color="text.secondary" sx={{ py: 3 }}>
                                                    Todavía no hay vacantes publicadas.
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

export default Jobs;
