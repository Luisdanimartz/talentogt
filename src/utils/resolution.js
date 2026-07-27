/*
  Compromiso de respuesta de ChanceGT.

  Un solo lugar para las cuentas y los textos del plazo, para que
  la empresa, el candidato y el listado publico digan exactamente
  lo mismo. Ver database/055_compromiso_de_respuesta.sql.
*/

/*
  Dias que dura una publicacion (lo que la empresa compra).
  Tiene que ser el MISMO numero que public.cgt_dias_vigencia()
  en database/057_compromiso_dentro_de_vigencia.sql.
*/
export const DIAS_VIGENCIA = 30;

/* Por defecto el compromiso llega hasta el final de la vigencia:
   asi la empresa nunca pierde dias que ya pago. */
export const DIAS_COMPROMISO_DEFAULT = DIAS_VIGENCIA;

/* Limites que tambien valida la base de datos (no cambiar solo aqui) */
export const MAX_AMPLIACIONES = 2;
export const MAX_DIAS_AMPLIACION = 15;

/* Opciones del boton "Ampliar plazo" */
export const OPCIONES_AMPLIACION = [
    { value: 7, label: "7 dias mas" },
    { value: 15, label: "15 dias mas" },
];

/* "YYYY-MM-DD" de hoy, en hora local (no UTC: evita el error
   de un dia de diferencia en Guatemala) */
export function hoyISO() {

    const hoy = new Date();
    const pad = (n) => String(n).padStart(2, "0");

    return `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}`;

}

/* Fecha sugerida al crear una vacante: hoy + 21 dias */
export function fechaCompromisoPorDefecto(dias = DIAS_COMPROMISO_DEFAULT) {

    const fecha = new Date();
    fecha.setDate(fecha.getDate() + dias);

    const pad = (n) => String(n).padStart(2, "0");

    return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;

}

/*
  Ultimo dia al que puede llegar el compromiso: el final de la
  vigencia pagada. Se cuenta desde el dia en que la vacante empieza
  a estar visible (hoy, o la fecha programada si la programaron).
*/
export function fechaMaximaCompromiso(inicio) {

    const base = inicio ? new Date(inicio) : new Date();

    if (Number.isNaN(base.getTime())) {
        return fechaCompromisoPorDefecto(DIAS_VIGENCIA);
    }

    base.setDate(base.getDate() + DIAS_VIGENCIA);

    const pad = (n) => String(n).padStart(2, "0");

    return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`;

}

/* "2026-08-15" -> Date local a mediodia (asi no se corre de dia) */
function aFechaLocal(valor) {

    if (!valor) return null;

    const soloFecha = String(valor).slice(0, 10);
    const [anio, mes, dia] = soloFecha.split("-").map(Number);

    if (!anio || !mes || !dia) return null;

    return new Date(anio, mes - 1, dia, 12, 0, 0);

}

/* Cuantos dias faltan para el compromiso (negativo si ya vencio) */
export function diasParaResolver(deadline) {

    const fecha = aFechaLocal(deadline);
    if (!fecha) return null;

    const hoy = new Date();
    hoy.setHours(12, 0, 0, 0);

    return Math.round((fecha.getTime() - hoy.getTime()) / 86400000);

}

/*
  "Supervisor de ventas · 27 jul" — para distinguir dos vacantes
  con el mismo titulo. Pasa seguido: la misma plaza se vuelve a
  publicar meses despues y en las listas se ven identicas, aunque
  por dentro son procesos totalmente distintos (cada vacante tiene
  su propio id y sus propios candidatos).
*/
export function tituloConFecha(titulo, fecha) {

    if (!fecha) return titulo || "";

    const d = new Date(fecha);

    if (Number.isNaN(d.getTime())) return titulo || "";

    const corta = d.toLocaleDateString("es-GT", {
        day: "numeric",
        month: "short",
    });

    return `${titulo} · ${corta}`;

}

/* "15 de agosto" */
export function fechaLarga(deadline) {

    const fecha = aFechaLocal(deadline);
    if (!fecha) return "";

    return fecha.toLocaleDateString("es-GT", {
        day: "numeric",
        month: "long",
    });

}

/*
  El texto que ve el CANDIDATO en la vacante y en su postulacion.
  Devuelve null si la vacante no tiene compromiso (vacantes viejas).

  tono: "ok" | "pronto" | "vencido"
*/
export function compromisoParaCandidato(job) {

    if (!job?.resolution_deadline) return null;

    const dias = diasParaResolver(job.resolution_deadline);
    if (dias === null) return null;

    const ampliaciones = Number(job.deadline_extensions) || 0;

    const nota =
        ampliaciones > 0
            ? ampliaciones === 1
                ? "La empresa amplio el plazo una vez."
                : `La empresa amplio el plazo ${ampliaciones} veces.`
            : null;

    if (dias < 0) {
        return {
            tono: "vencido",
            titulo: "El plazo de esta empresa ya vencio",
            detalle:
                "ChanceGT esta cerrando el proceso y avisando a todos los candidatos.",
            nota,
        };
    }

    if (dias === 0) {
        return {
            tono: "pronto",
            titulo: "La empresa resuelve hoy",
            detalle: "Hoy vence el plazo que se comprometio a cumplir.",
            nota,
        };
    }

    return {
        tono: dias <= 3 ? "pronto" : "ok",
        titulo: `Respuesta antes del ${fechaLarga(job.resolution_deadline)}`,
        detalle:
            dias === 1
                ? "Falta 1 dia. Si no responde, ChanceGT cierra el proceso y te avisa."
                : `Faltan ${dias} dias. Si no responde, ChanceGT cierra el proceso y te avisa.`,
        nota,
    };

}

/*
  El texto que ve la EMPRESA en su bandeja de candidatos.
  Aqui el tono es de urgencia, no informativo.
*/
export function compromisoParaEmpresa(deadline, pendientes = 0) {

    const dias = diasParaResolver(deadline);
    if (dias === null) return null;

    if (dias < 0) {
        return {
            tono: "vencido",
            texto:
                "Tu plazo vencio. ChanceGT esta resolviendo por ti y eso baja tu reputacion publica.",
        };
    }

    if (dias <= 3) {
        return {
            tono: "pronto",
            texto:
                pendientes > 0
                    ? `Te ${dias === 0 ? "vence hoy" : dias === 1 ? "queda 1 dia" : `quedan ${dias} dias`} y tienes ${pendientes} candidato(s) sin respuesta. Si no resuelves, el sistema lo hara por ti.`
                    : `Te ${dias === 0 ? "vence hoy" : dias === 1 ? "queda 1 dia" : `quedan ${dias} dias`} para cerrar este proceso.`,
        };
    }

    return {
        tono: "ok",
        texto: `Te comprometiste a resolver antes del ${fechaLarga(deadline)} (faltan ${dias} dias).`,
    };

}
