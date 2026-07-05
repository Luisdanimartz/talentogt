import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip
} from "@mui/material";

const columns = [
  {
    title: "CV Enviado",
    color: "#1976d2",
    candidates: [
      {
        id: 1,
        name: "Juan Pérez",
        days: "Hace 2 días"
      },
      {
        id: 2,
        name: "María López",
        days: "Hace 1 día"
      }
    ]
  },
  {
    title: "CV Revisado",
    color: "#0288d1",
    candidates: [
      {
        id: 3,
        name: "Carlos Ruiz",
        days: "Hoy"
      }
    ]
  },
  {
    title: "CV Evaluado",
    color: "#388e3c",
    candidates: [
      {
        id: 4,
        name: "Ana Gómez",
        days: "Hace 4 horas"
      }
    ]
  },
  {
    title: "Reclutador Asignado",
    color: "#f57c00",
    candidates: [
      {
        id: 5,
        name: "José Martínez",
        days: "Hace 30 min"
      }
    ]
  },
  {
    title: "Entrevista Programada",
    color: "#8e24aa",
    candidates: [
      {
        id: 6,
        name: "Luis Morales",
        days: "Mañana"
      }
    ]
  },
  {
    title: "Proceso Finalizado",
    color: "#757575",
    candidates: [
      {
        id: 7,
        name: "Pedro García",
        days: "Ayer"
      }
    ]
  }
];

function RecruitmentBoard() {

  return (

    <Box
      sx={{
        display: "flex",
        gap: 2,
        p: 3,
        overflowX: "auto",
        minHeight: "85vh",
        background: "#f5f7fb"
      }}
    >

      {columns.map((column) => (

        <Paper
          key={column.title}
          sx={{
            minWidth: 280,
            p: 2,
            borderRadius: 3,
            background: "#fafafa"
          }}
        >

          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{
              color: column.color,
              mb: 2
            }}
          >
            {column.title}
          </Typography>

          <Chip
            label={`${column.candidates.length} candidatos`}
            size="small"
            sx={{ mb: 2 }}
          />

          {column.candidates.map((candidate) => (

            <Paper
              key={candidate.id}
              elevation={2}
              sx={{
                p: 2,
                mb: 2,
                borderRadius: 3,
                cursor: "pointer",
                transition: ".25s",
                "&:hover": {
                  transform: "translateY(-3px)"
                }
              }}
            >

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2
                }}
              >

                <Avatar>

                  {candidate.name.charAt(0)}

                </Avatar>

                <Box>

                  <Typography fontWeight="bold">

                    {candidate.name}

                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >

                    {candidate.days}

                  </Typography>

                </Box>

              </Box>

            </Paper>

          ))}

        </Paper>

      ))}

    </Box>

  );

}

export default RecruitmentBoard;