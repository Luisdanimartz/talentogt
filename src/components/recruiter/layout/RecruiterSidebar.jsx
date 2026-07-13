import { useNavigate, useLocation } from "react-router-dom";

import "./../../../styles/recruiter/layout/RecruiterSidebar.css";

import {
  Dashboard as DashboardIcon,
  Logout as LogoutIcon,
  Work as WorkIcon,
  Groups as GroupsIcon,
  Event as EventIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  BusinessCenter as BusinessCenterIcon,
} from "@mui/icons-material";

import { useAuth } from "../../../context/AuthContext";
import { logoutUser } from "../../../services/authService";

/*
  Solo mostramos como navegables las secciones que existen hoy.
  Las demás quedan visibles pero deshabilitadas con la etiqueta
  "Pronto" — sin rutas falsas ni pantallas vacías.

  Ademas, el menu respeta el rol del miembro:
  el observador (solo lectura) no ve "Nueva vacante".
*/
const MENU = [
    { icon: DashboardIcon, title: "Dashboard", path: "/empresa/dashboard" },
    { icon: WorkIcon, title: "Nueva vacante", path: "/empresa/nueva-vacante", requiere: "gestionar" },
    { icon: GroupsIcon, title: "Candidatos", path: "/empresa/candidatos" },
    { icon: EventIcon, title: "Entrevistas", path: "/empresa/entrevistas" },
    { icon: BarChartIcon, title: "Reportes", soon: true },
    { icon: SettingsIcon, title: "Configuración", path: "/empresa/configuracion" },
];

function RecruiterSidebar({ company, role }) {

    const navigate = useNavigate();
    const location = useLocation();

    const { user } = useAuth();

    const companyName = company?.company_name || "";

    async function handleLogout() {

        await logoutUser();

        navigate("/login");

    }

    const initials = (companyName || user?.email || "?")
        .trim()
        .charAt(0)
        .toUpperCase();

    return (

        <aside className="sidebar">

            <div className="sidebar-brand">

                <span className="brand-mark">
                    <BusinessCenterIcon fontSize="small" />
                </span>

                <div>

                    <h2>ChanceGT</h2>

                    <span>Panel empresarial</span>

                </div>

            </div>

            <nav className="sidebar-menu">

                {MENU.filter(
                    (item) =>
                        !(item.requiere === "gestionar" &&
                            role === "observador")
                ).map((item) => (

                    <button
                        key={item.title}
                        className={
                            item.soon
                                ? "sidebar-item soon"
                                : location.pathname === item.path
                                    ? "sidebar-item active"
                                    : "sidebar-item"
                        }
                        onClick={() => !item.soon && navigate(item.path)}
                        disabled={item.soon}
                        title={item.soon ? "Disponible próximamente" : undefined}
                    >

                        <item.icon fontSize="small" />

                        <span>{item.title}</span>

                        {item.soon && (
                            <em className="soon-tag">Pronto</em>
                        )}

                    </button>

                ))}

            </nav>

            <div className="sidebar-footer">

                <div className="sidebar-user">

                    <div className="avatar">

                        {initials}

                    </div>

                    <div className="sidebar-user-info">

                        <strong>{companyName || "Mi empresa"}</strong>

                        <small>
                            {user?.email}
                            {role === "reclutador" && " · Reclutador"}
                            {role === "observador" && " · Observador"}
                        </small>

                    </div>

                </div>

                <button
                    className="sidebar-logout"
                    onClick={handleLogout}
                >

                    <LogoutIcon fontSize="small" />

                    <span>Cerrar sesión</span>

                </button>

            </div>

        </aside>

    );

}

export default RecruiterSidebar;
