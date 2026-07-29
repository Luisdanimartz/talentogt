/*
  /sitemap.xml

  Se arma en el momento a partir de la base, asi que nunca queda
  desactualizado: cada vacante nueva entra sola y cada vacante cerrada
  desaparece sola.

  Incluye:
    - las paginas fijas del sitio
    - una entrada por vacante publicada
    - una entrada por departamento
    - una entrada por municipio que tenga al menos una vacante

  No se listan municipios vacios a proposito: enviarle a Google cientos
  de paginas sin contenido hace mas mal que bien.
*/

import { SITIO, consultar } from "./_lib.js";

function slugify(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function url(loc, prioridad, frecuencia, fecha) {
  return `  <url>
    <loc>${loc}</loc>${fecha ? `
    <lastmod>${new Date(fecha).toISOString().slice(0, 10)}</lastmod>` : ""}
    <changefreq>${frecuencia}</changefreq>
    <priority>${prioridad}</priority>
  </url>`;
}

export default async function handler(req, res) {

  const entradas = [];

  /* --- Paginas fijas --- */

  entradas.push(url(`${SITIO}/`, "1.0", "daily"));
  entradas.push(url(`${SITIO}/empleos`, "0.9", "hourly"));
  entradas.push(url(`${SITIO}/planes`, "0.5", "monthly"));
  entradas.push(url(`${SITIO}/contacto`, "0.4", "monthly"));
  entradas.push(url(`${SITIO}/privacidad`, "0.2", "yearly"));
  entradas.push(url(`${SITIO}/terminos`, "0.2", "yearly"));

  try {

    /* --- Vacantes --- */

    const vacantes = await consultar(
      "jobs?select=slug,published_at,department_id,municipality_id" +
      ",company_profiles!inner(status)" +
      "&status=eq.published" +
      "&company_profiles.status=eq.activa" +
      "&order=published_at.desc" +
      "&limit=5000"
    );

    for (const v of vacantes) {
      if (!v.slug) continue;
      entradas.push(
        url(`${SITIO}/empleos/${v.slug}`, "0.8", "daily", v.published_at)
      );
    }

    /* --- Departamentos y municipios que si tienen vacantes --- */

    const departamentos = await consultar("departments?select=id,name");
    const municipios    = await consultar("municipalities?select=id,name,department_id");

    const depsConVacantes  = new Set(vacantes.map((v) => v.department_id));
    const munisConVacantes = new Set(vacantes.map((v) => v.municipality_id));

    const nombreDep = new Map(departamentos.map((d) => [d.id, d.name]));

    for (const d of departamentos) {
      if (!depsConVacantes.has(d.id)) continue;
      entradas.push(url(`${SITIO}/empleos/en/${slugify(d.name)}`, "0.7", "daily"));
    }

    for (const m of municipios) {
      if (!munisConVacantes.has(m.id)) continue;
      const dep = nombreDep.get(m.department_id);
      if (!dep) continue;
      entradas.push(
        url(`${SITIO}/empleos/en/${slugify(dep)}/${slugify(m.name)}`, "0.6", "daily")
      );
    }

    /* --- Categorias --- */

    const categorias = await consultar("job_categories?select=id,name");

    for (const c of categorias) {
      entradas.push(url(`${SITIO}/empleos/de/${slugify(c.name)}`, "0.6", "weekly"));
    }

  } catch (error) {
    /* Si la base falla, se entrega igual el sitemap con las paginas
       fijas. Un sitemap corto es mucho mejor que un error 500, que
       Google interpreta como sitio caido. */
    console.error("Error armando el sitemap:", error);
  }

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=7200");

  res.status(200).send(
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entradas.join("\n")}
</urlset>`
  );

}
