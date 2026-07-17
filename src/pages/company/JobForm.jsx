import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  TextField,
  Typography,
  Alert,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";

import { formatMiles } from "../../utils/formatSalary";
import { toTitleCase } from "../../utils/textFormat";

import {
  manejarEnterConVineta,
  vinetaInicial,
  normalizarVinetas,
  ESTILO_RENGLONES,
} from "../../utils/bullets";

const WORK_MODES = ["Presencial", "Remoto", "Híbrido"];

const EXPERIENCE_OPTIONS = [
  { value: "sin_experiencia", label: "Sin experiencia" },
  { value: "1", label: "1 año" },
  { value: "2", label: "2 años" },
  { value: "3", label: "3 años" },
  { value: "4", label: "4 años" },
  { value: "5_10", label: "5 a 10 años" },
  { value: "mas_10", label: "Más de 10 años" },
];

const CONTRACT_OPTIONS = [
  { value: "indefinido", label: "Tiempo indefinido" },
  { value: "determinado", label: "Tiempo determinado" },
];

/* Días abierta sin cerrar antes de mostrar la alerta */
const DIAS_ALERTA_ABIERTA = 21;

function diasDesde(fechaIso) {
  if (!fechaIso) return null;
  const ms = Date.now() - new Date(fechaIso).getTime();
  return Math.floor(ms / 86400000);
}

const HORAS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const MINUTOS = ["00", "15", "30", "45"];
const AMPM = ["a.m.", "p.m."];

/* "14:30" -> { hora12: "02", minuto: "30", ampm: "p.m." } */
function partesDeHora24(hora24) {

  if (!hora24) return { hora12: "08", minuto: "00", ampm: "a.m." };

  const [hStr, mStr] = hora24.split(":");
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "p.m." : "a.m.";

  let hora12 = h % 12;
  if (hora12 === 0) hora12 = 12;

  return { hora12: String(hora12).padStart(2, "0"), minuto: mStr || "00", ampm };

}

/* { hora12: "02", minuto: "30", ampm: "p.m." } -> "14:30" */
function hora24DePartes(hora12, minuto, ampm) {

  let h = parseInt(hora12, 10) % 12;
  if (ampm === "p.m.") h += 12;

  return `${String(h).padStart(2, "0")}:${minuto}`;

}

const STATUS_OPTIONS = [
  { value: "draft", label: "Borrador" },
  { value: "scheduled", label: "Programada" },
  { value: "published", label: "Publicada" },
  { value: "paused", label: "Pausada" },
  { value: "closed", label: "Cerrada" },
];

/* Menus con altura fija y barra para bajar (departamentos Y municipios) */
const MENU_SCROLL = {
  MenuProps: {
    PaperProps: { style: { maxHeight: 300 } },
  },
};

/* Estilo compartido de cada tarjeta de seccion */
const seccion = {
  p: { xs: 3, md: 4 },
  borderRadius: 3,
  mb: 3,
  border: "1px solid #E6E8EC",
  boxShadow: "0 1px 2px rgba(11,31,58,0.06)",
};

function TituloSeccion({ numero, children }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: "8px",
          background: "#E4F5F0",
          color: "#0E8F73",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        {numero}
      </Box>
      <Typography variant="h6" fontWeight="bold" color="#0B1F3A">
        {children}
      </Typography>
    </Box>
  );
}

function JobForm({
  form,
  categories,
  employmentTypes,
  educationLevels,
  departments,
  municipalities,
  loading,
  isEdit,
  onChange,
  onSubmit,
  onFinalize,
  finalizing,
  creditos,
}) {

  const navigate = useNavigate();

  const [programar, setProgramar] = useState(!!form.scheduled_publish_at);

  const diasAbierta = isEdit ? diasDesde(form.published_at) : null;
  const llevaMuchoTiempo =
    isEdit &&
    form.status === "published" &&
    diasAbierta !== null &&
    diasAbierta >= DIAS_ALERTA_ABIERTA;

  return (

    <Box sx={{ background: "#F3F5F8", minHeight: "100vh", pb: 8 }}>

      {/* ===== Encabezado navy ===== */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #0B1F3A 0%, #123156 70%, #0E8F73 170%)",
          pt: 6,
          pb: 8,
          px: 3,
        }}
      >
        <Box sx={{ maxWidth: 900, mx: "auto" }}>

          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/empresa/dashboard")}
            sx={{
              color: "rgba(255,255,255,0.85)",
              mb: 2,
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { color: "#FFFFFF", background: "rgba(255,255,255,0.08)" },
            }}
          >
            Volver al dashboard
          </Button>

          <Typography
            variant="h4"
            fontWeight="bold"
            color="#FFFFFF"
            sx={{ letterSpacing: "-0.02em" }}
          >
            {isEdit ? "Editar Vacante" : "Publicar Vacante"}
          </Typography>

          <Typography sx={{ color: "rgba(255,255,255,0.7)", mt: 1 }}>
            Mientras más claros los requisitos, mejores candidatos
            te mostrará ChanceGT.
          </Typography>

        </Box>
      </Box>

      {/* ===== Secciones ===== */}
      <Box sx={{ maxWidth: 900, mx: "auto", px: 3, mt: -4 }}>

        {creditos && creditos.job_limit !== null && (
          <Alert
            severity={creditos.job_credits_remaining > 0 ? "info" : "error"}
            sx={{ mb: 3, borderRadius: 3 }}
          >
            {creditos.job_credits_remaining > 0
              ? <>Te quedan <strong>{creditos.job_credits_remaining}</strong> publicación(es) disponible(s) en tu plan.</>
              : <>No te quedan publicaciones disponibles. <a href="/empresa/planes">Consigue más créditos aquí</a>.</>}
          </Alert>
        )}

        {llevaMuchoTiempo && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
            Esta vacante lleva <strong>{diasAbierta} días</strong> publicada
            sin cerrarse. Revisa si ya tienes candidatos listos para avanzar,
            o considera finalizar el proceso si ya se cubrió de otra forma.
          </Alert>
        )}

        <Paper elevation={0} sx={seccion}>

          <TituloSeccion numero={1}>El puesto</TituloSeccion>

          <Grid container spacing={3}>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título de la vacante"
                name="title"
                value={form.title}
                onChange={onChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Categoría"
                name="category_id"
                value={form.category_id}
                onChange={onChange}
                SelectProps={MENU_SCROLL}
              >
                {categories.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Tipo de empleo"
                name="employment_type_id"
                value={form.employment_type_id}
                onChange={onChange}
              >
                {employmentTypes.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Nivel académico"
                name="education_level_id"
                value={form.education_level_id}
                onChange={onChange}
              >
                {educationLevels.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Modalidad"
                name="work_mode"
                value={form.work_mode}
                onChange={onChange}
              >
                {WORK_MODES.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Experiencia requerida"
                name="experience_level"
                value={form.experience_level || ""}
                onChange={onChange}
              >
                {EXPERIENCE_OPTIONS.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Tipo de contrato"
                name="contract_type"
                value={form.contract_type || ""}
                onChange={onChange}
              >
                {CONTRACT_OPTIONS.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6} sx={{ display: "flex", alignItems: "center" }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!form.is_urgent}
                    onChange={(e) =>
                      onChange({
                        target: { name: "is_urgent", value: e.target.checked },
                      })
                    }
                  />
                }
                label="Marcar como urgente (aparece destacada para los candidatos)"
              />
            </Grid>

          </Grid>

        </Paper>

        <Paper elevation={0} sx={seccion}>

          <TituloSeccion numero={2}>Ubicación y plazas</TituloSeccion>

          <Grid container spacing={3}>

            <Grid item xs={12} md={5}>
              <TextField
                select
                fullWidth
                label="Departamento"
                name="department_id"
                value={form.department_id}
                onChange={onChange}
                SelectProps={MENU_SCROLL}
              >
                {departments.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={5}>
              <TextField
                select
                fullWidth
                label="Municipio"
                name="municipality_id"
                value={form.municipality_id}
                onChange={onChange}
                disabled={!form.department_id}
                SelectProps={MENU_SCROLL}
              >
                {municipalities.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {toTitleCase(item.name)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="number"
                label="Plazas"
                name="vacancies"
                value={form.vacancies}
                onChange={onChange}
              />
            </Grid>

          </Grid>

        </Paper>

        <Paper elevation={0} sx={seccion}>

          <TituloSeccion numero={3}>Compensación</TituloSeccion>

          <Grid container spacing={3}>

            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="Salario mensual"
                name="salary"
                value={form.salary}
                onChange={(e) =>
                  onChange({
                    target: {
                      name: "salary",
                      value: formatMiles(e.target.value),
                    },
                  })
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">Q</InputAdornment>
                  ),
                }}
                helperText="Solo números; las comas se ponen solas"
              />
            </Grid>

            {isEdit && (
              <Grid item xs={12} md={5}>
                <TextField
                  select
                  fullWidth
                  label="Estado de la vacante"
                  name="status"
                  value={form.status}
                  onChange={onChange}
                >
                  {STATUS_OPTIONS.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            <Grid item xs={12} md={5}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={programar}
                    onChange={(e) => {

                      const activar = e.target.checked;
                      setProgramar(activar);

                      if (!activar) {
                        onChange({
                          target: { name: "scheduled_publish_at", value: "" },
                        });
                      }

                    }}
                  />
                }
                label="Programar publicación para una fecha y hora específica"
              />
            </Grid>

            {programar && (
              <>

                <Grid item xs={6} md={3}>
                  <TextField
                    type="date"
                    fullWidth
                    label="Fecha de publicación"
                    value={(form.scheduled_publish_at || "").split("T")[0] || ""}
                    onChange={(e) => {

                      const hora =
                        (form.scheduled_publish_at || "").split("T")[1] || "08:00";

                      onChange({
                        target: {
                          name: "scheduled_publish_at",
                          value: `${e.target.value}T${hora}`,
                        },
                      });

                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={4} md={2}>
                  <TextField
                    select
                    fullWidth
                    label="Hora"
                    value={partesDeHora24((form.scheduled_publish_at || "").split("T")[1]).hora12}
                    onChange={(e) => {

                      const fecha =
                        (form.scheduled_publish_at || "").split("T")[0] ||
                        new Date().toISOString().slice(0, 10);

                      const actual = partesDeHora24((form.scheduled_publish_at || "").split("T")[1]);

                      const nuevaHora24 = hora24DePartes(e.target.value, actual.minuto, actual.ampm);

                      onChange({
                        target: { name: "scheduled_publish_at", value: `${fecha}T${nuevaHora24}` },
                      });

                    }}
                  >
                    {HORAS_12.map((h) => (
                      <MenuItem key={h} value={h}>{h}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={4} md={2}>
                  <TextField
                    select
                    fullWidth
                    label="Min."
                    value={partesDeHora24((form.scheduled_publish_at || "").split("T")[1]).minuto}
                    onChange={(e) => {

                      const fecha =
                        (form.scheduled_publish_at || "").split("T")[0] ||
                        new Date().toISOString().slice(0, 10);

                      const actual = partesDeHora24((form.scheduled_publish_at || "").split("T")[1]);

                      const nuevaHora24 = hora24DePartes(actual.hora12, e.target.value, actual.ampm);

                      onChange({
                        target: { name: "scheduled_publish_at", value: `${fecha}T${nuevaHora24}` },
                      });

                    }}
                  >
                    {MINUTOS.map((m) => (
                      <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={4} md={2}>
                  <TextField
                    select
                    fullWidth
                    label="a.m./p.m."
                    value={partesDeHora24((form.scheduled_publish_at || "").split("T")[1]).ampm}
                    onChange={(e) => {

                      const fecha =
                        (form.scheduled_publish_at || "").split("T")[0] ||
                        new Date().toISOString().slice(0, 10);

                      const actual = partesDeHora24((form.scheduled_publish_at || "").split("T")[1]);

                      const nuevaHora24 = hora24DePartes(actual.hora12, actual.minuto, e.target.value);

                      onChange({
                        target: { name: "scheduled_publish_at", value: `${fecha}T${nuevaHora24}` },
                      });

                    }}
                  >
                    {AMPM.map((v) => (
                      <MenuItem key={v} value={v}>{v}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography fontSize={12.5} color="text.secondary" mt={{ xs: 0, md: 2 }}>
                    La vacante se publica sola ese día y hora, sin que
                    tengas que entrar.
                  </Typography>
                </Grid>

              </>
            )}

          </Grid>

        </Paper>

        <Paper elevation={0} sx={seccion}>

          <TituloSeccion numero={4}>Descripción del puesto</TituloSeccion>

          <Grid container spacing={3}>

            <Grid item xs={12}>
              <TextField
                multiline
                rows={5}
                fullWidth
                label="Descripción"
                name="description"
                value={form.description}
                onChange={onChange}
                helperText="Funciones y responsabilidades del puesto"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                multiline
                rows={4}
                fullWidth
                label="Requisitos (uno por línea)"
                name="requirements"
                value={form.requirements}
                onChange={onChange}
                onKeyDown={(e) =>
                  manejarEnterConVineta(e, (nuevo) =>
                    onChange({
                      target: { name: "requirements", value: nuevo },
                    })
                  )
                }
                onFocus={(e) =>
                  vinetaInicial(e, form.requirements, (v) =>
                    onChange({
                      target: { name: "requirements", value: v },
                    })
                  )
                }
                onBlur={() =>
                  onChange({
                    target: {
                      name: "requirements",
                      value: normalizarVinetas(form.requirements),
                    },
                  })
                }
                helperText="Presiona Enter y la viñeta aparece sola. Palabras clave claras (ej.: SAP, agropecuaria) mejoran las coincidencias con candidatos"
                sx={ESTILO_RENGLONES}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                multiline
                rows={4}
                fullWidth
                label="Beneficios (uno por línea)"
                name="benefits"
                value={form.benefits}
                onChange={onChange}
                onKeyDown={(e) =>
                  manejarEnterConVineta(e, (nuevo) =>
                    onChange({
                      target: { name: "benefits", value: nuevo },
                    })
                  )
                }
                onFocus={(e) =>
                  vinetaInicial(e, form.benefits, (v) =>
                    onChange({
                      target: { name: "benefits", value: v },
                    })
                  )
                }
                onBlur={() =>
                  onChange({
                    target: {
                      name: "benefits",
                      value: normalizarVinetas(form.benefits),
                    },
                  })
                }
                helperText="Presiona Enter y la viñeta aparece sola. Se muestran como lista en la publicación"
                sx={ESTILO_RENGLONES}
              />
            </Grid>

          </Grid>

        </Paper>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >

          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate("/empresa/dashboard")}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Cancelar y volver
          </Button>

          {isEdit && onFinalize && form.status !== "closed" && (
            <Button
              variant="outlined"
              size="large"
              onClick={onFinalize}
              disabled={finalizing || loading}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: "#A32D2D",
                borderColor: "#F09595",
                "&:hover": { borderColor: "#A32D2D", background: "#FCEBEB" },
              }}
            >
              {finalizing ? "Finalizando…" : "Finalizar proceso"}
            </Button>
          )}

          <Button
            variant="contained"
            size="large"
            onClick={onSubmit}
            disabled={loading}
            sx={{
              background: "#0E8F73",
              textTransform: "none",
              fontWeight: 700,
              px: 5,
              "&:hover": { background: "#0C7A62" },
            }}
          >
            {loading
              ? "Guardando…"
              : isEdit
                ? "Guardar cambios"
                : "Publicar Vacante"}
          </Button>

        </Box>

      </Box>

    </Box>

  );
}

export default JobForm;
