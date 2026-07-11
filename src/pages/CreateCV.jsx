import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Divider,
  LinearProgress,
  Chip,
  Alert,
} from "@mui/material";

import { useAuth } from "../context/AuthContext";

import {
  getCurrentCandidateProfile,
  saveCandidateProfile,
} from "../services/candidateService";

import {
  getDepartments,
  getMunicipalitiesByDepartment,
} from "../services/locationService";

/*
  Perfil del candidato — conectado a candidate_profiles.

  Solo incluye los campos que existen como columnas reales.
  Formación, experiencia y habilidades quedan marcadas como
  "Próximamente" hasta que creemos sus tablas.
*/

const initialForm = {
  first_name: "",
  middle_name: "",
  last_name: "",
  second_last_name: "",
  phone: "",
  dpi: "",
  profession: "",
  department: "",
  municipality: "",
  address: "",
  birth_date: "",
};

/* Campos que cuentan para la barra de "perfil completado" */
const PROGRESS_FIELDS = [
  "first_name",
  "last_name",
  "phone",
  "profession",
  "department",
  "municipality",
  "birth_date",
];

function CreateCV() {

  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [departments, setDepartments] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {

    loadData();

  }, []);

  useEffect(() => {

    loadMunicipalities(form.department);

  }, [form.department, departments]);

  async function loadData() {

    const [profileRes, departmentsRes] = await Promise.all([
      getCurrentCandidateProfile(),
      getDepartments(),
    ]);

    setDepartments(departmentsRes.data || []);

    if (profileRes.data) {

      setForm({
        ...initialForm,
        ...Object.fromEntries(
          Object.entries(profileRes.data).filter(
            ([key]) => key in initialForm
          )
        ),
        birth_date: profileRes.data.birth_date || "",
      });

    }

    setLoading(false);

  }

  /*
    candidate_profiles guarda department y municipality como TEXTO
    (el nombre), así que buscamos el id del departamento elegido
    solo para poder cargar sus municipios.
  */
  async function loadMunicipalities(departmentName) {

    const dept = departments.find((d) => d.name === departmentName);

    if (!dept) {
      setMunicipalities([]);
      return;
    }

    const { data } = await getMunicipalitiesByDepartment(dept.id);

    setMunicipalities(data || []);

  }

  function handleChange(e) {

    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "department" ? { municipality: "" } : {}),
    }));

  }

  const progress = useMemo(() => {

    const filled = PROGRESS_FIELDS.filter(
      (field) => String(form[field] || "").trim() !== ""
    ).length;

    return Math.round((filled / PROGRESS_FIELDS.length) * 100);

  }, [form]);

  async function handleSave() {

    if (!form.first_name.trim() || !form.last_name.trim()) {
      setMessage({
        type: "error",
        text: "Nombres y primer apellido son obligatorios.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    const { error } = await saveCandidateProfile(form);

    setSaving(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setMessage({
      type: "success",
      text: "Perfil guardado. Ya puedes postularte a vacantes.",
    });

  }

  if (loading) {
    return (
      <Box sx={{ maxWidth: 1200, margin: "0 auto", px: 3, pt: "120px", pb: 6 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: "0 auto", px: 3, pt: "120px", pb: 6 }}>
      <Paper elevation={3} sx={{ p: 5, borderRadius: 4 }}>

        <Typography variant="h4" fontWeight="bold">
          Mi Perfil Profesional
        </Typography>

        <Typography color="text.secondary" mb={4}>
          Completa tu información para poder postularte a vacantes.
        </Typography>

        <Divider sx={{ mb: 4 }} />

        <Typography variant="h6" fontWeight="bold" mb={3}>
          Información Personal
        </Typography>

        <Grid container spacing={3}>

          <Grid item xs={12} md={6}>
            <TextField
              label="Nombres"
              name="first_name"
              autoComplete="given-name"
              value={form.first_name}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Segundo nombre (opcional)"
              name="middle_name"
              autoComplete="additional-name"
              value={form.middle_name}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Primer apellido"
              name="last_name"
              autoComplete="family-name"
              value={form.last_name}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Segundo apellido (opcional)"
              name="second_last_name"
              autoComplete="off"
              value={form.second_last_name}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Correo electrónico"
              value={user?.email || ""}
              fullWidth
              disabled
              helperText="Es el correo de tu cuenta"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Teléfono"
              name="phone"
              autoComplete="tel"
              value={form.phone}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="DPI (opcional)"
              name="dpi"
              autoComplete="off"
              value={form.dpi}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Fecha de nacimiento"
              name="birth_date"
              type="date"
              value={form.birth_date}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              label="Departamento"
              name="department"
              value={form.department}
              onChange={handleChange}
              fullWidth
            >
              {departments.map((item) => (
                <MenuItem key={item.id} value={item.name}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              label="Municipio"
              name="municipality"
              value={form.municipality}
              onChange={handleChange}
              fullWidth
              disabled={!form.department}
            >
              {municipalities.map((item) => (
                <MenuItem key={item.id} value={item.name}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Dirección (opcional)"
              name="address"
              autoComplete="street-address"
              value={form.address}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Profesión u oficio"
              name="profession"
              autoComplete="off"
              value={form.profession}
              onChange={handleChange}
              fullWidth
              placeholder="Ejemplo: Perito Contador, Vendedor, Ingeniera en Sistemas"
            />
          </Grid>

        </Grid>

        <Divider sx={{ my: 5 }} />

        <Typography variant="h6" fontWeight="bold" mb={1}>
          Formación, Experiencia y Habilidades{" "}
          <Chip label="Próximamente" size="small" sx={{ ml: 1 }} />
        </Typography>

        <Typography color="text.secondary" mb={2}>
          Estas secciones se activarán en una próxima versión.
          Por ahora, tu profesión y datos de contacto son
          suficientes para postularte.
        </Typography>

        <Divider sx={{ my: 5 }} />

        <Typography fontWeight="bold" mb={1}>
          Perfil completado {progress}%
        </Typography>

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 10, borderRadius: 5, mb: 3 }}
        />

        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
          }}
        >

          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate("/candidato/dashboard")}
          >
            Volver a mi panel
          </Button>

          <Button
            variant="contained"
            size="large"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar perfil"}
          </Button>

        </Box>

      </Paper>
    </Box>
  );
}

export default CreateCV;
