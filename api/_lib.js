/*
  Utilidades compartidas por las funciones de Vercel.

  Los archivos que empiezan con guion bajo NO se convierten en rutas,
  asi que este modulo es privado.

  Se consulta Supabase con fetch directo a PostgREST en lugar de usar
  @supabase/supabase-js: es una sola peticion, pesa menos en el arranque
  en frio de la funcion y no arrastra dependencias al servidor.
*/

export const SITIO = "https://www.chancegt.com";

export const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

export const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

/* Consulta a la API REST de Supabase con la llave anonima.
   Solo alcanza lo que las politicas RLS permiten al publico. */
export async function consultar(ruta) {

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Faltan las variables SUPABASE_URL y SUPABASE_ANON_KEY en Vercel."
    );
  }

  const respuesta = await fetch(`${SUPABASE_URL}/rest/v1/${ruta}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: "application/json",
    },
  });

  if (!respuesta.ok) {
    throw new Error(
      `Supabase respondio ${respuesta.status}: ${await respuesta.text()}`
    );
  }

  return await respuesta.json();

}

/* Escapa texto que va dentro del HTML. Sin esto, una vacante cuyo
   titulo traiga comillas o < rompe la pagina entera. */
export function esc(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* Escapa texto que va dentro de un bloque JSON-LD. */
export function escJson(texto) {
  return JSON.stringify(String(texto ?? "")).slice(1, -1);
}

/* Mismo formato de salario que usa la aplicacion
   (src/utils/formatSalary.js), replicado aqui porque la funcion
   corre en el servidor y no comparte el bundle del navegador. */
export function formatoSalario(min, max) {

  if (!min && !max) return "No especificado";

  const q = (n) => `Q${Number(n).toLocaleString("en-US")}`;

  if (min && max && Number(min) !== Number(max)) {
    return `${q(min)} – ${q(max)}`;
  }

  return q(min || max);

}

/* Recorta un texto para usarlo como meta description.
   Google muestra alrededor de 155 caracteres. */
export function resumen(texto, largo = 155) {

  const limpio = String(texto ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (limpio.length <= largo) return limpio;

  return limpio.slice(0, largo - 1).replace(/\s+\S*$/, "") + "…";

}

/*
  Envoltura HTML comun.

  Punto importante: el contenido renderizado por servidor se coloca
  DENTRO de #root. Cuando React monta, createRoot reemplaza ese
  contenido por la aplicacion real. Google ve el texto de inmediato,
  la persona tambien, y no hay encubrimiento porque lo que se sirve
  es exactamente lo mismo que despues pinta la aplicacion.
*/
export function paginaHtml({
  titulo,
  descripcion,
  canonical,
  imagen = `${SITIO}/og-chancegt.png`,
  jsonLd = "",
  contenido = "",
  robots = "index, follow",
}) {

  return `<!doctype html>
<html lang="es-GT">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}" />
<meta name="robots" content="${esc(robots)}" />
<link rel="canonical" href="${esc(canonical)}" />

<meta property="og:type" content="website" />
<meta property="og:site_name" content="ChanceGT" />
<meta property="og:locale" content="es_GT" />
<meta property="og:title" content="${esc(titulo)}" />
<meta property="og:description" content="${esc(descripcion)}" />
<meta property="og:url" content="${esc(canonical)}" />
<meta property="og:image" content="${esc(imagen)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(titulo)}" />
<meta name="twitter:description" content="${esc(descripcion)}" />
<meta name="twitter:image" content="${esc(imagen)}" />

<meta name="theme-color" content="#0B2447" />
${jsonLd}
<link rel="stylesheet" href="/assets/app.css" />
</head>
<body>
<div id="root">${contenido}</div>
<script type="module" src="/assets/app.js"></script>
</body>
</html>`;

}

/* Bloque de contenido visible mientras React arranca.
   Estilos en linea a proposito: no depende de que la hoja de estilos
   ya haya cargado. */
export function bloqueSeo(html) {
  return `<div style="max-width:900px;margin:0 auto;padding:24px;font-family:Inter,system-ui,sans-serif;color:#0B2447;">${html}</div>`;
}
