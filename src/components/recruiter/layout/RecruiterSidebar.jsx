import { useNavigate, useLocation } from "react-router-dom";

import "./../../../styles/recruiter/layout/RecruiterSidebar.css";

import {
  Dashboard as DashboardIcon,
  Logout as LogoutIcon,
  Work as WorkIcon,
  Groups as GroupsIcon,
  PersonSearch as PersonSearchIcon,
  Event as EventIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  BusinessCenter as BusinessCenterIcon,
  OpenInNew as OpenInNewIcon,
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
    { icon: PersonSearchIcon, title: "Buscar candidatos", path: "/empresa/buscar-candidatos" },
    { icon: EventIcon, title: "Entrevistas", path: "/empresa/entrevistas" },
    { icon: BarChartIcon, title: "Reportes", path: "/empresa/reportes" },
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
                    <img
                        src="/favicon.svg"
                        alt="ChanceGT"
                        style={{ width: "100%", height: "100%" }}
                    />
                </span>

                <div>

                    <h2>ChanceGT</h2>

                    <span>Panel empresarial</span>

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

                        {company?.logo ? (
                            <img
                                src={company.logo}
                                alt=""
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    borderRadius: "inherit",
                                }}
                            />
                        ) : (
                            initials
                        )}

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
