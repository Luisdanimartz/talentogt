import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import CreateProfile from "./pages/company/CreateProfile";
import CreateJob from "./pages/company/CreateJob";

import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";

import ProtectedRoute from "./routes/ProtectedRoute";

function App() {

  const location = useLocation();

  const hideNavbar =
    location.pathname.startsWith("/empresa");

  return (

    <>

      {!hideNavbar && <Navbar />}

      <Routes>

        {/* PÚBLICAS */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* EMPRESA */}

        <Route
          path="/empresa/dashboard"
          element={
            <ProtectedRoute allowedRoles={["empresa"]}>
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/empresa/crear-perfil"
          element={
            <ProtectedRoute allowedRoles={["empresa"]}>
              <CreateProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/empresa/nueva-vacante"
          element={
            <ProtectedRoute allowedRoles={["empresa"]}>
              <CreateJob />
            </ProtectedRoute>
          }
        />

      </Routes>

    </>

  );

}

export default App;
