import { useEffect, useState } from "react";

import "../styles/CompanyLogos.css";
import { getFeaturedCompanies, getCollaboratorCompanies } from "../services/publicService";

/*
  Carrusel de logos. Nada inventado: solo empresas reales, activas,
  marcadas desde el panel de administrador. Si todavia no hay
  ninguna, la seccion simplemente no se muestra.

  modo="vip"          -> empresas con plan VIP (pagan)
  modo="colaboradora" -> empresas que ayudan con retroalimentacion
*/

const CONFIG = {
    vip: {
        cargar: getFeaturedCompanies,
        titulo: "Empresas destacadas en ChanceGT",
        subtitulo:
            "Calificadas con estrellas reales: responden a sus candidatos.",
        pendiente: {
            etiqueta: "Próximamente",
            texto:
                "Aquí van a aparecer las empresas mejor calificadas de " +
                "ChanceGT — las que responden a sus candidatos. El lugar " +
                "se gana respondiendo, no pagando.",
        },
    },
    colaboradora: {
        cargar: getCollaboratorCompanies,
        titulo: "Empresas que están cambiando cómo se recluta en Guatemala",
        pendiente: {
            etiqueta: "Próximamente",
            texto:
                "Aquí van a aparecer los logos de las empresas que colaboran " +
                "con ChanceGT dándonos su retroalimentación — comprometidas " +
                "a cambiar la forma en que se recluta en Guatemala.",
        },
    },
};

function CompanyLogos({ modo = "vip" }) {

    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);

    const config = CONFIG[modo] || CONFIG.vip;

    useEffect(() => {

        config.cargar().then(({ data }) => {
            setEmpresas(data || []);
            setLoading(false);
        });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modo]);

    if (loading) {
        return null;
    }

    if (empresas.length === 0) {

        if (!config.pendiente) return null;

        return (
            <section className="company-logos company-logos-pendiente">

                <div className="logos-container">

                    <h2>{config.titulo}</h2>

                    <div className="logos-pendiente-box">

                        <span className="logos-pendiente-tag">
                            {config.pendiente.etiqueta}
                        </span>

                        <p>{config.pendiente.texto}</p>

                    </div>

                </div>

            </section>
        );

    }

    /* Con pocos logos la tira animada se ve rota: mostramos
       tarjetas estaticas centradas. La animacion continua solo
       tiene sentido a partir de 5 logos. */
    const usarTira = empresas.length >= 5;

    if (!usarTira) {

        return (
            <section className="company-logos">

                <div className="logos-container">

                    <h2>{config.titulo}</h2>

                    {config.subtitulo && (
                        <p className="logos-subtitulo">{config.subtitulo}</p>
                    )}

                    <div className="logos-grid">

                        {empresas.map((empresa) => (
                            <div className="logo-card" key={empresa.id}>
                                <img
                                    src={empresa.logo}
                                    alt={empresa.company_name}
                                    title={empresa.company_name}
                                />
                                <span>{empresa.company_name}</span>
                                {empresa.estrellas && (
                                    <span
                                        className="logo-estrellas"
                                        aria-label={`${empresa.estrellas} de 5 estrellas`}
                                    >
                                        {"★".repeat(empresa.estrellas)}
                                        {"☆".repeat(5 - empresa.estrellas)}
                                    </span>
                                )}
                            </div>
                        ))}

                    </div>

                </div>

            </section>
        );

    }

    /* Duplicado para que la animacion de deslizar sea continua */
    const tira = [...empresas, ...empresas];

    return (
        <section className="company-logos">

            <div className="logos-container">

                <h2>{config.titulo}</h2>

                <div className="logos-slider">

                    <div className="logos-track">

                        {tira.map((empresa, i) => (
                            <img
                                key={`${empresa.id}-${i}`}
                                src={empresa.logo}
                                alt={empresa.company_name}
                                title={empresa.company_name}
                            />
                        ))}

                    </div>

                </div>

            </div>

        </section>
    );
}

export default CompanyLogos;
