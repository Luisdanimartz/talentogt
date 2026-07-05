import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Divider,
  Grid,
  Avatar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

function JobDetail() {

  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  return (
    <Box
      sx={{
        maxWidth: 1200,
        margin: "40px auto",
        px: 3,
      }}
    >
      <Grid container spacing={4}>

        {/* INFORMACIÓN */}

        <Grid item xs={12} md={8}>

          <Paper
            elevation={3}
            sx={{
              p:4,
              borderRadius:4,
            }}
          >

            <Box
              sx={{
                display:"flex",
                gap:3,
                alignItems:"center",
                mb:4,
              }}
            >

              <Avatar
                sx={{
                  width:70,
                  height:70,
                  bgcolor:"#0A4D8C",
                  fontSize:28,
                }}
              >
                BI
              </Avatar>

              <Box>

                <Typography
                  variant="h5"
                  fontWeight="bold"
                >
                  Banco Industrial
                </Typography>

                <Typography color="text.secondary">
                  ⭐ 4.8 · Empresa verificada
                </Typography>

                <Typography color="text.secondary">
                  Guatemala · Sector Financiero
                </Typography>

                <Typography color="text.secondary">
                  Más de 350 colaboradores
                </Typography>

              </Box>

            </Box>

            <Divider sx={{mb:4}} />

            <Typography
              variant="h4"
              fontWeight="bold"
            >
              Asesor Comercial
            </Typography>

            <Typography
              color="text.secondary"
              mt={1}
            >
              Publicado hace 2 días · 25 postulantes
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              mt={3}
              flexWrap="wrap"
            >

              <Chip label="Guatemala"/>

              <Chip label="Tiempo completo"/>

              <Chip label="Presencial"/>

              <Chip
                label="Q8,000 - Q10,000"
                color="success"
              />

            </Stack>

            <Divider sx={{my:4}} />

            <Typography
              variant="h5"
              fontWeight="bold"
              mb={2}
            >
              Descripción
            </Typography>

            <Typography color="text.secondary">

              Estamos buscando un Asesor Comercial con experiencia
              en ventas consultivas, negociación y servicio al cliente.
              Será responsable de desarrollar nuevas oportunidades,
              administrar cartera de clientes y cumplir indicadores
              comerciales.

            </Typography>

            <Divider sx={{my:4}}/>

            <Typography
              variant="h5"
              fontWeight="bold"
              mb={2}
            >
              Requisitos
            </Typography>

            <ul>
              <li>Graduado a nivel diversificado.</li>
              <li>Experiencia mínima de 2 años.</li>
              <li>Excel intermedio.</li>
              <li>Excelente presentación.</li>
              <li>Disponibilidad para viajar.</li>
            </ul>

            <Divider sx={{my:4}}/>

            <Typography
              variant="h5"
              fontWeight="bold"
              mb={2}
            >
              Beneficios
            </Typography>

            <ul>
              <li>Prestaciones de ley.</li>
              <li>Seguro médico.</li>
              <li>Bonificación por resultados.</li>
              <li>Capacitaciones constantes.</li>
              <li>Plan de crecimiento.</li>
            </ul>

          </Paper>

        </Grid>

        {/* PANEL DERECHO */}

        <Grid item xs={12} md={4}>

          <Paper
            elevation={3}
            sx={{
              p:4,
              borderRadius:4,
              position:"sticky",
              top:30,
            }}
          >

            <Typography
              variant="h6"
              fontWeight="bold"
              mb={3}
            >
              Postulación
            </Typography>

            <Button
              variant="contained"
              fullWidth
              size="large"
              sx={{mb:2}}
              onClick={() => setOpen(true)}
            >
              Postularme
            </Button>

            <Button
              variant="outlined"
              fullWidth
              sx={{mb:2}}
            >
              Guardar Vacante
            </Button>

            <Button
              variant="outlined"
              fullWidth
              sx={{mb:2}}
            >
              Compartir
            </Button>

            <Button
              color="error"
              fullWidth
            >
              Reportar Vacante
            </Button>

            <Divider sx={{my:4}}/>

            <Typography
              variant="subtitle1"
              fontWeight="bold"
            >
              Compromiso TalentoGT
            </Typography>

            <Typography
              color="text.secondary"
              mt={1}
            >
              Esta empresa mantiene informados a todos los candidatos
              durante el proceso de selección.
            </Typography>

          </Paper>

        </Grid>

      </Grid>

      {/* VENTANA DE CONFIRMACIÓN */}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
      >

        <DialogTitle>
          Confirmar postulación
        </DialogTitle>

        <DialogContent>

          <Typography>

            ¿Deseas postularte a la vacante de
            <strong> Asesor Comercial </strong>
            en
            <strong> Banco Industrial</strong>?

          </Typography>

        </DialogContent>

        <DialogActions>

          <Button
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            onClick={() => navigate("/candidato/dashboard")}
          >
            Confirmar Postulación
          </Button>

        </DialogActions>

      </Dialog>

    </Box>
  );
}

export default JobDetail;