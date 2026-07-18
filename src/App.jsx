import "./App.css";
import "./styles/theme.css";
import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import ProtectedRoute from "./routes/ProtectedRoute";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Jobs = lazy(() => import("./pages/Jobs"));
const JobDetail = lazy(() => import("./pages/JobDetail"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Contact = lazy(() => import("./pages/Contact"));

const CreateProfile = lazy(() => import("./pages/company/CreateProfile"));
const CreateJob = lazy(() => import("./pages/company/CreateJob"));
const EditJob = lazy(() => import("./pages/company/EditJob"));

const RecruiterDashboard = lazy(() => import("./pages/recruiter/RecruiterDashboard"));
const Applicants = lazy(() => import("./pages/company/Applicants"));
const CandidateCV = lazy(() => import("./pages/company/CandidateCV"));
const SearchCandidates = lazy(() => import("./pages/company/SearchCandidates"));
const Interviews = lazy(() => import("./pages/company/Interviews"));
const Reports = lazy(() => import("./pages/company/Reports"));
const Settings = lazy(() => import("./pages/company/Settings"));
const Plans = lazy(() => import("./pages/company/Plans"));
const EditProfile = lazy(() => import("./pages/company/EditProfile"));

const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminCompanies = lazy(() => import("./pages/admin/Companies"));
const AdminCompanyDetail = lazy(() => import("./pages/admin/CompanyDetail"));
const AdminJobs = lazy(() => import("./pages/admin/Jobs"));
const AdminCandidates = lazy(() => import("./pages/admin/Candidates"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));

const CandidateDashboard = lazy(() => import("./pages/candidate/Dashboard"));
const CreateCV = lazy(() => import("./pages/CreateCV"));
const ApplicationDetail = lazy(() => import("./pages/candidate/ApplicationDetail"));
const MyCV = lazy(() => import("./pages/candidate/MyCV"));

function App() {

  const location = useLocation();

  const hideNavbar =
    location.pathname.startsWith("/empresa") ||
    location.pathname.startsWith("/admin");

  return (

    <>

      {!hideNavbar && <Navbar />}

      <Suspense
        fallback={
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "60vh",
              color: "#0B1F3A",
            }}
          >
            Cargando…
          </div>
        }
      >

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
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
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
          path="/empresa/planes"
          element={
            <ProtectedRoute allowedRoles={["empresa"]}>
              <Plans />
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
          path="/empresa/perfil"
          element={
            <ProtectedRoute allowedRoles={["empresa"]}>
              <EditProfile />
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
          path="/admin/empresas/:id"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminCompanyDetail />
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

      </Suspense>

    </>

  );

}

export default App;
