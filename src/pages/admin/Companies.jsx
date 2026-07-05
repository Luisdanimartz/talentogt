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

function Companies() {

  const companies = [
    {
      id: 1,
      name: "Banco Industrial",
      status: "Aprobada",
      jobs: 15,
    },
    {
      id: 2,
      name: "Tigo Guatemala",
      status: "Pendiente",
      jobs: 8,
    },
    {
      id: 3,
      name: "Cementos Progreso",
      status: "Suspendida",
      jobs: 3,
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
        Administración de Empresas
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

              <TableCell><strong>Empresa</strong></TableCell>

              <TableCell><strong>Estado</strong></TableCell>

              <TableCell><strong>Vacantes</strong></TableCell>

              <TableCell align="center">
                <strong>Acciones</strong>
              </TableCell>

            </TableRow>

          </TableHead>

          <TableBody>

            {companies.map((company) => (

              <TableRow key={company.id}>

                <TableCell>
                  {company.name}
                </TableCell>

                <TableCell>

                  <Chip
                    label={company.status}
                    color={
                      company.status === "Aprobada"
                        ? "success"
                        : company.status === "Pendiente"
                        ? "warning"
                        : "error"
                    }
                  />

                </TableCell>

                <TableCell>

                  {company.jobs}

                </TableCell>

                <TableCell align="center">

                  <Button
                    size="small"
                    variant="contained"
                    sx={{ mr: 1 }}
                  >
                    Ver
                  </Button>

                  <Button
                    size="small"
                    color="success"
                    sx={{ mr: 1 }}
                  >
                    Aprobar
                  </Button>

                  <Button
                    size="small"
                    color="warning"
                    sx={{ mr: 1 }}
                  >
                    Suspender
                  </Button>

                  <Button
                    size="small"
                    color="error"
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

export default Companies;