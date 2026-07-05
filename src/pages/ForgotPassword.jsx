import { useNavigate } from "react-router-dom";

import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
} from "@mui/material";

function ForgotPassword() {

  const navigate = useNavigate();

  return (

    <Box
      sx={{
        minHeight: "90vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f5f7fb",
        p: 3,
      }}
    >

      <Paper
        elevation={5}
        sx={{
          width: "100%",
          maxWidth: 1000,
          borderRadius: 5,
          overflow: "hidden",
        }}
      >

        <Grid container>

          {/* PANEL IZQUIERDO */}

          <Grid
            item
            xs={12}
            md={5}
            sx={{
              background: "linear-gradient(135deg,#0A4D8C,#1976d2)",
              color: "#fff",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              p: 6,
            }}
          >

            <Box>

              <Typography
                variant="h3"
                fontWeight="bold"
                mb={3}
              >
                TalentoGT
              </Typography>

              <Typography
                variant="h5"
                mb={2}
              >
                Recupera tu acceso.
              </Typography>

              <Typography>

                Ingresa el correo electrónico con el que creaste tu cuenta y
                te enviaremos las instrucciones para restablecer tu contraseña.

              </Typography>

            </Box>

          </Grid>

          {/* PANEL DERECHO */}

          <Grid
            item
            xs={12}
            md={7}
          >

            <Box sx={{ p: 6 }}>

              <Typography
                variant="h4"
                fontWeight="bold"
                mb={1}
              >
                Recuperar contraseña
              </Typography>

              <Typography
                color="text.secondary"
                mb={4}
              >
                Introduce tu correo electrónico.
              </Typography>

              <TextField
                label="Correo electrónico"
                fullWidth
                margin="normal"
              />

              <Button
                variant="contained"
                fullWidth
                size="large"
                sx={{
                  mt: 3,
                  mb: 2,
                }}
              >
                Enviar instrucciones
              </Button>

              <Button
                fullWidth
                onClick={() => navigate("/login")}
              >
                Volver al inicio de sesión
              </Button>

            </Box>

          </Grid>

        </Grid>

      </Paper>

    </Box>

  );

}

export default ForgotPassword;