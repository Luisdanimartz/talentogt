import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { handlePostLoginRedirect } from "../flows/handlePostLoginRedirect";
import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";

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
  const { user, loading: authLoading } = useAuth();

  const tipo = searchParams.get("tipo");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({});

  /* Ya tiene sesión iniciada: no mostrar el formulario de
     login otra vez, mandarlo directo a su panel. */
  useEffect(() => {

    if (!authLoading && user) {
      handlePostLoginRedirect(user, navigate).catch(() => {});
    }

  }, [authLoading, user, navigate]);

  if (authLoading || user) {
    return null;
  }

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

  /* Imagen del panel segun el tipo de cuenta (estilo organico) */
  const IMAGEN =
    tipo === "empresa"
      ? {
          src: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
          alt: "Equipo de reclutamiento trabajando",
        }
      : {
          src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80",
          alt: "Profesional guatemalteca",
        };

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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleLogin();
  };

  return (

    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f5f7fb",
        p: 3,
        pt: { xs: "110px", md: "120px" },
        pb: 5,
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
              background: "linear-gradient(180deg,#F4F9FE 0%,#E3EFFA 100%)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              p: { xs: 4, md: 5 },
            }}
          >

            <Box sx={{ textAlign: "center", maxWidth: 400 }}>

              <Typography
                variant="h4"
                fontWeight="bold"
                mb={1.5}
                sx={{ color: "#0B1F3A", fontFamily: "var(--font-display)" }}
              >
                ChanceGT
              </Typography>

              <Typography
                variant="h6"
                mb={1.5}
                sx={{ color: "#0B1F3A", fontWeight: 700 }}
              >
                {TEXTOS.titulo}
              </Typography>

              <Typography mb={3} sx={{ color: "#3D5573", fontSize: 15 }}>
                {TEXTOS.texto}
              </Typography>

              <Box
                component="img"
                src={IMAGEN.src}
                alt={IMAGEN.alt}
                sx={{
                  width: "100%",
                  maxWidth: 340,
                  aspectRatio: "1 / 1.08",
                  objectFit: "cover",
                  borderRadius: "58% 42% 45% 55% / 52% 48% 52% 48%",
                  boxShadow: "0 24px 50px rgba(11,31,58,.18)",
                  display: { xs: "none", md: "block" },
                  mx: "auto",
                }}
              />

            </Box>

          </Grid>

          {/* PANEL DERECHO */}

          <Grid
            item
            xs={12}
            md={6}
          >

            <Box component="form" onSubmit={handleFormSubmit} sx={{ p: 6 }}>

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
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{
                  mt: 2,
                  mb: 3,
                }}
              >
                Iniciar sesión
              </Button>

              <Button
                type="button"
                fullWidth
                sx={{ mb: 2 }}
                onClick={() => navigate("/forgot-password")}
              >
                ¿Olvidaste tu contraseña?
              </Button>

              <Button
                type="button"
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
                type="button"
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
