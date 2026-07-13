import { useEffect, useState } from "react";

import "./../../styles/theme.css";
import "./../../styles/recruiter/layout/RecruiterDashboard.css";

import {
    Alert,
    Box,
    Button,
    Chip,
    MenuItem,
    Paper,
    TextField,
    Typography,
    IconButton,
} from "@mui/material";

import { DeleteOutline as DeleteIcon } from "@mui/icons-material";

import RecruiterSidebar from "../../components/recruiter/layout/RecruiterSidebar";

import {
    getMyCompanyContext,
    getTeamMembers,
    inviteMember,
    updateMemberRole,
    removeMember,
    puedeGestionarEquipo,
    puedeCrearVacantes,
    TEAM_ROLES,
    ROLE_LABELS,
} from "../../services/teamService";

import {
    updateCompanyLogo,
    updateCompanyName,
} from "../../services/companyService";
import { subirLogoEmpresa } from "../../services/storageService";

import { useAuth } from "../../context/AuthContext";

/*
  Configuracion — por ahora: el EQUIPO de la empresa.

  El dueño invita por correo y asigna roles. La persona invitada
  se registra en ChanceGT como empresa con ese mismo correo y su
  cuenta se conecta sola (sin claves compartidas ni magia).
*/

const ROLE_HELP = {
    dueno: "Todo, incluida la gestión del equipo",
    reclutador: "Vacantes, candidatos y entrevistas",
    observador: "Solo lectura: ve todo, no cambia nada",
};

function Settings() {

    const { user } = useAuth();

    const [company, setCompany] = useState(null);
    const [myRole, setMyRole] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("reclutador");
    const [sending, setSending] = useState(false);

    const [subiendoLogo, setSubiendoLogo] = useState(false);

    const [nombreEditado, setNombreEditado] = useState("");
    const [guardandoNombre, setGuardandoNombre] = useState(false);

    useEffect(() => {

        loadData();

    }, []);

    async function loadData() {

        setLoading(true);

        const { company: companyData, role } = await getMyCompanyContext();

        if (!companyData) {
            setLoading(false);
            return;
        }

        setCompany(companyData);
        setMyRole(role);
        setNombreEditado(companyData.company_name || "");

        const { data } = await getTeamMembers(companyData.id);

        setMembers(data || []);

        setLoading(false);

    }

    async function handleInvite() {

        const email = inviteEmail.trim().toLowerCase();

        if (!email || !email.includes("@")) {
            setMessage({
                type: "error",
                text: "Escribe un correo válido para invitar.",
            });
            return;
        }

        if (members.some((m) => m.email.toLowerCase() === email)) {
            setMessage({
                type: "error",
                text: "Ese correo ya está en el equipo.",
            });
            return;
        }

        setSending(true);
        setMessage(null);

        const { data, error } = await inviteMember(
            company.id,
            email,
            inviteRole
        );

        setSending(false);

        if (error) {
            setMessage({ type: "error", text: error.message });
            return;
        }

        setMembers((prev) => [...prev, data]);
        setInviteEmail("");

        setMessage({
            type: "success",
            text: `Invitación creada. Pide a ${email} que se registre en chancegt.com como EMPRESA con ese mismo correo: al entrar quedará conectado a ${company.company_name} automáticamente.`,
        });

    }

    async function handleRoleChange(member, role) {

        const { error } = await updateMemberRole(member.id, role);

        if (error) {
            setMessage({ type: "error", text: error.message });
            return;
        }

        setMembers((prev) =>
            prev.map((m) => (m.id === member.id ? { ...m, role } : m))
        );

    }

    async function handleRemove(member) {

        const seguro = window.confirm(
            member.status === "invitado"
                ? `¿Cancelar la invitación a ${member.email}?`
                : `¿Quitar a ${member.email} del equipo? Perderá el acceso al panel de ${company.company_name}.`
        );

        if (!seguro) return;

        const { error } = await removeMember(member.id);

        if (error) {
            setMessage({ type: "error", text: error.message });
            return;
        }

        setMembers((prev) => prev.filter((m) => m.id !== member.id));

    }

    async function handleSaveName() {

        const nombre = nombreEditado.trim();

        if (!nombre) {
            setMessage({
                type: "error",
                text: "El nombre de la empresa no puede quedar vacío.",
            });
            return;
        }

        if (nombre === company.company_name) return;

        setGuardandoNombre(true);
        setMessage(null);

        const { data, error } = await updateCompanyName(company.id, nombre);

        setGuardandoNombre(false);

        if (error) {
            setMessage({ type: "error", text: error.message });
            return;
        }

        setCompany(data);

        setMessage({
            type: "success",
            text: "Nombre de la empresa actualizado.",
        });

    }

    async function handleLogoChange(e) {

        const file = e.target.files?.[0];

        e.target.value = "";

        if (!file) return;

        setSubiendoLogo(true);
        setMessage(null);

        const { data, error } = await subirLogoEmpresa(company.id, file);

        if (error) {
            setSubiendoLogo(false);
            setMessage({ type: "error", text: error.message });
            return;
        }

        const { data: updated, error: updateError } =
            await updateCompanyLogo(company.id, data.url);

        setSubiendoLogo(false);

        if (updateError) {
            setMessage({ type: "error", text: updateError.message });
            return;
        }

        setCompany(updated);

        setMessage({
            type: "success",
            text: "Logo actualizado. Ya se muestra en tus vacantes publicadas.",
        });

    }

    const soyDueno = puedeGestionarEquipo(myRole);
    const puedeEditarLogo = puedeCrearVacantes(myRole);

    /* El dueño no se puede quitar ni degradar a sí mismo desde aquí */
    function esYo(member) {
        return member.user_id && member.user_id === user?.id;
    }

    return (

        <div className="dashboard">

            <RecruiterSidebar company={company} role={myRole} />

            <main className="dashboard-content">

                <Box sx={{ maxWidth: 860, py: 4, px: { xs: 2, md: 0 } }}>

                    <Typography variant="h4" fontWeight="bold" color="#0B1F3A">
                        Configuración
                    </Typography>

                    <Typography color="text.secondary" mb={4}>
                        El equipo que trabaja el panel de{" "}
                        {company?.company_name || "tu empresa"}.
                    </Typography>

                    {loading && <Typography>Cargando…</Typography>}

                    {!loading && (
                        <>

                            {message && (
                                <Alert
                                    severity={message.type}
                                    sx={{ mb: 3 }}
                                    onClose={() => setMessage(null)}
                                >
                                    {message.text}
                                </Alert>
                            )}

                            {/* ===== Nombre de la empresa ===== */}

                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    mb: 3,
                                    borderRadius: 3,
                                    border: "1px solid #E6E8EC",
                                }}
                            >

                                <Typography fontWeight="bold" mb={0.5}>
                                    Nombre de tu empresa
                                </Typography>

                                <Typography
                                    fontSize={13}
                                    color="text.secondary"
                                    mb={2}
                                >
                                    Es el nombre que ven los candidatos en
                                    tus vacantes publicadas.
                                </Typography>

                                {soyDueno ? (

                                    <Box
                                        sx={{
                                            display: "flex",
                                            gap: 2,
                                            flexWrap: "wrap",
                                            alignItems: "center",
                                        }}
                                    >

                                        <TextField
                                            value={nombreEditado}
                                            onChange={(e) =>
                                                setNombreEditado(
                                                    e.target.value
                                                )
                                            }
                                            size="small"
                                            sx={{ flex: 1, minWidth: 220 }}
                                        />

                                        <Button
                                            variant="contained"
                                            onClick={handleSaveName}
                                            disabled={
                                                guardandoNombre ||
                                                !nombreEditado.trim() ||
                                                nombreEditado.trim() ===
                                                    company?.company_name
                                            }
                                            sx={{
                                                background: "#0E8F73",
                                                textTransform: "none",
                                                fontWeight: 700,
                                                height: 40,
                                                "&:hover": {
                                                    background: "#0C7A62",
                                                },
                                            }}
                                        >

                                            {guardandoNombre
                                                ? "Guardando…"
                                                : "Guardar"}

                                        </Button>

                                    </Box>

                                ) : (

                                    <Typography
                                        fontSize={13}
                                        color="text.secondary"
                                    >
                                        Solo el dueño de la cuenta puede
                                        cambiar el nombre de la empresa.
                                        Nombre actual:{" "}
                                        <strong>
                                            {company?.company_name}
                                        </strong>
                                    </Typography>

                                )}

                            </Paper>

                            {/* ===== Logo ===== */}

                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    mb: 3,
                                    borderRadius: 3,
                                    border: "1px solid #E6E8EC",
                                }}
                            >

                                <Typography fontWeight="bold" mb={0.5}>
                                    Logo de tu empresa
                                </Typography>

                                <Typography
                                    fontSize={13}
                                    color="text.secondary"
                                    mb={2}
                                >
                                    Aparece automáticamente en todas tus
                                    vacantes publicadas y en tu panel.
                                    Recomendado: imagen cuadrada, mínimo
                                    400×400 px, fondo blanco o transparente,
                                    formato PNG, JPG o WEBP, máximo 2MB.
                                </Typography>

                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 2.5,
                                        flexWrap: "wrap",
                                    }}
                                >

                                    <Box
                                        sx={{
                                            width: 72,
                                            height: 72,
                                            borderRadius: 2,
                                            border: "1px solid #E6E8EC",
                                            background: "#F7F8FA",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            overflow: "hidden",
                                            flexShrink: 0,
                                        }}
                                    >

                                        {company?.logo ? (
                                            <img
                                                src={company.logo}
                                                alt="Logo actual"
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "contain",
                                                }}
                                            />
                                        ) : (
                                            <Typography
                                                fontSize={12}
                                                color="text.secondary"
                                                textAlign="center"
                                            >
                                                Sin logo
                                            </Typography>
                                        )}

                                    </Box>

                                    {puedeEditarLogo ? (

                                        <Button
                                            component="label"
                                            variant="outlined"
                                            disabled={subiendoLogo}
                                            sx={{ textTransform: "none" }}
                                        >

                                            {subiendoLogo
                                                ? "Subiendo…"
                                                : company?.logo
                                                    ? "Cambiar logo"
                                                    : "Subir logo"}

                                            <input
                                                type="file"
                                                hidden
                                                accept="image/png,image/jpeg,image/webp"
                                                onChange={handleLogoChange}
                                            />

                                        </Button>

                                    ) : (

                                        <Typography
                                            fontSize={13}
                                            color="text.secondary"
                                        >
                                            Solo el dueño o un reclutador
                                            pueden cambiar el logo.
                                        </Typography>

                                    )}

                                </Box>

                            </Paper>

                            {/* ===== Invitar ===== */}

                            {soyDueno && (

                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        mb: 3,
                                        borderRadius: 3,
                                        border: "1px solid #E6E8EC",
                                    }}
                                >

                                    <Typography fontWeight="bold" mb={0.5}>
                                        Invitar a alguien de tu equipo
                                    </Typography>

                                    <Typography
                                        color="text.secondary"
                                        fontSize={14}
                                        mb={2}
                                    >
                                        La persona se registra en chancegt.com
                                        como <strong>empresa</strong> con este
                                        mismo correo y entra directo a tu panel
                                        — sin compartir contraseñas.
                                    </Typography>

                                    <Box
                                        sx={{
                                            display: "flex",
                                            gap: 2,
                                            flexWrap: "wrap",
                                        }}
                                    >

                                        <TextField
                                            label="Correo"
                                            value={inviteEmail}
                                            onChange={(e) =>
                                                setInviteEmail(e.target.value)
                                            }
                                            size="small"
                                            sx={{ flex: 1, minWidth: 220 }}
                                            autoComplete="off"
                                        />

                                        <TextField
                                            select
                                            label="Rol"
                                            value={inviteRole}
                                            onChange={(e) =>
                                                setInviteRole(e.target.value)
                                            }
                                            size="small"
                                            sx={{ width: 180 }}
                                            helperText={ROLE_HELP[inviteRole]}
                                        >
                                            {TEAM_ROLES.filter(
                                                (r) => r.value !== "dueno"
                                            ).map((r) => (
                                                <MenuItem
                                                    key={r.value}
                                                    value={r.value}
                                                >
                                                    {r.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>

                                        <Button
                                            variant="contained"
                                            onClick={handleInvite}
                                            disabled={sending}
                                            sx={{
                                                background: "#0E8F73",
                                                textTransform: "none",
                                                fontWeight: 700,
                                                height: 40,
                                                "&:hover": {
                                                    background: "#0C7A62",
                                                },
                                            }}
                                        >
                                            {sending
                                                ? "Invitando…"
                                                : "Invitar"}
                                        </Button>

                                    </Box>

                                </Paper>

                            )}

                            {!soyDueno && (
                                <Alert severity="info" sx={{ mb: 3 }}>
                                    Solo el dueño de la cuenta puede invitar
                                    o cambiar roles. Tu rol actual:{" "}
                                    <strong>{ROLE_LABELS[myRole] || myRole}</strong>.
                                </Alert>
                            )}

                            {/* ===== Equipo ===== */}

                            <Paper
                                elevation={0}
                                sx={{
                                    borderRadius: 3,
                                    border: "1px solid #E6E8EC",
                                    overflow: "hidden",
                                }}
                            >

                                {members.map((member, i) => (

                                    <Box
                                        key={member.id}
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 2,
                                            flexWrap: "wrap",
                                            p: 2.5,
                                            borderTop: i > 0
                                                ? "1px solid #EFF1F4"
                                                : "none",
                                        }}
                                    >

                                        <Box sx={{ flex: 1, minWidth: 200 }}>

                                            <Typography fontWeight={600}>
                                                {member.email}
                                                {esYo(member) && " (tú)"}
                                            </Typography>

                                            <Typography
                                                fontSize={13}
                                                color="text.secondary"
                                            >
                                                {ROLE_HELP[member.role]}
                                            </Typography>

                                        </Box>

                                        <Chip
                                            size="small"
                                            label={
                                                member.status === "invitado"
                                                    ? "Invitación pendiente"
                                                    : "Activo"
                                            }
                                            sx={
                                                member.status === "invitado"
                                                    ? {
                                                        background: "#FFF4E0",
                                                        color: "#9A6B00",
                                                    }
                                                    : {
                                                        background: "#E4F5F0",
                                                        color: "#0E8F73",
                                                    }
                                            }
                                        />

                                        {soyDueno &&
                                            !esYo(member) &&
                                            member.role !== "dueno" ? (
                                            <TextField
                                                select
                                                size="small"
                                                value={member.role}
                                                onChange={(e) =>
                                                    handleRoleChange(
                                                        member,
                                                        e.target.value
                                                    )
                                                }
                                                sx={{ width: 160 }}
                                            >
                                                {TEAM_ROLES.filter(
                                                    (r) => r.value !== "dueno"
                                                ).map((r) => (
                                                    <MenuItem
                                                        key={r.value}
                                                        value={r.value}
                                                    >
                                                        {r.label}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        ) : (
                                            <Chip
                                                size="small"
                                                variant="outlined"
                                                label={
                                                    ROLE_LABELS[member.role] ||
                                                    member.role
                                                }
                                            />
                                        )}

                                        {soyDueno &&
                                            !esYo(member) &&
                                            member.role !== "dueno" && (
                                            <IconButton
                                                aria-label="Quitar del equipo"
                                                onClick={() =>
                                                    handleRemove(member)
                                                }
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        )}

                                    </Box>

                                ))}

                                {members.length === 0 && (
                                    <Typography sx={{ p: 3 }}>
                                        Aún no hay miembros registrados.
                                    </Typography>
                                )}

                            </Paper>

                        </>
                    )}

                </Box>

            </main>

        </div>

    );

}

export default Settings;
