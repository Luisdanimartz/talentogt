import "./App.css";

import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

/* ================= LAYOUTS ================= */

import AdminLayout from "./components/admin/AdminLayout";

/* ================= RUTAS PROTEGIDAS ================= */

import ProtectedRoute from "./routes/ProtectedRoute";

/* ================= PÁGINAS PÚBLICAS ================= */

import Home from "./pages/Home";
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import Companies from "./pages/Companies";
import CreateCV from "./pages/CreateCV";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

/* ================= CANDIDATO ================= */

import Dashboard from "./pages/candidate/Dashboard";

/* ================= EMPRESA ================= */

import CompanyDashboard from "./pages/company/Dashboard";
import CompanyCreateProfile from "./pages/company/CreateProfile";
import RecruitmentBoard from "./pages/company/RecruitmentBoard";
import Recruitment from "./pages/company/Recruitment";

/* ================= ADMIN ================= */

import AdminDashboard from "./pages/admin/Dashboard";
import AdminCompanies from "./pages/admin/Companies";
import AdminCandidates from "./pages/admin/Candidates";
import AdminJobs from "./pages/admin/Jobs";
import AdminReports from "./pages/admin/Reports";
import AdminSettings from "./pages/admin/Settings";

function App() {

  return (
    <div className="container">

      <Navbar />

      <Routes>

        {/* ================= PÚBLICO ================= */}

        <Route path="/" element={<Home />} />

        <Route path="/empleos" element={<Jobs />} />

        <Route path="/detalle-vacante" element={<JobDetail />} />

        <Route path="/empresas" element={<Companies />} />

        <Route path="/crear-cv" element={<CreateCV />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ================= CANDIDATO ================= */}

        <Route
          path="/candidato/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ================= EMPRESA ================= */}

        <Route
          path="/empresa/crear-perfil"
          element={
            <ProtectedRoute>
              <CompanyCreateProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/empresa/dashboard"
          element={
            <ProtectedRoute>
              <CompanyDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/empresa/tablero"
          element={
            <ProtectedRoute>
              <RecruitmentBoard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/empresa/proceso"
          element={
            <ProtectedRoute>
              <Recruitment />
            </ProtectedRoute>
          }
        />

        {/* ================= ADMINISTRADOR ================= */}

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/companies"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminCompanies />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/candidates"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminCandidates />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/jobs"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminJobs />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminReports />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

      </Routes>

    </div>
  );
}

export default App;
