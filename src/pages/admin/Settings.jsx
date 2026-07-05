import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
} from "@mui/material";

function Settings() {

  return (

    <Box
      sx={{
        maxWidth: 900,
        margin: "40px auto",
        p: 3,
      }}
    >

      <Typography
        variant="h4"
        fontWeight="bold"
        mb={4}
      >
        Configuración General
      </Typography>

      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 4,
        }}
      >

        <Stack spacing={3}>

          <TextField
            label="Nombre de la plataforma"
            defaultValue="TalentoGT"
            fullWidth
          />

          <TextField
            label="Correo de soporte"
            defaultValue="soporte@talentogt.com"
            fullWidth
          />

          <TextField
            label="Teléfono"
            defaultValue="+502 0000-0000"
            fullWidth
          />

          <Button
            variant="contained"
            size="large"
          >
            Guardar cambios
          </Button>

        </Stack>

      </Paper>

    </Box>

  );

}

export default Settings;