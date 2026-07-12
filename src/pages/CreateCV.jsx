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
  IconButton,
  Divider,
  LinearProgress,
  Alert,
  Chip,
  InputAdornment,
} from "@mui/material";

import {
  Add as AddIcon,
  DeleteOutline as DeleteIcon,
} from "@mui/icons-material";

import { useAuth } from "../context/AuthContext";

import {
  getCurrentCandidateProfile,
  saveCandidateProfile,
} from "../services/candidateService";

import {
  getDepartments,
  getMunicipalitiesByDepartment,
} from "../services/locationService";

import { getEducationLevels } from "../services/jobService";

import { formatMiles, salarioANumero } from "../utils/formatSalary";
import { toTitleCase } from "../utils/textFormat";

/*
  Perfil del candidato — su CV en ChanceGT.

  Formacion: hasta 4 entradas (nivel, centro, año).
  Experiencia: hasta 5 entradas (cargo, empresa, años).
  Todo se guarda en tablas reales (candidate_education y
  candidate_experience) y alimenta el motor de coincidencias.
*/

const MAX_EDUCATION = 4;
const MAX_EXPERIENCE = 5;

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
  skills: "",
  summary: "",
  linkedin: "",
  availability: "",
  expected_salary: "",
};

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DIAS = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);

/* Del mas reciente al mas antiguo: llegar a 1987 toma un toque */
const ANIOS = Array.from({ length: 76 }, (_, i) => 2012 - i);

/* Sugerencias de habilidades: un toque y listo */
const SKILL_SUGGESTIONS = [
  "Ventas", "Atención al cliente", "Servicio al cliente", "Excel",
  "Word", "SAP", "Caja", "Inventarios", "Bodega", "Logística",
  "Manejo de personal", "Liderazgo", "Cobros", "Facturación",
  "Contabilidad", "Marketing digital", "Redes sociales", "Inglés",
  "Computación", "Call center", "Digitación", "Negociación",
  "Trabajo en equipo", "Mecánica", "Electricidad", "Cocina",
  "Repostería", "Licencia de conducir", "Seguridad", "Limpieza",
];

const emptyEducation = { level: "", institution: "", graduation_year: "" };
const emptyExperience = { job_title: "", company: "", years: "", period: "", description: "" };

function CreateCV() {

  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [education, setEducation] = useState([{ ...emptyEducation }]);
  const [experience, setExperience] = useState([{ ...emptyExperience }]);

  const [departments, setDepartments] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [educationLevels, setEducationLevels] = useState([]);

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

    const [profileRes, departmentsRes, educationRes] =
      await Promise.all([
        getCurrentCandidateProfile(),
        getDepartments(),
        getEducationLevels(),
      ]);

    setDepartments(departmentsRes.data || []);
    setEducationLevels(educationRes.data || []);

    const profile = profileRes.data;

    if (profile) {

      setForm({
        ...initialForm,
        ...Object.fromEntries(
          Object.entries(profile).filter(
            ([key]) => key in initialForm
          )
        ),
        birth_date: profile.birth_date || "",
        expected_salary: profile.expected_salary
          ? formatMiles(profile.expected_salary)
          : "",
      });

      /* Listas guardadas; si no hay, precargar desde los
         campos viejos (perfiles creados antes del 004) */
      if (profile.candidate_education?.length > 0) {
        setEducation(profile.candidate_education);
      } else if (profile.education_level) {
        setEducation([{
          level: profile.education_level,
          institution: profile.education_institution || "",
          graduation_year: profile.education_year || "",
        }]);
      }

      if (profile.candidate_experience?.length > 0) {
        setExperience(profile.candidate_experience);
      }

    }

    setLoading(false);

  }

  async function loadMunicipalities(departmentName) {

    const dept = departments.find((d) => d.name === departmentName);

    if (!dept) {
      setMunicipalities([]);
      return;
    }

    const { data } = await getMunicipalitiesByDepartment(dept.id);

    setMunicipalities(data || []);

  }

  /* Fecha de nacimiento en tres partes (dia, mes, año) */
  const [birthParts, setBirthParts] = useState({
    day: "", month: "", year: "",
  });

  useEffect(() => {

    if (form.birth_date) {
      const [year, month, day] = form.birth_date.split("-");
      setBirthParts({ day: day || "", month: month || "", year: year || "" });
    }

  }, [loading]);

  function updateBirth(part, value) {

    const next = { ...birthParts, [part]: value };

    setBirthParts(next);

    if (next.day && next.month && next.year) {
      setForm((prev) => ({
        ...prev,
        birth_date: `${next.year}-${next.month}-${next.day}`,
      }));
    }

  }

  /* Sugerencia de habilidad: click agrega, click quita */
  function toggleSkill(skill) {

    const actuales = (form.skills || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const existe = actuales.some(
      (s) => s.toLowerCase() === skill.toLowerCase()
    );

    const nuevas = existe
      ? actuales.filter((s) => s.toLowerCase() !== skill.toLowerCase())
      : [...actuales, skill];

    setForm((prev) => ({ ...prev, skills: nuevas.join(", ") }));

  }

  function handleChange(e) {

    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "department" ? { municipality: "" } : {}),
    }));

  }

  /* --- Listas dinámicas --- */

  function updateEducation(index, field, value) {

    setEducation((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );

  }

  function updateExperience(index, field, value) {

    setExperience((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );

  }

  const progress = useMemo(() => {

    const basicos = [
      "first_name",
      "last_name",
      "phone",
      "profession",
      "department",
      "municipality",
      "birth_date",
      "skills",
      "expected_salary",
    ].filter((field) => String(form[field] || "").trim() !== "").length;

    const tieneFormacion = education.some(
      (edu) => edu.level || edu.institution
    ) ? 1 : 0;

    const tieneExperiencia = experience.some(
      (exp) => exp.job_title || exp.company
    ) ? 1 : 0;

    return Math.round(((basicos + tieneFormacion + tieneExperiencia) / 11) * 100);

  }, [form, education, experience]);

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

    const { error } = await saveCandidateProfile(
      {
        ...form,
        expected_salary: salarioANumero(form.expected_salary),
      },
      education,
      experience
    );

    setSaving(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setMessage({
      type: "success",
      text: "Perfil guardado. Tus coincidencias con las vacantes ya usan esta información.",
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
          Este es tu CV en ChanceGT. Mientras más completo, mejores
          coincidencias con las vacantes.
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

            <Grid container spacing={1}>

              <Grid item xs={4}>
                <TextField
                  select
                  label="Día"
                  value={birthParts.day}
                  onChange={(e) => updateBirth("day", e.target.value)}
                  fullWidth
                >
                  {DIAS.map((d) => (
                    <MenuItem key={d} value={d}>{d}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={4}>
                <TextField
                  select
                  label="Mes"
                  value={birthParts.month}
                  onChange={(e) => updateBirth("month", e.target.value)}
                  fullWidth
                >
                  {MESES.map((m, i) => (
                    <MenuItem key={m} value={String(i + 1).padStart(2, "0")}>
                      {m}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={4}>
                <TextField
                  select
                  label="Año"
                  value={birthParts.year}
                  onChange={(e) => updateBirth("year", e.target.value)}
                  fullWidth
                >
                  {ANIOS.map((a) => (
                    <MenuItem key={a} value={String(a)}>{a}</MenuItem>
                  ))}
                </TextField>
              </Grid>

            </Grid>

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
                <MenuItem key={item.id} value={toTitleCase(item.name)}>
                  {toTitleCase(item.name)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Dirección (opcional)"
              name="address"
              autoComplete="street-address"
              value={form.address}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Profesión u oficio"
              name="profession"
              autoComplete="off"
              value={form.profession}
              onChange={handleChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Pretensión salarial mensual"
              name="expected_salary"
              autoComplete="off"
              value={form.expected_salary}
              onChange={(e) =>
                handleChange({
                  target: {
                    name: "expected_salary",
                    value: formatMiles(e.target.value),
                  },
                })
              }
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">Q</InputAdornment>
                ),
              }}
              helperText="Se compara con el salario de cada vacante"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="LinkedIn (opcional)"
              name="linkedin"
              autoComplete="off"
              value={form.linkedin}
              onChange={handleChange}
              fullWidth
              helperText="Pega el enlace a tu perfil"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Disponibilidad"
              name="availability"
              value={form.availability}
              onChange={handleChange}
              fullWidth
            >
              <MenuItem value="Disponibilidad inmediata">
                Disponibilidad inmediata
              </MenuItem>
              <MenuItem value="Disponible en 15 días">
                Disponible en 15 días
              </MenuItem>
              <MenuItem value="Disponible en 1 mes">
                Disponible en 1 mes
              </MenuItem>
            </TextField>
          </Grid>

        </Grid>

        <Divider sx={{ my: 5 }} />

        <Typography variant="h6" fontWeight="bold" mb={1}>
          Perfil Profesional
        </Typography>

        <Typography color="text.secondary" mb={2}>
          El párrafo que abre tu CV: quién eres, tus años de
          experiencia y tus fortalezas. Usa palabras clave de tu
          sector — también cuentan para tus coincidencias.
        </Typography>

        <TextField
          label="Resumen profesional"
          name="summary"
          value={form.summary}
          onChange={handleChange}
          multiline
          rows={4}
          fullWidth
        />

        <Divider sx={{ my: 5 }} />

        {/* ================= FORMACIÓN ================= */}

        <Typography variant="h6" fontWeight="bold" mb={1}>
          Formación Académica
        </Typography>

        <Typography color="text.secondary" mb={3}>
          Agrega hasta {MAX_EDUCATION} estudios, del más reciente al
          más antiguo.
        </Typography>

        {education.map((edu, index) => (

          <Grid
            container
            spacing={2}
            key={index}
            alignItems="center"
            sx={{ mb: 2 }}
          >

            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Nivel académico"
                value={edu.level || ""}
                onChange={(e) =>
                  updateEducation(index, "level", e.target.value)
                }
                fullWidth
              >
                {educationLevels.map((item) => (
                  <MenuItem key={item.id} value={item.name}>
                    {item.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Centro de estudios"
                value={edu.institution || ""}
                onChange={(e) =>
                  updateEducation(index, "institution", e.target.value)
                }
                fullWidth
                autoComplete="off"
              />
            </Grid>

            <Grid item xs={8} md={3}>
              <TextField
                label="Año de graduación"
                value={edu.graduation_year || ""}
                onChange={(e) =>
                  updateEducation(index, "graduation_year", e.target.value)
                }
                fullWidth
                autoComplete="off"
              />
            </Grid>

            <Grid item xs={4} md={1}>
              {education.length > 1 && (
                <IconButton
                  aria-label="Quitar formación"
                  onClick={() =>
                    setEducation((prev) =>
                      prev.filter((_, i) => i !== index)
                    )
                  }
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Grid>

          </Grid>

        ))}

        {education.length < MAX_EDUCATION && (
          <Button
            startIcon={<AddIcon />}
            onClick={() =>
              setEducation((prev) => [...prev, { ...emptyEducation }])
            }
          >
            Agregar formación
          </Button>
        )}

        <Divider sx={{ my: 5 }} />

        {/* ================= EXPERIENCIA ================= */}

        <Typography variant="h6" fontWeight="bold" mb={1}>
          Experiencia Laboral
        </Typography>

        <Typography color="text.secondary" mb={3}>
          Como en tu CV: cargo, empresa y años laborados. Del más
          reciente al más antiguo (hasta {MAX_EXPERIENCE}).
        </Typography>

        {experience.map((exp, index) => (

          <Grid
            container
            spacing={2}
            key={index}
            alignItems="center"
            sx={{ mb: 2 }}
          >

            <Grid item xs={12} md={4}>
              <TextField
                label="Cargo"
                value={exp.job_title || ""}
                onChange={(e) =>
                  updateExperience(index, "job_title", e.target.value)
                }
                fullWidth
                autoComplete="off"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Empresa"
                value={exp.company || ""}
                onChange={(e) =>
                  updateExperience(index, "company", e.target.value)
                }
                fullWidth
                autoComplete="off"
              />
            </Grid>

            <Grid item xs={8} md={3}>
              <TextField
                label="Años laborados"
                value={exp.years || ""}
                onChange={(e) =>
                  updateExperience(index, "years", e.target.value)
                }
                fullWidth
                autoComplete="off"
              />
            </Grid>

            <Grid item xs={12} md={5}>
              <TextField
                label="Período (opcional)"
                value={exp.period || ""}
                onChange={(e) =>
                  updateExperience(index, "period", e.target.value)
                }
                fullWidth
                autoComplete="off"
                helperText="Ejemplo: Junio 2024 – Junio 2026"
              />
            </Grid>

            <Grid item xs={12} md={7}>
              <TextField
                label="Logros principales (uno por línea)"
                value={exp.description || ""}
                onChange={(e) =>
                  updateExperience(index, "description", e.target.value)
                }
                fullWidth
                multiline
                rows={3}
                autoComplete="off"
                helperText="Se convierten en viñetas de tu CV"
              />
            </Grid>

            <Grid item xs={4} md={1}>
              {experience.length > 1 && (
                <IconButton
                  aria-label="Quitar experiencia"
                  onClick={() =>
                    setExperience((prev) =>
                      prev.filter((_, i) => i !== index)
                    )
                  }
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Grid>

          </Grid>

        ))}

        {experience.length < MAX_EXPERIENCE && (
          <Button
            startIcon={<AddIcon />}
            onClick={() =>
              setExperience((prev) => [...prev, { ...emptyExperience }])
            }
          >
            Agregar experiencia
          </Button>
        )}

        <Divider sx={{ my: 5 }} />

        {/* ================= HABILIDADES ================= */}

        <Typography variant="h6" fontWeight="bold" mb={1}>
          Habilidades
        </Typography>

        <Typography color="text.secondary" mb={2}>
          Sepáralas con comas. Usa las palabras que las empresas
          escriben en sus requisitos (por ejemplo: SAP, Excel,
          ventas, agropecuaria) — así suben tus coincidencias.
        </Typography>

        <TextField
          label="Tus habilidades"
          name="skills"
          autoComplete="off"
          value={form.skills}
          onChange={handleChange}
          fullWidth
        />

        <Typography
          color="text.secondary"
          sx={{ mt: 2, mb: 1, fontSize: 14 }}
        >
          Sugerencias — toca para agregar o quitar:
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>

          {SKILL_SUGGESTIONS.map((skill) => {

            const activa = (form.skills || "")
              .toLowerCase()
              .split(",")
              .map((s) => s.trim())
              .includes(skill.toLowerCase());

            return (
              <Chip
                key={skill}
                label={skill}
                onClick={() => toggleSkill(skill)}
                color={activa ? "primary" : "default"}
                variant={activa ? "filled" : "outlined"}
                sx={activa ? {
                  background: "#0E8F73",
                  "&:hover": { background: "#0C7A62" },
                } : {}}
              />
            );

          })}

        </Box>

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
