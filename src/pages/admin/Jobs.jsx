import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Chip,
} from "@mui/material";

function Jobs() {

  const jobs = [
    {
      id: 1,
      title: "Asesor Comercial",
      company: "Banco Industrial",
      status: "Activa",
      applicants: 42,
    },
    {
      id: 2,
      title: "Supervisor de Ventas",
      company: "Tigo Guatemala",
      status: "Pendiente",
      applicants: 18,
    },
    {
      id: 3,
      title: "Analista Financiero",
      company: "Cementos Progreso",
      status: "Pausada",
      applicants: 9,
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
        mb={4}
      >
        Administración de Vacantes
      </Typography>

      <Paper
        elevation={3}
        sx={{
          borderRadius: 4,
          overflow: "hidden",
        }}
      >

        <Table>

          <TableHead>

            <TableRow>

              <TableCell><strong>Vacante</strong></TableCell>

              <TableCell><strong>Empresa</strong></TableCell>

              <TableCell><strong>Estado</strong></TableCell>

              <TableCell><strong>Postulantes</strong></TableCell>

              <TableCell align="center">
                <strong>Acciones</strong>
              </TableCell>

            </TableRow>

          </TableHead>

          <TableBody>

            {jobs.map((job) => (

              <TableRow key={job.id}>

                <TableCell>
                  {job.title}
                </TableCell>

                <TableCell>
                  {job.company}
                </TableCell>

                <TableCell>

                  <Chip
                    label={job.status}
                    color={
                      job.status === "Activa"
                        ? "success"
                        : job.status === "Pendiente"
                        ? "warning"
                        : "default"
                    }
                  />

                </TableCell>

                <TableCell>
                  {job.applicants}
                </TableCell>

                <TableCell align="center">

                  <Button
                    variant="contained"
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    Ver
                  </Button>

                  <Button
                    color="warning"
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    Editar
                  </Button>

                  <Button
                    color="error"
                    size="small"
                  >
                    Eliminar
                  </Button>

                </TableCell>

              </TableRow>

            ))}

          </TableBody>

        </Table>

      </Paper>

    </Box>

  );

}

export default Jobs;