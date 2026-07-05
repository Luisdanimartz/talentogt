import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";

function ProcessCard({
  job,
  company,
  status,
  progress,
  nextStep,
  updated,
  onView,
}) {
  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 4,
        mb: 2,
      }}
    >
      <CardContent>

        <Typography variant="h6" fontWeight="bold">
          {job}
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {company}
        </Typography>

        <Chip
          label={status}
          color="primary"
          sx={{ mb: 2 }}
        />

        <Typography variant="body2">
          Progreso del proceso
        </Typography>

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 10,
            borderRadius: 5,
            mt: 1,
            mb: 2,
          }}
        />

        <Typography
          variant="body2"
          sx={{ mb: 1 }}
        >
          <strong>Siguiente etapa:</strong> {nextStep}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
        >
          Última actualización: {updated}
        </Typography>

        <Box
          sx={{
            mt: 3,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Button
            variant="contained"
            onClick={onView}
          >
            Ver seguimiento
          </Button>
        </Box>

      </CardContent>
    </Card>
  );
}

export default ProcessCard;