import { useEffect, useMemo, useState } from "react";

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

import RecruiterSidebar from "../../components/recruiter/layout/RecruiterSidebar";

import {
    getMyCompanyContext,
    puedeGestionarCandidatos,
} from "../../services/teamService";

import {
    getCompanyInterviews,
    updateInterview,
    esHoy,
} from "../../services/interviewService";

/*
  Agenda de entrevistas de la empresa.

  Tres bloques: HOY, PROXIMAS y PASADAS. Cada entrevista muestra
  candidato, vacante, fecha/hora, modalidad, lugar/enlace y notas
  internas. Dueño y reclutador marcan Realizada / Cancelada y
  editan notas; el observador solo mira.
*/

function nombreCandidato(profile) {

    if (!profile) return "Candidato";

    return [profile.first_name, profile.last_name]
        .filter(Boolean)
        .join(" ") || "Candidato";

}

function fechaBonita(iso) {

    return new Date(iso).toLocaleString("es-GT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
    });

}

const ESTADO_CHIP = {
    programada: { label: "Programada", bg: "#E8F0FE", color: "#1A4B9B" },
    realizada: { label: "Realizada", bg: "#E4F5F0", color: "#0E8F73" },
    cancelada: { label: "Cancelada", bg: "#FDECEC", color: "#B3261E" },
};

function Interviews() {

    const [company, setCompany] = useState(null);
    const [myRole, setMyRole] = useState(null);
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    /* Edicion de notas: id de la entrevista abierta y su borrador */
    const [notesId, setNotesId] = useState(null);
    const [notesDraft, setNotesDraft] = useState("");

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

        const { data, error } = await getCompanyInterviews(companyData.id);

        if (error) {
            setMessage({ type: "error", text: error.message });
        }

        setInterviews(data || []);

        setLoading(false);

    }

    async function handleStatus(interview, status) {

        const { error } = await updateInterview(interview.id, { status });

        if (error) {
            setMessage({ type: "error", text: error.message });
            return;
        }

        setInterviews((prev) =>
            prev.map((i) =>
                i.id === interview.id ? { ...i, status } : i
            )
        );

    }

    async function handleSaveNotes(interview) {

        const { error } = await updateInterview(interview.id, {
            notes: notesDraft || null,
        });

        if (error) {
            setMessage({ type: "error", text: error.message });
            return;
        }

        setInterviews((prev) =>
            prev.map((i) =>
                i.id === interview.id ? { ...i, notes: notesDraft } : i
            )
        );

        setNotesId(null);

    }

    const puedeEditar = puedeGestionarCandidatos(myRole);

    /* Hoy / proximas / pasadas (canceladas van a pasadas) */
    const grupos = useMemo(() => {

        const ahora = new Date();

        const hoy = [];
        const proximas = [];
        const pasadas = [];

        interviews.forEach((i) => {

            const fecha = new Date(i.scheduled_at);

            if (i.status !== "programada") {
                pasadas.push(i);
            } else if (esHoy(i.scheduled_at)) {
                hoy.push(i);
            } else if (fecha > ahora) {
                proximas.push(i);
            } else {
                pasadas.push(i);
            }

        });

        /* Pasadas: de la mas reciente a la mas vieja */
        pasadas.sort(
            (a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at)
        );

        return { hoy, proximas, pasadas };

    }, [interviews]);

    function TarjetaEntrevista({ interview }) {

        const app = interview.applications;
        const estado = ESTADO_CHIP[interview.status] || ESTADO_CHIP.programada;

        return (

            <Paper
                elevation={0}
                sx={{
                    p: 2.5,
                    mb: 2,
                    borderRadius: 3,
                    border: "1px solid #E6E8EC",
                }}
            >

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 2,
                        flexWrap: "wrap",
                    }}
                >

                    <Box sx={{ flex: 1, minWidth: 240 }}>

                        <Typography fontWeight={700} color="#0B1F3A">
                            {nombreCandidato(app?.candidate_profiles)}
                            {app?.candidate_profiles?.profession &&
                                ` · ${app.candidate_profiles.profession}`}
                        </Typography>

                        <Typography fontSize={14} color="text.secondary">
                            Vacante: {app?.jobs?.title || "—"}
                        </Typography>

                        <Typography fontSize={14} sx={{ mt: 0.5 }}>
                            🗓 {fechaBonita(interview.scheduled_at)}
                            {" · "}{interview.modality}
                        </Typography>

                        {interview.location_or_link && (
                            <Typography fontSize={14} color="text.secondary">
                                {interview.modality === "Virtual"
                                    ? "Enlace: "
                                    : interview.modality === "Telefónica"
                                        ? "Teléfono: "
                                        : "Lugar: "}
                                {interview.location_or_link}
                            </Typography>
                        )}

                        {app?.candidate_profiles?.phone && (
                            <Typography fontSize={14} color="text.secondary">
                                Contacto del candidato:{" "}
                                {app.candidate_profiles.phone}
                            </Typography>
                        )}

                    </Box>

                    <Chip
                        size="small"
                        label={estado.label}
                        sx={{ background: estado.bg, color: estado.color }}
                    />

                </Box>

                {/* Notas internas */}

                {notesId === interview.id ? (

                    <Box sx={{ mt: 2 }}>

                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            size="small"
                            label="Notas internas (el candidato no las ve)"
                            value={notesDraft}
                            onChange={(e) => setNotesDraft(e.target.value)}
                        />

                        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>

                            <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleSaveNotes(interview)}
                                sx={{
                                    background: "#0E8F73",
                                    textTransform: "none",
                                    "&:hover": { background: "#0C7A62" },
                                }}
                            >
                                Guardar notas
                            </Button>

                            <Button
                                size="small"
                                onClick={() => setNotesId(null)}
                                sx={{ textTransform: "none" }}
                            >
                                Cancelar
                            </Button>

                        </Box>

                    </Box>

                ) : (

                    interview.notes && (
                        <Typography
                            fontSize={14}
                            sx={{
                                mt: 1.5,
                                p: 1.5,
                                background: "#F7F8FA",
                                borderRadius: 2,
                                whiteSpace: "pre-line",
                            }}
                        >
                            📝 {interview.notes}
                        </Typography>
                    )

                )}

                {/* Acciones */}

                {puedeEditar && notesId !== interview.id && (

                    <Box
                        sx={{
                            display: "flex",
                            gap: 1,
                            mt: 2,
                            flexWrap: "wrap",
                        }}
                    >

                        {interview.status === "programada" && (
                            <>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() =>
                                        handleStatus(interview, "realizada")
                                    }
                                    sx={{ textTransform: "none" }}
                                >
                                    ✓ Marcar realizada
                                </Button>

                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={() =>
                                        handleStatus(interview, "cancelada")
                                    }
                                    sx={{ textTransform: "none" }}
                                >
                                    Cancelar entrevista
                                </Button>
                            </>
                        )}

                        <Button
                            size="small"
                            onClick={() => {
                                setNotesId(interview.id);
                                setNotesDraft(interview.notes || "");
                            }}
                            sx={{ textTransform: "none" }}
                        >
                            {interview.notes
                                ? "Editar notas"
                                : "Agregar notas"}
                        </Button>

                    </Box>

                )}

            </Paper>

        );

    }

    function Bloque({ titulo, lista, vacio }) {

        return (

            <Box sx={{ mb: 4 }}>

                <Typography
                    variant="h6"
                    fontWeight="bold"
                    color="#0B1F3A"
                    mb={1.5}
                >
                    {titulo}
                    {lista.length > 0 && ` (${lista.length})`}
                </Typography>

                {lista.length === 0 ? (
                    <Typography color="text.secondary" fontSize={14}>
                        {vacio}
                    </Typography>
                ) : (
                    lista.map((i) => (
                        <TarjetaEntrevista key={i.id} interview={i} />
                    ))
                )}

            </Box>

        );

    }

    return (

        <div className="dashboard">

            <RecruiterSidebar company={company} role={myRole} />

            <main className="dashboard-content">

                <Box sx={{ maxWidth: 860, py: 4, px: { xs: 2, md: 0 } }}>

                    <Typography variant="h4" fontWeight="bold" color="#0B1F3A">
                        Entrevistas
                    </Typography>

                    <Typography color="text.secondary" mb={4}>
                        Se agendan desde la página de Candidatos. Cada
                        entrevista suma un paso real al proceso del
                        candidato y le avisa por correo.
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

                    {loading && <Typography>Cargando agenda…</Typography>}

                    {!loading && (
                        <>
                            <Bloque
                                titulo="Hoy"
                                lista={grupos.hoy}
                                vacio="No tienes entrevistas hoy."
                            />

                            <Bloque
                                titulo="Próximas"
                                lista={grupos.proximas}
                                vacio="Nada agendado. Ve a Candidatos y usa «Agendar entrevista»."
                            />

                            <Bloque
                                titulo="Pasadas"
                                lista={grupos.pasadas}
                                vacio="Aún no hay entrevistas realizadas o canceladas."
                            />
                        </>
                    )}

                </Box>

            </main>

        </div>

    );

}

export default Interviews;
