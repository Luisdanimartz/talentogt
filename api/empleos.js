/*
  Paginas de listado renderizadas por servidor. Aqui esta la cola larga.

    /empleos                                   todas las vacantes
    /empleos/en/guatemala                      por departamento
    /empleos/en/guatemala/mixco                por municipio
    /empleos/de/contabilidad                   por categoria

  Cada combinacion es una URL propia, con su titulo, su conteo y su
  contenido. Es exactamente la estrategia que usa Trabajos Diarios con
  /ofertas-trabajo/de-nocturno/en-guatemala, y es de donde sale la
  mayor parte de su trafico organico.

  Con 22 departamentos y 340 municipios, esto genera cientos de
  paginas de aterrizaje sin escribir ninguna a mano.
*/

import {
  SITIO,
  consultar,
  esc,
  formatoSalario,
  paginaHtml,
  bloqueSeo,
} from "./_lib.js";

/* Misma logica que public.slugify() en la migracion 062, para que
   las URL que arma el servidor calcen con las de la base. */
function slugify(texto) {

  const sinAcentos = String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return sinAcentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

}

export default async function handler(req, res) {

  const depSlug  = String(req.query.departamento || "").trim();
  const muniSlug = String(req.query.municipio || "").trim();
  const catSlug  = String(req.query.categoria || "").trim();

  try {

    /* --- Resolver el filtro contra los catalogos --- */

    let departamento = null;
    let municipio    = null;
    let categoria    = null;

    if (depSlug) {
      const deps = await consultar("departments?select=id,name");
      departamento = deps.find((d) => slugify(d.name) === depSlug) || null;

      if (!departamento) return responder404(res);

      if (muniSlug) {
        const munis = await consultar(
          `municipalities?select=id,name&department_id=eq.${departamento.id}`
        );
        municipio = munis.find((m) => slugify(m.name) === muniSlug) || null;

        if (!municipio) return responder404(res);
      }
    }

    if (catSlug) {
      const cats = await consultar("job_categories?select=id,name");
      categoria = cats.find((c) => slugify(c.name) === catSlug) || null;

      if (!categoria) return responder404(res);
    }

    /* --- Traer las vacantes (limitadas: esto es una pagina publica,
           no el panel) --- */

    let filtro = "";
    if (municipio)         filtro += `&municipality_id=eq.${municipio.id}`;
    else if (departamento) filtro += `&department_id=eq.${departamento.id}`;
    if (categoria)         filtro += `&category_id=eq.${categoria.id}`;

    const vacantes = await consultar(
      "jobs?select=" +
      [
        "slug", "title", "salary_min", "salary_max", "work_mode",
        "published_at",
        "departments(name)",
        "municipalities(name)",
        "company_profiles!inner(company_name,status)",
      ].join(",") +
      "&status=eq.published" +
      "&company_profiles.status=eq.activa" +
      filtro +
      "&order=published_at.desc" +
      "&limit=60"
    );

    /* --- Armar textos --- */

    const lugar = municipio
      ? `${municipio.name}, ${departamento.name}`
      : departamento
        ? departamento.name
        : "Guatemala";

    const que = categoria ? categoria.name : "empleo";

    const titulo = vacantes.length
      ? `${vacantes.length} ofertas de ${que} en ${lugar} | ChanceGT`
      : `Ofertas de ${que} en ${lugar} | ChanceGT`;

    const descripcion =
      `Vacantes de ${que} en ${lugar}, todas con salario visible y fecha ` +
      `de resolucion. Postulate en ChanceGT y segui tu proceso en todo momento.`;

    let ruta = "/empleos";
    if (departamento) ruta += `/en/${slugify(departamento.name)}`;
    if (municipio)    ruta += `/${slugify(municipio.name)}`;
    if (categoria && !departamento) ruta += `/de/${slugify(categoria.name)}`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=600, stale-while-revalidate=1200");

    res.status(200).send(paginaHtml({
      titulo,
      descripcion,
      canonical: `${SITIO}${ruta}`,
      /* Una pagina de listado sin resultados no aporta nada a Google
         y diluye el sitio. Se sirve, pero sin indexar. */
      robots: vacantes.length ? "index, follow" : "noindex, follow",
      contenido: contenido(vacantes, lugar, que),
    }));

  } catch (error) {

    console.error("Error armando el listado:", error);

    /* Ante un fallo, se devuelve el cascaron para que la aplicacion
       resuelva del lado del cliente. Nunca una pagina de error. */
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(paginaHtml({
      titulo: "Vacantes en Guatemala | ChanceGT",
      descripcion: "Vacantes con salario visible y fecha de resolucion.",
      canonical: `${SITIO}/empleos`,
      contenido: "",
    }));

  }

}


function responder404(res) {

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  res.status(404).send(paginaHtml({
    titulo: "Pagina no encontrada | ChanceGT",
    descripcion: "Consulta las vacantes disponibles en ChanceGT.",
    canonical: `${SITIO}/empleos`,
    robots: "noindex, follow",
    contenido: bloqueSeo(
      `<h1 style="font-family:Sora,sans-serif;">No encontramos esa pagina</h1>
       <p><a href="/empleos">Ver todas las vacantes</a></p>`
    ),
  }));

}


function contenido(vacantes, lugar, que) {

  if (!vacantes.length) {
    return bloqueSeo(`
      <h1 style="font-family:Sora,sans-serif;font-size:26px;">Ofertas de ${esc(que)} en ${esc(lugar)}</h1>
      <p>Por el momento no hay vacantes publicadas en esta busqueda.</p>
      <p><a href="/empleos">Ver todas las vacantes</a></p>
    `);
  }

  const tarjetas = vacantes.map((v) => {

    const empresa = v.company_profiles?.company_name || "Empresa";
    const muni    = v.municipalities?.name || "";
    const depa    = v.departments?.name || "";
    const donde   = muni ? `${muni}, ${depa}` : depa;

    return `
      <li style="border:1px solid #DFE4EA;border-radius:8px;padding:16px;margin-bottom:12px;list-style:none;">
        <h2 style="font-family:Sora,sans-serif;font-size:18px;margin:0 0 6px;">
          <a href="/empleos/${esc(v.slug)}" style="color:#0B2447;text-decoration:none;">${esc(v.title)}</a>
        </h2>
        <p style="margin:0 0 4px;color:#5C6B7A;font-size:14px;">${esc(empresa)} · ${esc(donde)}</p>
        <p style="margin:0;color:#0E8F73;font-weight:600;">${esc(formatoSalario(v.salary_min, v.salary_max))}</p>
      </li>`;

  }).join("");

  return bloqueSeo(`
    <h1 style="font-family:Sora,sans-serif;font-size:26px;margin:0 0 6px;">
      ${vacantes.length} ofertas de ${esc(que)} en ${esc(lugar)}
    </h1>
    <p style="color:#5C6B7A;margin:0 0 20px;">Todas con salario visible y fecha de resolucion.</p>
    <ul style="padding:0;margin:0;">${tarjetas}</ul>
  `);

}
