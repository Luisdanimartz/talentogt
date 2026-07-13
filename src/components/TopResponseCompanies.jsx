import { useEffect, useState } from "react";

import "../styles/TopResponseCompanies.css";
import { getTopResponseCompanies } from "../services/publicService";

/*
  Top empresas por tiempo de respuesta MAS RAPIDO. Dato 100% real:
  sale de cuanto tardo cada empresa en dar el primer cambio de
  estado a sus postulaciones (mismo criterio que Reportes). Solo
  entran empresas con al menos 3 postulaciones respondidas.
*/

function horasBonito(numero) {

    if (numero === null || numero === undefined) return "—";

    if (numero < 24) {
        return `${Math.round(numero)} h`;
    }

    return `${Math.round((numero / 24) * 10) / 10} días`;

}

function TopResponseCompanies() {

    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        getTopResponseCompanies(10).then(({ data }) => {
            setEmpresas(data || []);
            setLoading(false);
        });

    }, []);

    if (loading || empresas.length === 0) {
        return null;
    }

    return (

        <section className="top-response">

            <div className="top-response-container">

                <h2>Empresas más rápidas en responder</h2>

                <p className="top-response-sub">
                    Tiempo real desde que alguien se postula hasta la primera
                    respuesta — calculado de postulaciones reales, no estimado.
                </p>

                <div className="top-response-list">

                    {empresas.map((e, i) => (

                        <div className="top-response-item" key={`${e.company_name}-${i}`}>

                            <span className="top-response-rank">{i + 1}</span>

                            {e.logo ? (
                                <img src={e.logo} alt={e.company_name} />
                            ) : (
                                <span className="top-response-avatar">
                                    {e.company_name.charAt(0)}
                                </span>
                            )}

                            <span className="top-response-name">
                                {e.company_name}
                            </span>

                            <span className="top-response-time">
                                {horasBonito(e.horas_respuesta_promedio)}
                            </span>

                        </div>

                    ))}

                </div>

            </div>

        </section>

    );

}

export default TopResponseCompanies;
