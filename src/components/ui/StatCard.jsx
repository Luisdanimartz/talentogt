import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

function StatCard({ number, title }) {
  return (
    <Card
      elevation={3}
      sx={{
        borderRadius: 4,
        height: 150
      }}
    >
      <CardContent>

        <Typography
          variant="h3"
          color="primary"
          fontWeight="bold"
        >
          {number}
        </Typography>

        <Typography
          variant="h6"
          sx={{ mt: 2 }}
        >
          {title}
        </Typography>

      </CardContent>
    </Card>
  );
}

export default StatCard;