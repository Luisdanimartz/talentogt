import { Link, useNavigate } from "react-router-dom";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

function Navbar() {

  const navigate = useNavigate();

  const { user } = useAuth();

  const handleLogout = async () => {

    await supabase.auth.signOut();

    navigate("/");

  };

  return (

    <AppBar
      position="sticky"
      color="inherit"
      elevation={1}
    >

      <Toolbar
        sx={{
          maxWidth: "1400px",
          width: "100%",
          margin: "0 auto",
        }}
      >

        {/* LOGO */}

        <Typography
          component={Link}
          to="/"
          variant="h5"
          sx={{
            flexGrow: 1,
            fontWeight: "bold",
            color: "#0A4D8C",
            textDecoration: "none",
          }}
        >
          TalentoGT
        </Typography>

        {/* MENÚ */}

        <Box
          sx={{
            display: "flex",
            gap: 2,
            mr: 3,
          }}
        >

          <Button component={Link} to="/">
            Inicio
          </Button>

          <Button component={Link} to="/empleos">
            Empleos
          </Button>

          <Button component={Link} to="/empresas">
            Empresas
          </Button>

          <Button component={Link} to="/crear-cv">
            Crear CV
          </Button>

        </Box>

        {/* SESIÓN */}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >

          {!user ? (

            <>

              <Button
                component={Link}
                to="/login"
                variant="outlined"
              >
                Iniciar sesión
              </Button>

              <Button
                component={Link}
                to="/empresa/dashboard"
                variant="contained"
              >
                Empresas
              </Button>

            </>

          ) : (

            <>

              <Typography
                sx={{
                  fontWeight: "bold",
                  color: "#0A4D8C",
                }}
              >
                Hola, {user.email}
              </Typography>

              <Button
                component={Link}
                to="/candidato/dashboard"
                variant="outlined"
              >
                Mi Panel
              </Button>

              <Button
                color="error"
                variant="contained"
                onClick={handleLogout}
              >
                Cerrar sesión
              </Button>

            </>

          )}

        </Box>

      </Toolbar>

    </AppBar>

  );

}

export default Navbar;