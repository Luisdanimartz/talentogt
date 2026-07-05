import { Link } from "react-router-dom";

import {
  Box,
  Drawer,
  Toolbar,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";

const drawerWidth = 260;

function AdminLayout({ children }) {

  const menu = [
    {
      title: "Dashboard",
      route: "/admin/dashboard",
    },
    {
      title: "Empresas",
      route: "/admin/companies",
    },
    {
      title: "Candidatos",
      route: "/admin/candidates",
    },
    {
      title: "Vacantes",
      route: "/admin/jobs",
    },
    {
      title: "Reportes",
      route: "/admin/reports",
    },
    {
      title: "Configuración",
      route: "/admin/settings",
    },
  ];

  return (

    <Box sx={{ display: "flex" }}>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,

          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            background: "#0A4D8C",
            color: "#fff",
          },
        }}
      >

        <Toolbar>

          <Typography
            variant="h5"
            fontWeight="bold"
          >
            TalentoGT
          </Typography>

        </Toolbar>

        <List>

          {menu.map((item) => (

            <ListItemButton
              key={item.title}
              component={Link}
              to={item.route}
            >

              <ListItemText
                primary={item.title}
              />

            </ListItemButton>

          ))}

        </List>

      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          ml: `${drawerWidth}px`,
          bgcolor: "#f5f7fb",
          minHeight: "100vh",
        }}
      >

        {children}

      </Box>

    </Box>

  );

}

export default AdminLayout;