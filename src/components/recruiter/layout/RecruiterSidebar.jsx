import "./../../../styles/recruiter/layout/RecruiterSidebar.css";

import {
  Dashboard as DashboardIcon,
  Work as WorkIcon,
  Groups as GroupsIcon,
  Event as EventIcon,
  ChatBubble as ChatBubbleIcon,
  BarChart as BarChartIcon,
  SmartToy as SmartToyIcon,
  Settings as SettingsIcon,
  BusinessCenter as BusinessCenterIcon,
} from "@mui/icons-material";

function RecruiterSidebar() {

    const menu = [
        { icon: <DashboardIcon />, title: "Dashboard", active: true },
        { icon: <WorkIcon />, title: "Vacantes" },
        { icon: <GroupsIcon />, title: "Candidatos" },
        { icon: <EventIcon />, title: "Entrevistas" },
        { icon: <ChatBubbleIcon />, title: "Mensajes" },
        { icon: <BarChartIcon />, title: "Reportes" },
        { icon: <SmartToyIcon />, title: "Centro IA" },
        { icon: <SettingsIcon />, title: "Configuración" }
    ];

    return (
        <aside className="sidebar">

            <div className="sidebar-brand">
                <BusinessCenterIcon className="brand-icon"/>
                <div>
                    <h2>ChanceGT</h2>
                    <span>Panel Empresarial</span>
                </div>
            </div>

            <nav className="sidebar-menu">
                {menu.map((item)=>(
                    <button
                        key={item.title}
                        className={item.active ? "sidebar-item active" : "sidebar-item"}
                    >
                        {item.icon}
                        <span>{item.title}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-user">
                <div className="avatar">LM</div>
                <div>
                    <strong>Luis Martínez</strong>
                    <small>Administrador</small>
                </div>
            </div>

        </aside>
    );
}

export default RecruiterSidebar;