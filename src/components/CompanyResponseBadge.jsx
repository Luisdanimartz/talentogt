import { useEffect, useState } from "react";

import { getCompanyResponseStats } from "../services/jobService";

/*
  Estrellas de respuesta de la empresa — con datos REALES.

  5 estrellas = responde todas sus postulaciones.
  Si la empresa aun no tiene postulaciones, lo decimos con
  honestidad en vez de inventarle una nota.
*/

function CompanyResponseBadge({ companyId, companyName }) {

    const [stats, setStats] = useState(null);

    useEffect(() => {

        if (!companyId) return;

        let activo = true;

        getCompanyResponseStats(companyId).then(({ data }) => {

            if (activo && data && data.length > 0) {
                setStats(data[0]);
            }

        });

        return () => {
            activo = false;
        };

    }, [companyId]);

    if (!stats) return null;

    const total = Number(stats.total) || 0;

    if (total === 0) {

        return (
            <div className="response-badge response-new">
                Empresa nueva en ChanceGT — aún sin historial de
                respuesta a candidatos
            </div>
        );

    }

    const responded = Number(stats.responded) || 0;
    const porcentaje = Math.round((responded / total) * 100);
    const estrellas = Math.max(1, Math.round((responded / total) * 5));

    return (

        <div
            className="response-badge"
            title={`${responded} de ${total} postulaciones respondidas`}
        >

            <span className="response-stars" aria-hidden="true">
                {"★".repeat(estrellas)}
                {"☆".repeat(5 - estrellas)}
            </span>

            <span className="response-text">
                {companyName || "Esta empresa"} responde al{" "}
                {porcentaje}% de sus candidatos
            </span>

        </div>

    );

}

export default CompanyResponseBadge;
