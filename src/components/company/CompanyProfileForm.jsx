import {
  Box,
  Button,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

function CompanyProfileForm({
  form,
  departments = [],
  municipalities = [],
  errors = {},
  loading = false,
  onChange,
  onSubmit,
}) {
  return (
    <Box>
      <Typography
        variant="h4"
        fontWeight="bold"
        mb={1}
      >
        Perfil de Empresa
      </Typography>

      <Typography
        color="text.secondary"
        mb={4}
      >
        Completa la información de tu empresa para continuar.
      </Typography>

      <Grid container spacing={3}>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Nombre comercial"
            name="commercialName"
            value={form.commercialName}
            onChange={onChange}
            error={!!errors.commercialName}
            helperText={errors.commercialName}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Razón social"
            name="legalName"
            value={form.legalName}
            onChange={onChange}
            error={!!errors.legalName}
            helperText={errors.legalName}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="NIT"
            name="nit"
            value={form.nit}
            onChange={onChange}
            error={!!errors.nit}
            helperText={errors.nit}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Teléfono"
            name="phone"
            value={form.phone}
            onChange={onChange}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Sitio web"
            name="website"
            value={form.website}
            onChange={onChange}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            select
            fullWidth
            label="Departamento"
            name="department"
            value={form.department}
            onChange={onChange}
            error={!!errors.department}
            helperText={errors.department}
          >
            {departments.map((department) => (
              <MenuItem
                key={department.id}
                value={department.id}
              >
                {department.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            select
            fullWidth
            label="Municipio"
            name="municipality"
            value={form.municipality}
            onChange={onChange}
            error={!!errors.municipality}
            helperText={errors.municipality}
            disabled={!form.department}
          >
            {municipalities.map((municipality) => (
              <MenuItem
                key={municipality.id}
                value={municipality.id}
              >
                {municipality.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Dirección"
            name="address"
            value={form.address}
            onChange={onChange}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={5}
            label="Descripción de la empresa"
            name="description"
            value={form.description}
            onChange={onChange}
          />
        </Grid>

      </Grid>

      {errors.general && (
        <Typography
          color="error"
          mt={3}
        >
          {errors.general}
        </Typography>
      )}

      <Divider sx={{ my: 4 }} />

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button
          variant="contained"
          size="large"
          disabled={loading}
          onClick={onSubmit}
        >
          Guardar Perfil
        </Button>
      </Box>
    </Box>
  );
}

export default CompanyProfileForm;