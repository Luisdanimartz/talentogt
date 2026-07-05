import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
} from "@mui/material";

function Reports() {

  const reports = [
    {
      id: 1,
      title: "Vacante duplicada",
      company: "Empresa XYZ",
      status: "Pendiente",
    },
    {
      id: 2,
      title: "Contenido engañoso",
      company: "ABC S.A.",
      status: "En revisión",
    },
    {
      id: 3,
      title: "Empresa reportada",
      company: "Comercial GT",
      status: "Resuelto",
    },
  ];

  return (

    <Box
      sx={{
        maxWidth: 1200,
        margin: "40px auto",
        p: 3,
      }}
    >

      <Typography
        variant="h4"
        fontWeight="bold"
        mb={4}
      >
        Reportes del Sistema
      </Typography>

      <Paper
        elevation={3}
        sx={{
          borderRadius: 4,
        }}
      >

        <List>

          {reports.map((report) => (

            <ListItem
              key={report.id}
              divider
            >

              <ListItemText
                primary={report.title}
                secondary={report.company}
              />

              <Chip label={report.status} />

            </ListItem>

          ))}

        </List>

      </Paper>

    </Box>

  );

}

export default Reports;