import { useEffect, useRef, useState } from "react";

import "../styles/Testimonials.css";
import { getCollaboratorCompanies } from "../services/publicService";

/*
  Empresas colaboradoras: carrusel con el logo y el comentario de
  cada empresa sobre como piensa apoyar el reclutamiento en
  Guatemala. Nada inventado: solo empresas reales activadas por el
  admin (is_collaborator + comentario). Mientras no haya ninguna,
  se muestra el aviso de "Proximamente".
*/

function iniciales(nombre) {

    return String(nombre || "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join("");

}

function Testimonials() {

    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandidos, setExpandidos] = useState({});

    const trackRef = useRef(null);

    useEffect(() => {

        getCollaboratorCompanies().then(({ data }) => {
            setEmpresas(data || []);
            setLoading(false);
        });

    }, []);

    if (loading) {
        return null;
    }

    if (empresas.length === 0) {

        return (
            <section className="testimonios">

                <div className="testi-container">

                    <h2>Empresas que están cambiando cómo se recluta en Guatemala</h2>

                    <div className="testi-pendiente">

                        <span className="testi-pendiente-tag">Próximamente</span>

                        <p>
                            Aquí van a aparecer los logos y comentarios de las
                            empresas que colaboran con ChanceGT — comprometidas
                            a cambiar la forma en que se recluta en Guatemala.
                        </p>

                    </div>

                </div>

            </section>
        );

    }

    function desplazar(direccion) {

        const track = trackRef.current;
        if (!track) return;

        const tarjeta = track.querySelector(".testi-card");
        const paso = tarjeta ? tarjeta.offsetWidth + 24 : 360;

        track.scrollBy({ left: direccion * paso, behavior: "smooth" });

    }

    function alternarExpandido(id) {
        setExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));
    }

    const mostrarFlechas = empresas.length > 3;

    return (
        <section className="testimonios">

            <div className="testi-container">

                <h2>Empresas que están cambiando cómo se recluta en Guatemala</h2>

                <p className="testi-subtitulo">
                    Empresas colaboradoras y su visión de cómo apoyar el
                    reclutamiento en el país.
                </p>

                <div className="testi-carrusel">

                    {mostrarFlechas && (
                        <button
                            className="testi-flecha"
                            aria-label="Anterior"
                            onClick={() => desplazar(-1)}
                        >
                            ‹
                        </button>
                    )}

                    <div className="testi-track" ref={trackRef}>

                        {empresas.map((e) => (

                            <article className="testi-card" key={e.id}>

                                {e.logo ? (
                                    <img
                                        className="testi-logo"
                                        src={e.logo}
                                        alt={e.company_name}
                                    />
                                ) : (
                                    <div className="testi-logo-fallback">
                                        {iniciales(e.company_name)}
                                    </div>
                                )}

                                {e.collaborator_comment && (
                                    <>
                                        <p
                                            className={
                                                expandidos[e.id]
                                                    ? "testi-cita expandida"
                                                    : "testi-cita"
                                            }
                                        >
                                            “{e.collaborator_comment}”
                                        </p>

                                        {e.collaborator_comment.length > 220 && (
                                            <button
                                                className="testi-vermas"
                                                onClick={() => alternarExpandido(e.id)}
                                            >
                                                {expandidos[e.id] ? "Ver menos" : "Ver más"}
                                            </button>
                                        )}
                                    </>
                                )}

                                <div className="testi-persona">

                                    <strong>{e.company_name}</strong>

                                    <span>Empresa colaboradora</span>

                                </div>

                            </article>

                        ))}

                    </div>

                    {mostrarFlechas && (
                        <button
                            className="testi-flecha"
                            aria-label="Siguiente"
                            onClick={() => desplazar(1)}
                        >
                            ›
                        </button>
                    )}

                </div>

            </div>

        </section>
    );

}

export default Testimonials;
