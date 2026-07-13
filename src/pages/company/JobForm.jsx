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

const STATUS_OPTIONS = [
  { value: "draft", label: "Borrador" },
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
}) {

  const navigate = useNavigate();

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
