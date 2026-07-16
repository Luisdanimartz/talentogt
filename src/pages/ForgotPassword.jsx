import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
} from "@mui/material";

import { sendPasswordReset } from "../services/authService";

function ForgotPassword() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {

    setError(null);

    if (!email.trim()) {
      setError("Ingresa tu correo electrónico.");
      return;
    }

    setEnviando(true);

    const { error: sendError } = await sendPasswordReset(email.trim());

    setEnviando(false);

    if (sendError) {
      setError(sendError.message);
      return;
    }

    setEnviado(true);

  }

  function handleFormSubmit(e) {
    e.preventDefault();
    handleSubmit();
  }

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

              <Typography variant="h3" fontWeight="bold" mb={3}>
                ChanceGT
              </Typography>

              <Typography variant="h5" mb={2}>
                Recupera tu acceso.
              </Typography>

              <Typography>
                Ingresa el correo electrónico con el que creaste tu cuenta y
                te enviaremos las instrucciones para restablecer tu contraseña.
              </Typography>

            </Box>

          </Grid>

          {/* PANEL DERECHO */}

          <Grid item xs={12} md={7}>

            <Box sx={{ p: 6 }}>

              {enviado ? (

                <>

                  <Typography variant="h4" fontWeight="bold" mb={1}>
                    Revisa tu correo
                  </Typography>

                  <Typography color="text.secondary" mb={4}>
                    Si <strong>{email}</strong> tiene una cuenta en
                    ChanceGT, te llegará un enlace para crear una
                    contraseña nueva. Revisa también tu carpeta de spam.
                  </Typography>

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={() => navigate("/login")}
                  >
                    Volver a iniciar sesión
                  </Button>

                </>

              ) : (

                <Box component="form" onSubmit={handleFormSubmit}>

                  <Typography variant="h4" fontWeight="bold" mb={1}>
                    Recuperar contraseña
                  </Typography>

                  <Typography color="text.secondary" mb={4}>
                    Introduce tu correo electrónico y te mandamos un
                    enlace para crear una contraseña nueva.
                  </Typography>

                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}

                  <TextField
                    label="Correo electrónico"
                    fullWidth
                    margin="normal"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    sx={{ mt: 3, mb: 2 }}
                    disabled={enviando}
                  >
                    {enviando ? "Enviando…" : "Enviar instrucciones"}
                  </Button>

                  <Button type="button" fullWidth onClick={() => navigate("/login")}>
                    Volver al inicio de sesión
                  </Button>

                </Box>

              )}

            </Box>

          </Grid>

        </Grid>

      </Paper>

    </Box>

  );

}

export default ForgotPassword;
