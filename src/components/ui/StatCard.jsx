import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

function StatCard({ number, title, icon }) {
  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 4,
        transition: ".25s",
        "&:hover": {
          transform: "translateY(-5px)",
        },
      }}
    >
      <CardContent>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h4"
            fontWeight="bold"
            color="primary"
          >
            {number}
          </Typography>

          <Typography variant="h4">
            {icon}
          </Typography>
        </Box>

        <Typography
          variant="body1"
          sx={{ mt: 2 }}
        >
          {title}
        </Typography>

      </CardContent>
    </Card>
  );
}

export default StatCard;