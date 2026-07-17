import { useNavigate, useLocation } from "react-router-dom";

import "./../../styles/recruiter/layout/RecruiterSidebar.css";

import {
    Dashboard as DashboardIcon,
    Logout as LogoutIcon,
    Work as WorkIcon,
    Groups as GroupsIcon,
    BarChart as BarChartIcon,
    Settings as SettingsIcon,
    Business as BusinessIcon,
    OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";

import { useAuth } from "../../context/AuthContext";
import { logoutUser } from "../../services/authService";

const MENU = [
    { icon: DashboardIcon, title: "Dashboard", path: "/admin/dashboard" },
    { icon: BusinessIcon, title: "Empresas", path: "/admin/empresas" },
    { icon: WorkIcon, title: "Vacantes", path: "/admin/vacantes" },
    { icon: GroupsIcon, title: "Candidatos", path: "/admin/candidatos" },
    { icon: BarChartIcon, title: "Reportes", path: "/admin/reportes" },
    { icon: SettingsIcon, title: "Configuración", path: "/admin/configuracion" },
];

function AdminSidebar() {

    const navigate = useNavigate();
    const location = useLocation();

    const { user } = useAuth();

    async function handleLogout() {

        await logoutUser();

        navigate("/login");

    }

    return (

        <aside className="sidebar">

            <div className="sidebar-brand">

                <span className="brand-mark">
                    <img
                        src="/favicon.svg"
                        alt="ChanceGT"
                        style={{ width: "100%", height: "100%" }}
                    />
                </span>

                <div>

                    <h2>ChanceGT</h2>

                    <span>Panel administrador</span>

                </div>

            </div>

            <nav className="sidebar-menu">

                <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sidebar-item"
                >
                    <OpenInNewIcon fontSize="small" />
                    <span>Ver sitio (ChanceGT)</span>
                </a>

                {MENU.map((item) => (

                    <button
                        key={item.title}
                        className={
                            location.pathname === item.path
                                ? "sidebar-item active"
                                : "sidebar-item"
                        }
                        onClick={() => navigate(item.path)}
                    >

                        <item.icon fontSize="small" />

                        <span>{item.title}</span>

                    </button>

                ))}

            </nav>

            <div className="sidebar-footer">

                <div className="sidebar-user">

                    <div className="avatar">
                        A
                    </div>

                    <div className="sidebar-user-info">

                        <strong>Administrador</strong>

                        <small>{user?.email}</small>

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

export default AdminSidebar;
