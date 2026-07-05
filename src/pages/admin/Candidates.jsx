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
  Avatar,
} from "@mui/material";

function Candidates() {

  const candidates = [
    {
      id: 1,
      name: "Luis Martz",
      profession: "Supervisor de Ventas",
      applications: 12,
    },
    {
      id: 2,
      name: "María López",
      profession: "Contadora",
      applications: 5,
    },
    {
      id: 3,
      name: "Carlos Pérez",
      profession: "Ingeniero Industrial",
      applications: 8,
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
        Administración de Candidatos
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

              <TableCell><strong>Candidato</strong></TableCell>

              <TableCell><strong>Profesión</strong></TableCell>

              <TableCell><strong>Postulaciones</strong></TableCell>

              <TableCell align="center">
                <strong>Acciones</strong>
              </TableCell>

            </TableRow>

          </TableHead>

          <TableBody>

            {candidates.map((candidate) => (

              <TableRow key={candidate.id}>

                <TableCell>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >

                    <Avatar>
                      {candidate.name.charAt(0)}
                    </Avatar>

                    {candidate.name}

                  </Box>

                </TableCell>

                <TableCell>
                  {candidate.profession}
                </TableCell>

                <TableCell>
                  {candidate.applications}
                </TableCell>

                <TableCell align="center">

                  <Button
                    size="small"
                    variant="contained"
                    sx={{ mr: 1 }}
                  >
                    Ver Perfil
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

export default Candidates;