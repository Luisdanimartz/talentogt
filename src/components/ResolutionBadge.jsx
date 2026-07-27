import { compromisoParaCandidato } from "../utils/resolution";

import "../styles/ResolutionBadge.css";

/*
  Insignia de compromiso de respuesta.

  Es lo que ninguna otra bolsa de trabajo de Guatemala le dice al
  candidato: cuando le van a responder, y que pasa si no le
  responden. Los datos son reales (jobs.resolution_deadline), no
  hay promesas inventadas.

  variante:
    "completa"  -> tarjeta con detalle (detalle de vacante, postulacion)
    "compacta"  -> una linea (tarjetas del listado)
*/

function ResolutionBadge({ job, variante = "completa" }) {

    const compromiso = compromisoParaCandidato(job);

    if (!compromiso) return null;

    if (variante === "compacta") {

        return (
            <span className={`res-chip res-${compromiso.tono}`}>
                {compromiso.tono === "vencido"
                    ? "Plazo vencido"
                    : compromiso.titulo}
            </span>
        );

    }

    return (

        <div className={`res-badge res-${compromiso.tono}`}>

            <strong>{compromiso.titulo}</strong>

            <span>{compromiso.detalle}</span>

            {compromiso.nota && (
                <small className="res-nota">{compromiso.nota}</small>
            )}

        </div>

    );

}

export default ResolutionBadge;
