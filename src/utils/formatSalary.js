/*
  Formato único de salario para toda la app.

  Guardamos el salario en salary_min y salary_max (mismas columnas
  de siempre en Supabase, sin migración). Cuando la vacante tiene
  un solo salario, ambos valores son iguales y mostramos uno solo:
  "Q10,000". Las vacantes viejas con rango siguen mostrándose
  como "Q10,000 – Q15,000".
*/

export function formatSalary(min, max) {

    if (!min && !max) return "No especificado";

    const q = (n) => `Q${Number(n).toLocaleString("en-US")}`;

    if (min && max && Number(min) !== Number(max)) {
        return `${q(min)} – ${q(max)}`;
    }

    return q(min || max);

}

/* "10000" -> "10,000" mientras la persona escribe en el formulario */
export function formatMiles(texto) {

    const digitos = String(texto).replace(/\D/g, "");

    if (!digitos) return "";

    return Number(digitos).toLocaleString("en-US");

}

/* "10,000" -> 10000 (número listo para guardar en la base) */
export function salarioANumero(texto) {

    const digitos = String(texto || "").replace(/\D/g, "");

    return digitos ? Number(digitos) : null;

}
