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
} from "@mui/material";

function CreateCV() {
  return (
    <Box
      sx={{
        maxWidth: 1200,
        margin: "40px auto",
        px: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 5,
          borderRadius: 4,
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          Mi Perfil Profesional
        </Typography>

        <Typography color="text.secondary" mb={4}>
          Completa tu información para aumentar tus oportunidades de empleo.
        </Typography>

        <Divider sx={{ mb: 4 }} />

        {/* INFORMACIÓN PERSONAL */}

        <Typography variant="h6" fontWeight="bold" mb={3}>
          Información Personal
        </Typography>

        <Grid container spacing={3}>

          <Grid item xs={12} md={4}>
            <TextField
              label="Nombres"
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Primer apellido"
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Segundo apellido"
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Correo electrónico"
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="Teléfono"
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              label="DPI (Opcional)"
              fullWidth
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Departamento"
              fullWidth
            >
              <MenuItem>Guatemala</MenuItem>
              <MenuItem>Sacatepéquez</MenuItem>
              <MenuItem>Escuintla</MenuItem>
              <MenuItem>Quetzaltenango</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Municipio"
              fullWidth
            >
              <MenuItem>Seleccione</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Profesión"
              fullWidth
            />
          </Grid>

        </Grid>

        <Divider sx={{ my: 5 }} />

        {/* FORMACIÓN */}

        <Typography variant="h6" fontWeight="bold" mb={3}>
          Formación Académica
        </Typography>

        <Grid container spacing={3}>

          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Nivel académico"
              fullWidth
            >
              <MenuItem>Básico</MenuItem>
              <MenuItem>Diversificado</MenuItem>
              <MenuItem>Técnico</MenuItem>
              <MenuItem>Universitario</MenuItem>
              <MenuItem>Maestría</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Centro de estudios"
              fullWidth
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Año de graduación"
              fullWidth
            />
          </Grid>

        </Grid>

        <Divider sx={{ my: 5 }} />

        {/* EXPERIENCIA */}

        <Typography variant="h6" fontWeight="bold" mb={3}>
          Experiencia Laboral
        </Typography>

        <TextField
          label="Describe tu experiencia profesional"
          multiline
          rows={6}
          fullWidth
        />

        <Divider sx={{ my: 5 }} />

        {/* HABILIDADES */}

        <Typography variant="h6" fontWeight="bold" mb={3}>
          Habilidades
        </Typography>

        <TextField
          label="Ejemplo: Excel, SAP, Ventas, Liderazgo..."
          fullWidth
        />

        <Divider sx={{ my: 5 }} />

        {/* PROGRESO */}

        <Typography fontWeight="bold" mb={1}>
          Perfil completado 20%
        </Typography>

        <LinearProgress
          variant="determinate"
          value={20}
          sx={{
            height: 10,
            borderRadius: 5,
            mb: 4,
          }}
        />

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="contained"
            size="large"
          >
            Guardar Perfil
          </Button>
        </Box>

      </Paper>
    </Box>
  );
}

export default CreateCV;