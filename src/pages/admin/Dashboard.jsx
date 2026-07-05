import {
  Box,
  Grid,
  Paper,
  Typography,
} from "@mui/material";

function Dashboard() {

  const cards = [
    {
      title: "Candidatos",
      value: "2,540",
    },
    {
      title: "Empresas",
      value: "352",
    },
    {
      title: "Vacantes",
      value: "1,286",
    },
    {
      title: "Postulaciones",
      value: "18,430",
    },
    {
      title: "Empresas pendientes",
      value: "14",
    },
    {
      title: "Reportes",
      value: "6",
    },
  ];

  return (

    <Box
      sx={{
        maxWidth: 1400,
        margin: "40px auto",
        p: 3,
      }}
    >

      <Typography
        variant="h4"
        fontWeight="bold"
        mb={1}
      >
        Panel Administrativo
      </Typography>

      <Typography
        color="text.secondary"
        mb={5}
      >
        Resumen general de TalentoGT
      </Typography>

      <Grid container spacing={3}>

        {cards.map((card) => (

          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            key={card.title}
          >

            <Paper
              elevation={3}
              sx={{
                p: 4,
                borderRadius: 4,
                textAlign: "center",
              }}
            >

              <Typography
                variant="h3"
                fontWeight="bold"
                color="primary"
              >
                {card.value}
              </Typography>

              <Typography
                mt={1}
              >
                {card.title}
              </Typography>

            </Paper>

          </Grid>

        ))}

      </Grid>

    </Box>

  );

}

export default Dashboard;