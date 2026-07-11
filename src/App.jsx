import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";

import CreateProfile from "./pages/company/CreateProfile";
import CreateJob from "./pages/company/CreateJob";
import EditJob from "./pages/company/EditJob";

import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
import Applicants from "./pages/company/Applicants";
import CandidateDashboard from "./pages/candidate/Dashboard";
import CreateCV from "./pages/CreateCV";

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

        <Route
          path="/vacantes"
          element={<Jobs />}
        />

        <Route
          path="/vacantes/:id"
          element={<JobDetail />}
        />

        {/* CANDIDATO */}

        <Route
          path="/candidato/dashboard"
          element={
            <ProtectedRoute allowedRoles={["candidato"]}>
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/candidato/crear-cv"
          element={
            <ProtectedRoute allowedRoles={["candidato"]}>
              <CreateCV />
            </ProtectedRoute>
          }
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
          path="/empresa/candidatos"
          element={
            <ProtectedRoute allowedRoles={["empresa"]}>
              <Applicants />
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

        <Route
          path="/empresa/vacante/:id"
          element={
            <ProtectedRoute allowedRoles={["empresa"]}>
              <EditJob />
            </ProtectedRoute>
          }
        />

      </Routes>

    </>

  );

}

export default App;
