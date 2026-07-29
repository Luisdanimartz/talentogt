/*
  /empleos/{slug}

  Devuelve la pagina de una vacante ya renderizada por el servidor:
  titulo real, meta description, Open Graph y JSON-LD de JobPosting,
  que es el formato que Google for Jobs necesita para mostrar la
  vacante en el recuadro de empleos de los resultados de busqueda.

  Despues de eso, React monta encima y la experiencia sigue siendo
  la de siempre.
*/

import {
  SITIO,
  consultar,
  esc,
  formatoSalario,
  resumen,
  paginaHtml,
  bloqueSeo,
} from "./_lib.js";

export default async function handler(req, res) {

  const slug = String(req.query.slug || "").trim();

  if (!slug) {
    res.status(404).send(paginaNoEncontrada());
    return;
  }

  /* ------------------------------------------------------------------
     Compatibilidad con las URL viejas: /vacantes/{uuid}

     Si lo que llega es un UUID, se busca la vacante, se averigua su
     slug y se responde con una redireccion 301 permanente. Asi no se
     pierde nada de lo que ya este indexado o compartido por WhatsApp,
     y Google traslada la autoridad a la URL nueva.
     ------------------------------------------------------------------ */

  const esUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

  if (esUuid) {

    try {

      const filas = await consultar(
        `jobs?select=slug&id=eq.${encodeURIComponent(slug)}&limit=1`
      );

      const destino = filas?.[0]?.slug;

      if (destino) {
        res.setHeader("Location", `${SITIO}/empleos/${destino}`);
        res.setHeader("Cache-Control", "public, max-age=0, s-maxage=86400");
        res.status(301).end();
        return;
      }

    } catch (error) {
      console.error("Error resolviendo el UUID antiguo:", error);
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(404).send(paginaNoEncontrada());
    return;

  }

  let vacante = null;

  try {

    const filas = await consultar(
      "jobs?select=" +
      [
        "id", "slug", "title", "description", "requirements", "benefits",
        "salary_min", "salary_max", "work_mode", "published_at",
        "resolution_deadline", "status", "employment_type_id",
        "departments(name)",
        "municipalities(name)",
        "company_profiles!inner(company_name,logo,status)",
      ].join(",") +
      `&slug=eq.${encodeURIComponent(slug)}` +
      "&status=eq.published" +
      "&company_profiles.status=eq.activa" +
      "&limit=1"
    );

    vacante = filas?.[0] || null;

  } catch (error) {
    console.error("Error consultando la vacante:", error);
  }

  /* Si la vacante ya no existe o se cerro, no queremos que Google la
     siga indexando. Se responde 404 y la aplicacion muestra su
     propia pantalla. */
  if (!vacante) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60");
    res.status(404).send(paginaNoEncontrada());
    return;
  }

  const empresa     = vacante.company_profiles?.company_name || "Empresa";
  const municipio   = vacante.municipalities?.name || "";
  const departamento= vacante.departments?.name || "Guatemala";
  const salario     = formatoSalario(vacante.salary_min, vacante.salary_max);
  const ubicacion   = municipio ? `${municipio}, ${departamento}` : departamento;
  const canonical   = `${SITIO}/empleos/${vacante.slug}`;

  const titulo = `${vacante.title} en ${ubicacion} | ${empresa} | ChanceGT`;

  const descripcion = resumen(
    `${vacante.title} en ${ubicacion}. Salario ${salario}. ` +
    `${empresa} publica esta vacante en ChanceGT con salario visible ` +
    `y fecha de resolucion. ${vacante.description || ""}`
  );

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  /* Cache en el borde de Vercel: rapido para el visitante, y se
     refresca solo cada 5 minutos. */
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=600");

  res.status(200).send(paginaHtml({
    titulo,
    descripcion,
    canonical,
    jsonLd: jsonLdVacante(vacante, empresa, municipio, departamento, canonical),
    contenido: contenidoVisible(vacante, empresa, ubicacion, salario),
  }));

}


/* ---------------------------------------------------------------------
   JSON-LD de JobPosting: la puerta a Google for Jobs
   --------------------------------------------------------------------- */

function jsonLdVacante(v, empresa, municipio, departamento, canonical) {

  const cuerpo = [v.description, v.requirements, v.benefits]
    .filter(Boolean)
    .join("\n\n");

  const datos = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: v.title,
    description: cuerpo || v.title,
    datePosted: v.published_at,
    hiringOrganization: {
      "@type": "Organization",
      name: empresa,
      sameAs: SITIO,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: municipio || departamento,
        addressRegion: departamento,
        addressCountry: "GT",
      },
    },
    directApply: true,
    url: canonical,
  };

  /* validThrough solo si hay fecha de resolucion. Google penaliza
     las vacantes sin fecha de vencimiento que quedan colgadas. */
  if (v.resolution_deadline) {
    datos.validThrough = new Date(v.resolution_deadline).toISOString();
  }

  /* baseSalary solo cuando hay monto real. Nunca inventamos un rango:
     declararlo mal es peor que no declararlo. */
  if (v.salary_min || v.salary_max) {

    const min = Number(v.salary_min || v.salary_max);
    const max = Number(v.salary_max || v.salary_min);

    datos.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "GTQ",
      value: {
        "@type": "QuantitativeValue",
        minValue: min,
        maxValue: max,
        unitText: "MONTH",
      },
    };

  }

  /* Modalidad remota, si aplica */
  if (String(v.work_mode || "").toLowerCase().includes("remot")) {
    datos.jobLocationType = "TELECOMMUTE";
  }

  return `<script type="application/ld+json">${
    JSON.stringify(datos).replace(/</g, "\\u003c")
  }</script>`;

}


/* ---------------------------------------------------------------------
   Contenido visible: lo mismo que despues muestra React
   --------------------------------------------------------------------- */

function contenidoVisible(v, empresa, ubicacion, salario) {

  const lista = (texto) => {

    const lineas = String(texto || "")
      .split("\n")
      .map((l) => l.replace(/^[\s•\-*]+/, "").trim())
      .filter(Boolean);

    if (!lineas.length) return "";

    return `<ul style="line-height:1.8;padding-left:20px;">${
      lineas.map((l) => `<li>${esc(l)}</li>`).join("")
    }</ul>`;

  };

  return bloqueSeo(`
    <h1 style="font-family:Sora,sans-serif;font-size:28px;margin:0 0 8px;">${esc(v.title)}</h1>
    <p style="font-size:16px;color:#5C6B7A;margin:0 0 4px;">${esc(empresa)}</p>
    <p style="font-size:15px;color:#5C6B7A;margin:0 0 16px;">${esc(ubicacion)}${
      v.work_mode ? " · " + esc(v.work_mode) : ""
    }</p>
    <p style="font-size:20px;font-weight:700;color:#0E8F73;margin:0 0 20px;">${esc(salario)}</p>
    ${v.description ? `<h2 style="font-family:Sora,sans-serif;font-size:18px;">Descripcion</h2>${lista(v.description)}` : ""}
    ${v.requirements ? `<h2 style="font-family:Sora,sans-serif;font-size:18px;">Requisitos</h2>${lista(v.requirements)}` : ""}
    ${v.benefits ? `<h2 style="font-family:Sora,sans-serif;font-size:18px;">Beneficios</h2>${lista(v.benefits)}` : ""}
  `);

}


function paginaNoEncontrada() {

  return paginaHtml({
    titulo: "Vacante no disponible | ChanceGT",
    descripcion: "Esta vacante ya no esta disponible. Consulta las plazas abiertas en ChanceGT.",
    canonical: `${SITIO}/empleos`,
    robots: "noindex, follow",
    contenido: bloqueSeo(`
      <h1 style="font-family:Sora,sans-serif;">Esta vacante ya no esta disponible</h1>
      <p>El proceso pudo haberse cerrado. <a href="/empleos">Ver las vacantes abiertas</a>.</p>
    `),
  });

}
