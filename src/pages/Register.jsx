import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { registerUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import { handlePostLoginRedirect } from "../flows/handlePostLoginRedirect";

import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Divider,
} from "@mui/material";

import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";

function Register() {

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const tipo = searchParams.get("tipo");
  const esEmpresa = tipo === "empresa";

  /* Ya tiene sesión iniciada: no mostrar el formulario de
     registro otra vez, mandarlo directo a su panel. */
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
          titulo: "Publica tu primera vacante hoy.",
          texto:
            "Crea tu cuenta empresarial gratis y empieza a recibir " +
            "candidatos calificados para tu organización.",
        }
      : tipo === "candidato"
      ? {
          titulo: "Crea tu cuenta.",
          texto:
            "Regístrate gratuitamente y encuentra oportunidades laborales " +
            "con seguimiento durante todo el proceso de selección.",
        }
      : {
          titulo: "Únete a ChanceGT.",
          texto:
            "Crea tu cuenta gratis, ya sea que busques empleo o busques " +
            "talento para tu empresa.",
        };

  const [form, setForm] = useState({
    names: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
    accountType: esEmpresa ? "empresa" : tipo === "candidato" ? "candidato" : "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const validate = () => {

    let newErrors = {};

    if (!form.names.trim()) {
      newErrors.names = "Ingrese sus nombres.";
    }

    if (!form.lastname.trim()) {
      newErrors.lastname = "Ingrese sus apellidos.";
    }

    if (!form.email.trim()) {

      newErrors.email = "Ingrese su correo.";

    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(form.email)
    ) {

      newErrors.email = "Correo electrónico inválido.";

    }

    if (!form.password) {

      newErrors.password = "Ingrese una contraseña.";

    } else if (form.password.length < 6) {

      newErrors.password = "Debe tener al menos 6 caracteres.";

    }

    if (!form.confirmPassword) {

      newErrors.confirmPassword = "Confirme la contraseña.";

    } else if (form.password !== form.confirmPassword) {

      newErrors.confirmPassword = "Las contraseñas no coinciden.";

    }

    if (!form.accountType) {

      newErrors.accountType = "Seleccione un tipo de cuenta.";

    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;

  };

  const handleRegister = async () => {

    if (!validate()) return;

    const { error } = await registerUser(form);

    if (error) {

      setErrors({
        general: error.message,
      });

      return;

    }

    navigate(tipo ? `/login?tipo=${tipo}` : "/login");

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

          {/* IZQUIERDA */}

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
                ChanceGT
              </Typography>

              <Typography
                variant="h5"
                mb={3}
              >
                {TEXTOS.titulo}
              </Typography>

              <Typography>
                {TEXTOS.texto}
              </Typography>

            </Box>

          </Grid>

          {/* DERECHA */}

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
                Crear Cuenta
              </Typography>

              <Typography
                color="text.secondary"
                mb={4}
              >
                Completa la información para comenzar.
              </Typography>

              <Grid container spacing={3}>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Nombres"
                    name="names"
                    value={form.names}
                    onChange={handleChange}
                    error={!!errors.names}
                    helperText={errors.names}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Apellidos"
                    name="lastname"
                    value={form.lastname}
                    onChange={handleChange}
                    error={!!errors.lastname}
                    helperText={errors.lastname}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Correo electrónico"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    error={!!errors.email}
                    helperText={errors.email}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Contraseña"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    error={!!errors.password}
                    helperText={errors.password}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Confirmar contraseña"
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth error={!!errors.accountType}>

                    <InputLabel id="account-type-label">
                      Tipo de cuenta
                    </InputLabel>

                    <Select
                      labelId="account-type-label"
                      id="accountType"
                      name="accountType"
                      value={form.accountType}
                      label="Tipo de cuenta"
                      onChange={handleChange}
                    >

                      <MenuItem value="candidato">
                        Candidato
                      </MenuItem>

                      <MenuItem value="empresa">
                        Empresa
                      </MenuItem>

                    </Select>

                  </FormControl>

                  {errors.accountType && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ ml: 1 }}
                    >
                      {errors.accountType}
                    </Typography>
                  )}

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

              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleRegister}
              >
                Crear Cuenta
              </Button>

              <Button
                fullWidth
                sx={{ mt: 2 }}
                onClick={() =>
                  navigate(tipo ? `/login?tipo=${tipo}` : "/login")
                }
              >
                Ya tengo una cuenta
              </Button>

            </Box>

          </Grid>

        </Grid>

      </Paper>

    </Box>

  );

}

export default Register;