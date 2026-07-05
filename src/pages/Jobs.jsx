import { useNavigate } from "react-router-dom";

import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Grid,
} from "@mui/material";

function Jobs() {

  const navigate = useNavigate();

  const jobs = [
    {
      id: 1,
      title: "Asesor Comercial",
      company: "Banco Industrial",
      location: "Guatemala",
      salary: "Q8,000 - Q10,000",
      type: "Tiempo Completo",
    },
    {
      id: 2,
      title: "Supervisor de Ventas",
      company: "Tigo Guatemala",
      location: "Escuintla",
      salary: "Q10,000 - Q12,000",
      type: "Tiempo Completo",
    },
    {
      id: 3,
      title: "Auxiliar Contable",
      company: "Cementos Progreso",
      location: "Quetzaltenango",
      salary: "Q5,500",
      type: "Tiempo Completo",
    },
  ];

  return (
    <Box
      sx={{
        maxWidth: 1100,
        margin: "40px auto",
        p: 3,
      }}
    >
      <Typography
        variant="h4"
        fontWeight="bold"
        mb={4}
      >
        Vacantes Disponibles
      </Typography>

      <Grid container spacing={3}>

        {jobs.map((job) => (

          <Grid
            item
            xs={12}
            key={job.id}
          >

            <Paper
              sx={{
                p: 4,
                borderRadius: 4,
              }}
            >

              <Typography
                variant="h5"
                fontWeight="bold"
              >
                {job.title}
              </Typography>

              <Typography
                color="primary"
                mb={2}
              >
                {job.company}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                  mb: 3,
                }}
              >
                <Chip label={job.location} />

                <Chip label={job.type} />

                <Chip
                  label={job.salary}
                  color="success"
                />
              </Box>

              <Button
                variant="contained"
                onClick={() => navigate("/detalle-vacante")}
              >
                Ver Vacante
              </Button>

            </Paper>

          </Grid>

        ))}

      </Grid>

    </Box>
  );
}

export default Jobs;