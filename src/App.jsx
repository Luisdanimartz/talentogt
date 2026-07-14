import "./App.css";
import { Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";

import CreateProfile from "./pages/company/CreateProfile";
import CreateJob from "./pages/company/CreateJob";
import EditJob from "./pages/company/EditJob";

import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
import Applicants from "./pages/company/Applicants";
import CandidateCV from "./pages/company/CandidateCV";
import SearchCandidates from "./pages/company/SearchCandidates";
import Interviews from "./pages/company/Interviews";
import Reports from "./pages/company/Reports";
import Settings from "./pages/company/Settings";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminCompanies from "./pages/admin/Companies";
import AdminJobs from "./pages/admin/Jobs";
import AdminCandidates from "./pages/admin/Candidates";
import AdminReports from "./pages/admin/Reports";
import AdminSettings from "./pages/admin/Settings";

import CandidateDashboard from "./pages/candidate/Dashboard";
import CreateCV from "./pages/CreateCV";
import ApplicationDetail from "./pages/candidate/ApplicationDetail";
import MyCV from "./pages/candidate/MyCV";

import ProtectedRoute from "./routes/ProtectedRoute";

function App() {

  const location = useLocation();

  const hideNavbar =
    location.pathname.startsWith("/empresa") ||
    location.pathname.startsWith("/admin");

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

        <Route
          path="/privacidad"
          element={<PrivacyPolicy />}
        />

        <Route
          path="/terminos"
          element={<TermsOfService />}
        />

        <Route
          path="/cookies"
          element={<CookiePolicy />}
        />

        <Route
          path="/planes"
          element={<Pricing />}
        />

        <Route
          path="/contacto"
          element={<Contact />}
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

        <Route
          path="/candidato/postulacion/:id"
          element={
            <ProtectedRoute allowedRoles={["candidato"]}>
              <ApplicationDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/candidato/mi-cv"
          element={
            <ProtectedRoute allowedRoles={["candidato"]}>
              <MyCV />
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
          path="/empresa/candidatos/:applicationId/cv"
          element={
            <ProtectedRoute allowedRoles={["empresa"]}>
              <CandidateCV />
            </ProtectedRoute>
          }
        />

        <Route
          path="/empresa/buscar-candidatos"
          element={
            <ProtectedRoute allowedRoles={["empresa"]}>
              <SearchCandidates />
            </ProtectedRoute>
          }
        />

        <Route
          path="/empresa/entrevistas"
          element={
            <ProtectedRoute allowedRoles={["empresa"]}>
              <Interviews />
            </ProtectedRoute>
          }
        />

        <Route
          path="/empresa/reportes"
          element={
            <ProtectedRoute allowedRoles={["empresa"]}>
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/empresa/configuracion"
          element={
            <ProtectedRoute allowedRoles={["empresa"]}>
              <Settings />
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

        {/* ADMIN */}

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/empresas"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminCompanies />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/vacantes"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminJobs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/candidatos"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminCandidates />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/reportes"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminReports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/configuracion"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminSettings />
            </ProtectedRoute>
          }
        />

      </Routes>

    </>

  );

}

export default App;
