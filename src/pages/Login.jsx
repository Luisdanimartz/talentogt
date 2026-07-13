import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { handlePostLoginRedirect } from "../flows/handlePostLoginRedirect";
import { loginUser } from "../services/authService";

import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

function Login() {

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tipo = searchParams.get("tipo");

  const TEXTOS =
    tipo === "empresa"
      ? {
          titulo: "Encuentra al talento que tu empresa necesita.",
          texto:
            "Publica tus vacantes, revisa candidatos calificados y mantén " +
            "informado a cada postulante durante todo tu proceso de selección.",
        }
      : tipo === "candidato"
      ? {
          titulo: "Tu talento merece una respuesta.",
          texto:
            "La primera plataforma de empleo en Guatemala donde las empresas " +
            "mantienen informados a los candidatos durante todo el proceso " +
            "de selección.",
        }
      : {
          titulo: "Hoy es un gran día para dar el siguiente paso.",
          texto:
            "La plataforma donde candidatos y empresas de Guatemala se " +
            "encuentran, con seguimiento real durante todo el proceso.",
        };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({});

  const validate = () => {

    let newErrors = {};

    if (!email.trim()) {
      newErrors.email = "El correo es obligatorio.";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)
    ) {
      newErrors.email = "Correo electrónico inválido.";
    }

    if (!password.trim()) {
      newErrors.password = "La contraseña es obligatoria.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;

  };

  const handleLogin = async () => {

    if (!validate()) return;

    const { data, error } = await loginUser(email, password);

    if (error) {
      setErrors({
        general: error.message,
      });
      return;
    }

    try {
      await handlePostLoginRedirect(data.user, navigate);
    } catch (redirectError) {
      setErrors({
        general: redirectError.message,
      });
    }

  };

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
          maxWidth: 1100,
          borderRadius: 5,
          overflow: "hidden",
        }}
      >

        <Grid container>

          {/* PANEL IZQUIERDO */}

          <Grid
            item
            xs={12}
            md={6}
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
                ChanceGT
              </Typography>

              <Typography
                variant="h5"
                mb={2}
              >
                {TEXTOS.titulo}
              </Typography>

              <Typography>

                {TEXTOS.texto}

              </Typography>

            </Box>

          </Grid>

          {/* PANEL DERECHO */}

          <Grid
            item
            xs={12}
            md={6}
          >

            <Box sx={{ p: 6 }}>

              <Typography
                variant="h4"
                fontWeight="bold"
                mb={1}
              >
                Iniciar Sesión
              </Typography>

              <Typography
                color="text.secondary"
                mb={4}
              >
                Ingresa a tu cuenta para continuar.
              </Typography>

              <TextField
                label="Correo electrónico"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
              />

              <TextField
                label="Contraseña"
                type="password"
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!errors.password || !!errors.general}
                helperText={errors.password || errors.general}
              />

              <FormControlLabel
                control={<Checkbox />}
                label="Recordarme"
              />

              <Button
                variant="contained"
                fullWidth
                size="large"
                sx={{
                  mt: 2,
                  mb: 3,
                }}
                onClick={handleLogin}
              >
                Iniciar sesión
              </Button>

              <Button
                fullWidth
                sx={{ mb: 2 }}
                onClick={() => navigate("/forgot-password")}
              >
                ¿Olvidaste tu contraseña?
              </Button>

              <Button
                fullWidth
                variant="outlined"
                sx={{ mb: 2 }}
                onClick={() =>
                  navigate(tipo ? `/register?tipo=${tipo}` : "/register")
                }
              >
                Crear una cuenta
              </Button>

              <Button
                fullWidth
                onClick={() => navigate("/")}
              >
                Volver al inicio
              </Button>

            </Box>

          </Grid>

        </Grid>

      </Paper>

    </Box>

  );

}

export default Login;
