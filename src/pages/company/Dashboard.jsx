import { useNavigate } from "react-router-dom";

import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Chip
} from "@mui/material";

function Dashboard() {

  const navigate = useNavigate();

  const jobs = [
    {
      id: 1,
      title: "Asesor Comercial",
      candidates: 52,
      status: "Activa"
    },
    {
      id: 2,
      title: "Supervisor de Ventas",
      candidates: 31,
      status: "Activa"
    },
    {
      id: 3,
      title: "Auxiliar Contable",
      candidates: 18,
      status: "Activa"
    }
  ];

  return (

    <Box
      sx={{
        maxWidth: 1300,
        margin: "40px auto",
        p: 3
      }}
    >

      <Typography
        variant="h4"
        fontWeight="bold"
      >

        Dashboard Empresa

      </Typography>

      <Typography
        color="text.secondary"
        mb={5}
      >

        Administra tus vacantes y candidatos.

      </Typography>

      {/* ESTADÍSTICAS */}

      <Grid container spacing={3}>

        <Grid item xs={12} md={3}>

          <Paper sx={{ p:3,borderRadius:4 }}>

            <Typography variant="h3">

              12

            </Typography>

            <Typography>

              Vacantes activas

            </Typography>

          </Paper>

        </Grid>

        <Grid item xs={12} md={3}>

          <Paper sx={{ p:3,borderRadius:4 }}>

            <Typography variant="h3">

              248

            </Typography>

            <Typography>

              Candidatos

            </Typography>

          </Paper>

        </Grid>

        <Grid item xs={12} md={3}>

          <Paper sx={{ p:3,borderRadius:4 }}>

            <Typography variant="h3">

              73

            </Typography>

            <Typography>

              Procesos activos

            </Typography>

          </Paper>

        </Grid>

        <Grid item xs={12} md={3}>

          <Paper sx={{ p:3,borderRadius:4 }}>

            <Typography variant="h3">

              175

            </Typography>

            <Typography>

              Procesos finalizados

            </Typography>

          </Paper>

        </Grid>

      </Grid>

      <Typography
        variant="h5"
        mt={6}
        mb={3}
      >

        Mis Vacantes

      </Typography>

      {

        jobs.map((job)=>(

          <Paper
            key={job.id}
            sx={{
              p:3,
              mb:3,
              borderRadius:4,
              display:"flex",
              justifyContent:"space-between",
              alignItems:"center"
            }}
          >

            <Box>

              <Typography
                variant="h6"
                fontWeight="bold"
              >

                {job.title}

              </Typography>

              <Typography
                color="text.secondary"
              >

                {job.candidates} candidatos

              </Typography>

            </Box>

            <Box>

              <Chip
                label={job.status}
                color="success"
                sx={{mr:2}}
              />

              <Button
                variant="contained"
                onClick={()=>navigate("/empresa/tablero")}
              >

                Abrir tablero

              </Button>

            </Box>

          </Paper>

        ))

      }

    </Box>

  );

}

export default Dashboard;