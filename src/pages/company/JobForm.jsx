import {
  Box,
  Button,
  Grid,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import { formatMiles } from "../../utils/formatSalary";

const WORK_MODES = ["Presencial", "Remoto", "Híbrido"];

const STATUS_OPTIONS = [
  { value: "draft", label: "Borrador" },
  { value: "published", label: "Publicada" },
  { value: "paused", label: "Pausada" },
  { value: "closed", label: "Cerrada" },
];

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
  return (
    <Box>

      <Typography variant="h4" fontWeight="bold" mb={4}>
        {isEdit ? "Editar Vacante" : "Publicar Vacante"}
      </Typography>

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
            label="Departamento"
            name="department_id"
            value={form.department_id}
            onChange={onChange}
          >
            {departments.map((item) => (
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
            label="Municipio"
            name="municipality_id"
            value={form.municipality_id}
            onChange={onChange}
          >
            {municipalities.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Plazas disponibles"
            name="vacancies"
            value={form.vacancies}
            onChange={onChange}
          />
        </Grid>

        <Grid item xs={12} md={4}>
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
            placeholder="10,000"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">Q</InputAdornment>
              ),
            }}
          />
        </Grid>

        {isEdit && (
          <Grid item xs={12} md={6}>
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

        <Grid item xs={12}>
          <TextField
            multiline
            rows={5}
            fullWidth
            label="Descripción"
            name="description"
            value={form.description}
            onChange={onChange}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            multiline
            rows={4}
            fullWidth
            label="Requisitos"
            name="requirements"
            value={form.requirements}
            onChange={onChange}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            multiline
            rows={4}
            fullWidth
            label="Beneficios"
            name="benefits"
            value={form.benefits}
            onChange={onChange}
          />
        </Grid>

      </Grid>

      <Box mt={4} textAlign="right">
        <Button
          variant="contained"
          size="large"
          onClick={onSubmit}
          disabled={loading}
        >
          {isEdit ? "Guardar cambios" : "Publicar Vacante"}
        </Button>
      </Box>

    </Box>
  );
}

export default JobForm;
