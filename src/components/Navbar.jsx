import { Link } from "react-router-dom";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

function Navbar() {
  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={1}
    >
      <Toolbar>

        <Typography
          variant="h5"
          sx={{
            fontWeight: "bold",
            color: "#0A4D8C",
            flexGrow: 1,
          }}
        >
          TalentoGT
        </Typography>

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

        <Button
          variant="contained"
          color="primary"
        >
          Iniciar sesión
        </Button>

      </Toolbar>
    </AppBar>
  );
}

export default Navbar;