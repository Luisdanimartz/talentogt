import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "./../../../styles/recruiter/layout/RecruiterTopbar.css";

import {
  Search as SearchIcon,
  NotificationsNone as BellIcon,
  Add as AddIcon,
} from "@mui/icons-material";

function saludoPorHora() {

    const hora = new Date().getHours();

    if (hora < 12) return "Buenos días";
    if (hora < 19) return "Buenas tardes";

    return "Buenas noches";

}

function fechaLarga() {

    const texto = new Date().toLocaleDateString("es-GT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return texto.charAt(0).toUpperCase() + texto.slice(1);

}

function RecruiterTopbar({ company, search, onSearchChange }) {

    const navigate = useNavigate();

    const [bellOpen, setBellOpen] = useState(false);
    const bellRef = useRef(null);

    useEffect(() => {

        function handleClickOutside(event) {
            if (bellRef.current && !bellRef.current.contains(event.target)) {
                setBellOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () =>
            document.removeEventListener("mousedown", handleClickOutside);

    }, []);

    const companyName = company?.company_name;

    return (

        <header className="topbar">

            <div className="topbar-title">

                <h1>
                    {companyName
                        ? `${saludoPorHora()}, ${companyName}`
                        : saludoPorHora()}
                </h1>

                <p>{fechaLarga()}</p>

            </div>

            <div className="topbar-actions">

                <label className="topbar-search">

                    <SearchIcon fontSize="small" />

                    <input
                        type="search"
                        placeholder="Buscar en tus vacantes…"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        aria-label="Buscar en tus vacantes"
                    />

                </label>

                <div className="topbar-bell" ref={bellRef}>

                    <button
                        className="bell-btn"
                        onClick={() => setBellOpen((open) => !open)}
                        aria-label="Notificaciones"
                        aria-expanded={bellOpen}
                    >
                        <BellIcon fontSize="small" />
                    </button>

                    {bellOpen && (

                        <div className="bell-popover">

                            <strong>Notificaciones</strong>

                            <p>
                                Aún no hay notificaciones. Se activarán
                                cuando conectemos las postulaciones de
                                candidatos.
                            </p>

                        </div>

                    )}

                </div>

                <button
                    className="new-job-btn"
                    onClick={() => navigate("/empresa/nueva-vacante")}
                >
                    <AddIcon fontSize="small" />
                    Publicar vacante
                </button>

            </div>

        </header>

    );

}

export default RecruiterTopbar;
