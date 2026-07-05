import {
  Box,
  Button,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

function JobForm({
  form,
  categories,
  employmentTypes,
  educationLevels,
  departments,
  municipalities,
  loading,
  onChange,
  onSubmit,
}) {
  return (
    <Box>

      <Typography variant="h4" fontWeight="bold" mb={4}>
        Publicar Vacante
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
            label="Modalidad"
            fullWidth
            name="work_mode"
            value={form.work_mode}
            onChange={onChange}
          />
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

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Salario mínimo"
            name="salary_min"
            value={form.salary_min}
            onChange={onChange}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Salario máximo"
            name="salary_max"
            value={form.salary_max}
            onChange={onChange}
          />
        </Grid>

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
          Publicar Vacante
        </Button>
      </Box>

    </Box>
  );
}

export default JobForm;