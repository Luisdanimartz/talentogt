import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/Hero.css";
import { getPlatformStats } from "../services/publicService";

function numeroBonito(n) {
    if (n === null || n === undefined) return "—";
    return n.toLocaleString("es-GT");
}

function Hero() {

    const navigate = useNavigate();

    const [busqueda, setBusqueda] = useState("");
    const [stats, setStats] = useState(null);

    useEffect(() => {

        getPlatformStats().then(({ data }) => {
            setStats(data || null);
        });

    }, []);

    function handleBuscar() {

        if (busqueda.trim()) {
            navigate(`/vacantes?q=${encodeURIComponent(busqueda.trim())}`);
        } else {
            navigate("/vacantes");
        }

    }

    return (
        <section className="hero">

            <div className="hero-container">

                {/* ================= IZQUIERDA ================= */}

                <div className="hero-left">

                    <span className="hero-badge">
                        🇬🇹 Plataforma de empleo para Guatemala
                    </span>

                    <h1>
                        Encuentra el
                        <br />
                        empleo que
                        <br />
                        <span>mereces.</span>
                    </h1>

                    <p>
                        La plataforma donde las empresas se comprometen a responder
                        a cada candidato durante todo el proceso de selección.
                    </p>

                    {/* ================= BUSCADOR ================= */}

                    <div className="hero-search">

                        <input
                            type="text"
                            placeholder="Puesto, empresa o palabra clave"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                        />

                        <button onClick={handleBuscar}>
                            Buscar empleo
                        </button>

                    </div>

                    {/* ================= ETIQUETAS ================= */}

                    <div className="hero-tags">

                        <span>Ventas</span>
                        <span>Atención al cliente</span>
                        <span>Tecnología</span>
                        <span>Marketing</span>
                        <span>Recursos Humanos</span>

                    </div>

                    {/* ================= ESTADÍSTICAS REALES ================= */}

                    <div className="hero-stats">

                        <div className="stat-box">
                            <h3>{numeroBonito(stats?.vacantes_activas)}</h3>
                            <p>Vacantes activas</p>
                        </div>

                        <div className="stat-box">
                            <h3>{numeroBonito(stats?.empresas_registradas)}</h3>
                            <p>Empresas registradas</p>
                        </div>

                        <div className="stat-box">
                            <h3>{numeroBonito(stats?.candidatos_activos)}</h3>
                            <p>Candidatos activos</p>
                        </div>

                        <div className="stat-box">
                            <h3>
                                {stats?.porcentaje_empresas_responden !== undefined
                                    ? `${stats.porcentaje_empresas_responden}%`
                                    : "—"}
                            </h3>
                            <p>Empresas responden</p>
                        </div>

                    </div>

                </div>

                {/* ================= DERECHA ================= */}

                <div className="hero-right">

                    <div className="hero-photo">

                        <img
                            className="hero-people"
                            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80"
                            alt="Ejecutiva profesional en oficina"
                        />

                    </div>

                </div>

            </div>

        </section>
    );
}

export default Hero;
