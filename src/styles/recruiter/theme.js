import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#0A4D8C",
    },
    secondary: {
      main: "#14AE5C",
    },
    background: {
      default: "#F5F7FB",
    },
  },

  shape: {
    borderRadius: 14,
  },

  typography: {
    fontFamily: "Roboto, Arial, sans-serif",

    h1: {
      fontWeight: 700,
    },

    h2: {
      fontWeight: 700,
    },

    h3: {
      fontWeight: 700,
    },
  },
});

export default theme;