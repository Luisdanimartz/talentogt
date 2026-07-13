import { useEffect, useState } from "react";

import "./../../styles/theme.css";
import "./../../styles/recruiter/layout/RecruiterDashboard.css";

import {
    Alert,
    Box,
    Button,
    List,
    ListItem,
    ListItemText,
    Paper,
    TextField,
    Typography,
} from "@mui/material";

import AdminSidebar from "../../components/admin/AdminSidebar";
import { useAuth } from "../../context/AuthContext";

import {
    getAdminList,
    setRoleByEmail,
} from "../../services/adminService";

function Settings() {

    const { user } = useAuth();

    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {

        cargar();

    }, []);

    async function cargar() {

        setLoading(true);

        const { data, error } = await getAdminList();

        if (error) {
            setMessage({ type: "error", text: error.message });
        }

        setAdmins(data || []);
        setLoading(false);

    }

    async function handlePromote() {

        if (!email.trim()) return;

        setSaving(true);
        setMessage(null);

        const { error } = await setRoleByEmail(email.trim(), "admin");

        setSaving(false);

        if (error) {
            setMessage({ type: "error", text: error.message });
            return;
        }

        setMessage({
            type: "success",
            text: `${email} ahora es administrador de ChanceGT.`,
        });

        setEmail("");
        cargar();

    }

    async function handleDemote(admin) {

        if (admin.user_id === user?.id) {
            setMessage({
                type: "error",
                text: "No puedes quitarte el rol de administrador a ti mismo desde aquí.",
            });
            return;
        }

        if (
            !window.confirm(
                `¿Quitar el acceso de administrador a ${admin.email}? Pasará a ser candidato.`
            )
        ) {
            return;
        }

        setSaving(true);

        const { error } = await setRoleByEmail(admin.email, "candidato");

        setSaving(false);

        if (error) {
            setMessage({ type: "error", text: error.message });
            return;
        }

        cargar();

    }

    return (

        <div className="dashboard">

            <AdminSidebar />

            <main className="dashboard-content">

                <Box sx={{ maxWidth: 700, py: 4, px: { xs: 2, md: 0 } }}>

                    <Typography variant="h4" fontWeight="bold" color="#0B1F3A">
                        Configuración
                    </Typography>

                    <Typography color="text.secondary" mb={4}>
                        Quién más tiene acceso al panel de administrador.
                    </Typography>

                    {message && (
                        <Alert
                            severity={message.type}
                            sx={{ mb: 3 }}
                            onClose={() => setMessage(null)}
                        >
                            {message.text}
                        </Alert>
                    )}

                    <Paper
                        elevation={0}
                        sx={{ p: 3, mb: 3, borderRadius: 3, border: "1px solid #E6E8EC" }}
                    >

                        <Typography variant="h6" fontWeight="bold" color="#0B1F3A" mb={1}>
                            Dar acceso de administrador
                        </Typography>

                        <Typography fontSize={14} color="text.secondary" mb={2}>
                            La persona debe tener ya una cuenta creada en ChanceGT
                            (como candidato o empresa) con ese correo.
                        </Typography>

                        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>

                            <TextField
                                size="small"
                                placeholder="correo@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                sx={{ flex: 1, minWidth: 240 }}
                            />

                            <Button
                                variant="contained"
                                disabled={saving || !email.trim()}
                                onClick={handlePromote}
                                sx={{ textTransform: "none", background: "#0E8F73" }}
                            >
                                Dar acceso
                            </Button>

                        </Box>

                    </Paper>

                    <Paper
                        elevation={0}
                        sx={{ borderRadius: 3, border: "1px solid #E6E8EC" }}
                    >

                        <Typography variant="h6" fontWeight="bold" color="#0B1F3A" sx={{ p: 3, pb: 1 }}>
                            Administradores actuales
                        </Typography>

                        {loading && (
                            <Typography sx={{ px: 3, pb: 3 }}>Cargando…</Typography>
                        )}

                        {!loading && (

                            <List>

                                {admins.map((a) => (

                                    <ListItem
                                        key={a.user_id}
                                        divider
                                        secondaryAction={
                                            <Button
                                                size="small"
                                                color="error"
                                                disabled={saving}
                                                onClick={() => handleDemote(a)}
                                                sx={{ textTransform: "none" }}
                                            >
                                                Quitar acceso
                                            </Button>
                                        }
                                    >

                                        <ListItemText
                                            primary={
                                                [a.first_name, a.last_name]
                                                    .filter(Boolean)
                                                    .join(" ") || a.email
                                            }
                                            secondary={a.email}
                                        />

                                    </ListItem>

                                ))}

                                {admins.length === 0 && (
                                    <Typography color="text.secondary" sx={{ px: 3, pb: 3 }}>
                                        No hay administradores registrados.
                                    </Typography>
                                )}

                            </List>

                        )}

                    </Paper>

                </Box>

            </main>

        </div>

    );

}

export default Settings;
