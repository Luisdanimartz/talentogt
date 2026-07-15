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

import { updatePassword } from "../services/authService";
import { useAuth } from "../context/AuthContext";

function ResetPassword() {

  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {

    setError(null);

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setGuardando(true);

    const { error: updateError } = await updatePassword(password);

    setGuardando(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setListo(true);

    setTimeout(() => navigate("/login"), 2500);

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
                Ya casi terminas.
              </Typography>

              <Typography>
                Crea una contraseña nueva para tu cuenta.
              </Typography>

            </Box>

          </Grid>

          <Grid item xs={12} md={7}>

            <Box sx={{ p: 6 }}>

              {authLoading ? (

                <Typography color="text.secondary">
                  Verificando el enlace…
                </Typography>

              ) : !user ? (

                <>

                  <Typography variant="h4" fontWeight="bold" mb={1}>
                    Enlace vencido o inválido
                  </Typography>

                  <Typography color="text.secondary" mb={4}>
                    Este enlace ya expiró o ya se usó. Solicita uno
                    nuevo para restablecer tu contraseña.
                  </Typography>

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={() => navigate("/forgot-password")}
                  >
                    Solicitar un enlace nuevo
                  </Button>

                </>

              ) : listo ? (

                <>

                  <Typography variant="h4" fontWeight="bold" mb={1}>
                    ¡Listo! ✓
                  </Typography>

                  <Typography color="text.secondary">
                    Tu contraseña se actualizó. Te llevamos a iniciar
                    sesión en un momento…
                  </Typography>

                </>

              ) : (

                <>

                  <Typography variant="h4" fontWeight="bold" mb={1}>
                    Crea tu nueva contraseña
                  </Typography>

                  <Typography color="text.secondary" mb={4}>
                    Debe tener al menos 6 caracteres.
                  </Typography>

                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}

                  <TextField
                    label="Contraseña nueva"
                    type="password"
                    fullWidth
                    margin="normal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />

                  <TextField
                    label="Confirmar contraseña"
                    type="password"
                    fullWidth
                    margin="normal"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    autoComplete="new-password"
                  />

                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    sx={{ mt: 3 }}
                    onClick={handleSubmit}
                    disabled={guardando}
                  >
                    {guardando ? "Guardando…" : "Guardar contraseña"}
                  </Button>

                </>

              )}

            </Box>

          </Grid>

        </Grid>

      </Paper>

    </Box>

  );

}

export default ResetPassword;
