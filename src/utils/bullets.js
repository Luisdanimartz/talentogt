/*
  Viñetas automaticas y duraciones — compartido entre el CV del
  candidato y el formulario de vacantes de la empresa, para que
  TODO ChanceGT tenga el mismo formato ordenado.
*/

/* Al presionar Enter dentro del cuadro: nueva linea con viñeta */
export function manejarEnterConVineta(e, actualizar) {

    if (e.key !== "Enter") return;

    e.preventDefault();

    const campo = e.target;
    const { selectionStart, selectionEnd, value } = campo;

    const nuevo =
        value.slice(0, selectionStart) +
        "\n• " +
        value.slice(selectionEnd);

    actualizar(nuevo);

    /* Regresar el cursor justo despues de la viñeta nueva */
    requestAnimationFrame(() => {
        campo.setSelectionRange(selectionStart + 3, selectionStart + 3);
    });

}

/* Al entrar a un cuadro vacio: arrancar con viñeta */
export function vinetaInicial(e, value, actualizar) {

    if (!String(value || "").trim()) {
        actualizar("• ");
    }

}

/* Al salir del cuadro: cada linea con contenido queda con su viñeta */
export function normalizarVinetas(texto) {

    return String(texto || "")
        .split("\n")
        .map((linea) => {
            const limpia = linea.replace(/^\s*[•\-*]\s*/, "").trim();
            return limpia ? `• ${limpia}` : "";
        })
        .filter(Boolean)
        .join("\n");

}

/* "• Liderazgo integral..." -> "Liderazgo integral..." */
export function sinVineta(linea) {

    return String(linea || "").replace(/^\s*[•\-*]\s*/, "").trim();

}

/* Estilo de lineas guia para los cuadros con viñetas
   (solo en el editor; el PDF nunca las ve) */
export const ESTILO_RENGLONES = {
    "& textarea": {
        lineHeight: "30px",
        backgroundImage:
            "repeating-linear-gradient(transparent, transparent 29px, #E6E8EC 29px, #E6E8EC 30px)",
        backgroundAttachment: "local",
    },
};

/* ===== Duraciones de experiencia ===== */

export const MESES_NOMBRES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/*
  Duracion entre (mes, año) inicio y fin.
  Fin puede ser "actual" (sigue trabajando ahi).
  Devuelve { meses, texto } -> "1 año 6 meses"
*/
export function duracionEntre(mesInicio, anioInicio, mesFin, anioFin) {

    if (!mesInicio || !anioInicio) return null;

    const ahora = new Date();

    const fin = anioFin === "actual"
        ? { mes: ahora.getMonth() + 1, anio: ahora.getFullYear() }
        : { mes: Number(mesFin), anio: Number(anioFin) };

    if (!fin.mes || !fin.anio) return null;

    const meses =
        (fin.anio - Number(anioInicio)) * 12 +
        (fin.mes - Number(mesInicio));

    if (meses < 0) return null;

    const anios = Math.floor(meses / 12);
    const resto = meses % 12;

    const partes = [];

    if (anios > 0) partes.push(`${anios} ${anios === 1 ? "año" : "años"}`);
    if (resto > 0) partes.push(`${resto} ${resto === 1 ? "mes" : "meses"}`);

    return {
        meses,
        texto: partes.length > 0 ? partes.join(" ") : "Menos de un mes",
    };

}

/* "1 año 6 meses" -> 18 (para sumar la experiencia total del CV) */
export function duracionEnMeses(texto) {

    const t = String(texto || "");

    const anios = Number((t.match(/(\d+)\s*año/) || [])[1] || 0);
    const meses = Number((t.match(/(\d+)\s*mes/) || [])[1] || 0);

    if (anios || meses) return anios * 12 + meses;

    /* compatibilidad con perfiles viejos que guardaban "2" */
    const numero = Number(t);
    return Number.isFinite(numero) && numero > 0 ? numero * 12 : 0;

}

/* Reconstruir los selectores desde "Junio 2024 – Actualidad" */
export function parsearPeriodo(period) {

    const m = String(period || "").match(
        /(\w+)\s+(\d{4})\s*[–-]\s*(?:(\w+)\s+(\d{4})|Actualidad)/i
    );

    if (!m) return null;

    const buscarMes = (nombre) =>
        MESES_NOMBRES.findIndex(
            (mes) => mes.toLowerCase() === String(nombre).toLowerCase()
        ) + 1;

    return {
        mesInicio: String(buscarMes(m[1]) || ""),
        anioInicio: m[2] || "",
        mesFin: m[3] ? String(buscarMes(m[3]) || "") : "actual",
        anioFin: m[4] || "actual",
    };

}
