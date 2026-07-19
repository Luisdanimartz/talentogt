import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Divider,
  Grid,
  MenuItem,
  Step,
  StepButton,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";

import { toTitleCase } from "../../utils/textFormat";

/*
  Formulario de perfil de empresa en 3 pasos, con guia en cada uno.
  Lo comparten crear perfil, editar perfil y configuracion, asi que
  el asistente aplica en los tres flujos sin tocar su logica.
*/

const PASOS = [
  {
    label: "Identidad",
    guia:
      "Los datos legales de tu empresa. El nombre comercial es el que " +
      "van a ver los candidatos en tus vacantes.",
  },
  {
    label: "Contacto y ubicación",
    guia:
      "Cómo encontrarte. La ubicación también ayuda a los candidatos " +
      "a saber si tus vacantes les quedan cerca.",
  },
  {
    label: "Presentación",
    guia:
      "Tu carta de presentación: los candidatos leen esto antes de " +
      "aplicar. Cuenta qué hace tu empresa y por qué es un buen lugar " +
      "para trabajar. Y no olvides subir tu logo en Configuración — " +
      "es requisito para aparecer en Empresas destacadas.",
  },
];

/* A qué paso pertenece cada campo, para saltar al primer error */
const PASO_DEL_CAMPO = {
  commercialName: 0,
  legalName: 0,
  nit: 0,
  phone: 1,
  website: 1,
  department: 1,
  municipality: 1,
  address: 1,
  description: 2,
};

function CompanyProfileForm({
  form,
  departments = [],
  municipalities = [],
  errors = {},
  loading = false,
  onChange,
  onSubmit,
  title = "Perfil de Empresa",
  subtitle = "Completa la información de tu empresa para continuar.",
  submitLabel = "Guardar Perfil",
}) {

  const [paso, setPaso] = useState(0);

  /* Si el guardado devuelve errores, saltar al primer paso con error */
  useEffect(() => {

    const campos = Object.keys(errors).filter((c) => c !== "general");
    if (campos.length === 0) return;

    const primero = Math.min(
      ...campos.map((c) => PASO_DEL_CAMPO[c] ?? 0)
    );

    setPaso(primero);

  }, [errors]);

  function irAPaso(nuevoPaso) {
    setPaso(nuevoPaso);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <Box>

      <Typography variant="h4" fontWeight="bold" mb={1}>
        {title}
      </Typography>

      <Typography color="text.secondary" mb={3}>
        {subtitle}
      </Typography>

      <Stepper nonLinear activeStep={paso} alternativeLabel sx={{ mb: 3 }}>
        {PASOS.map((p, i) => (
          <Step key={p.label} completed={false}>
            <StepButton onClick={() => irAPaso(i)}>{p.label}</StepButton>
          </Step>
        ))}
      </Stepper>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          background: "linear-gradient(180deg,#F4F9FE,#E9F2FB)",
          border: "1px solid #DCE9F5",
          borderRadius: 3,
          p: { xs: 2.5, md: 3 },
          mb: 4,
        }}
      >

        <Box sx={{ flex: 1 }}>

          <Typography fontWeight="bold" sx={{ color: "#0B1F3A" }} mb={0.5}>
            Paso {paso + 1} de {PASOS.length}: {PASOS[paso].label}
          </Typography>

          <Typography sx={{ color: "#3D5573", fontSize: 14.5 }}>
            {PASOS[paso].guia}
          </Typography>

        </Box>

        <Box
          component="img"
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=400&q=80"
          alt="Equipo de reclutamiento"
          sx={{
            width: 96,
            height: 96,
            objectFit: "cover",
            borderRadius: "58% 42% 45% 55% / 52% 48% 52% 48%",
            boxShadow: "0 10px 24px rgba(11,31,58,.15)",
            display: { xs: "none", md: "block" },
          }}
        />

      </Box>

      {/* ===== Paso 1: Identidad ===== */}

      <Box sx={{ display: paso === 0 ? "block" : "none" }}>

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

        </Grid>

      </Box>

      {/* ===== Paso 2: Contacto y ubicación ===== */}

      <Box sx={{ display: paso === 1 ? "block" : "none" }}>

        <Grid container spacing={3}>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Teléfono"
              name="phone"
              value={form.phone}
              onChange={onChange}
            />
          </Grid>

          <Grid item xs={12} md={6}>
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
                  {toTitleCase(municipality.name)}
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

        </Grid>

      </Box>

      {/* ===== Paso 3: Presentación ===== */}

      <Box sx={{ display: paso === 2 ? "block" : "none" }}>

        <Grid container spacing={3}>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Descripción de la empresa"
              name="description"
              value={form.description}
              onChange={onChange}
            />
          </Grid>

        </Grid>

      </Box>

      {errors.general && (
        <Typography color="error" mt={3}>
          {errors.general}
        </Typography>
      )}

      <Divider sx={{ my: 4 }} />

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 2,
          flexWrap: "wrap",
        }}
      >

        <Button
          variant="outlined"
          size="large"
          disabled={paso === 0}
          onClick={() => irAPaso(paso - 1)}
        >
          Anterior
        </Button>

        {paso < PASOS.length - 1 && (
          <Button
            variant="outlined"
            size="large"
            disabled={loading}
            onClick={onSubmit}
          >
            {submitLabel}
          </Button>
        )}

        {paso < PASOS.length - 1 ? (
          <Button
            variant="contained"
            size="large"
            onClick={() => irAPaso(paso + 1)}
          >
            Siguiente
          </Button>
        ) : (
          <Button
            variant="contained"
            size="large"
            disabled={loading}
            onClick={onSubmit}
          >
            {submitLabel}
          </Button>
        )}

      </Box>

    </Box>
  );
}

export default CompanyProfileForm;
