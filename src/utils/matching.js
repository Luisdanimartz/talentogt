/*
  Motor de coincidencias de ChanceGT — version 2 (estilo ATS).

  Compara el perfil REAL del candidato contra la vacante REAL y
  devuelve verificaciones concretas y comprobables. El puntaje es
  cuantas verificaciones se cumplen — sin porcentajes inventados.

  Novedades v2:
   - Pretension salarial vs rango de la plaza (con bandera de
     descarte visible para el reclutador).
   - Palabras clave de los REQUISITOS (estilo ATS): cuantas
     aparecen en el perfil del candidato y cuales.
*/

/* Minusculas y sin tildes, para comparar sin sorpresas */
function normalizar(texto) {

    return String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

}

/* Palabras significativas (5+ letras) de un texto */
function palabrasDe(texto, minimo = 4) {

    return normalizar(texto)
        .split(/[^a-zñ]+/)
        .filter((palabra) => palabra.length > minimo);

}

/*
  Palabras genericas que no cuentan como "palabra clave"
  aunque aparezcan en los requisitos.
*/
const PALABRAS_GENERICAS = new Set([
    "experiencia", "conocimiento", "conocimientos", "requisitos",
    "principales", "funciones", "empresa", "empresas", "puesto",
    "plaza", "vacante", "trabajo", "laboral", "laborales",
    "minimo", "minima", "deseable", "indispensable", "preferible",
    "manejo", "capacidad", "habilidad", "habilidades", "nivel",
    "salario", "horario", "disponibilidad", "responsable",
    "cerrado", "pensum", "carrera", "titulo", "sobre", "entre",
    "hasta", "desde", "donde", "cuando", "tanto", "tambien",
    "otros", "otras", "todas", "todos", "buena", "bueno",
]);

/* Extrae hasta `max` palabras clave de los requisitos */
function palabrasClaveDe(job, max = 12) {

    const fuente = [job.requirements, job.description].join(" ");

    const unicas = [];

    for (const palabra of palabrasDe(fuente)) {

        if (PALABRAS_GENERICAS.has(palabra)) continue;
        if (unicas.includes(palabra)) continue;

        unicas.push(palabra);

        if (unicas.length >= max) break;

    }

    return unicas;

}

/* Todo el texto del candidato donde buscar palabras clave */
function textoDelCandidato(profile) {

    return normalizar(
        [
            profile.profession,
            profile.skills,
            profile.experience,
            profile.education_level,
            profile.education_institution,
        ].join(" ")
    );

}

/*
  computeMatches(profile, job, jobDepartmentName)

  Devuelve:
  {
    checks:         [{ ok, text }],
    score:          cuantas se cumplen,
    total:          cuantas se evaluaron,
    salaryMismatch: true si su pretension supera el tope de la plaza
  }
*/
export function computeMatches(profile, job, jobDepartmentName) {

    const checks = [];
    let salaryMismatch = false;

    if (!profile || !job) {
        return { checks, score: 0, total: 0, salaryMismatch };
    }

    const textoVacante = normalizar(
        [job.title, job.description, job.requirements].join(" ")
    );

    const textoCandidato = textoDelCandidato(profile);

    /* 1. Pretension salarial vs rango de la plaza */
    const pretension = Number(profile.expected_salary) || null;
    const topePlaza = Number(job.salary_max) || null;

    if (pretension && topePlaza) {

        const dentro = pretension <= topePlaza;

        salaryMismatch = !dentro;

        checks.push({
            ok: dentro,
            text: dentro
                ? `Su pretensión (Q${pretension.toLocaleString("en-US")}) está dentro del rango de la plaza`
                : `Su pretensión (Q${pretension.toLocaleString("en-US")}) supera el salario de la plaza (hasta Q${topePlaza.toLocaleString("en-US")})`,
        });

    }

    /* 2. Palabras clave de los requisitos (estilo ATS) */
    const claves = palabrasClaveDe(job);

    if (claves.length > 0) {

        const encontradas = claves.filter((clave) =>
            textoCandidato.includes(clave)
        );

        checks.push({
            ok: encontradas.length > 0,
            text: encontradas.length > 0
                ? `${encontradas.length} de ${claves.length} palabras clave de los requisitos aparecen en su perfil: ${encontradas.slice(0, 6).join(", ")}`
                : `Ninguna de las ${claves.length} palabras clave de los requisitos aparece en su perfil`,
        });

    }

    /* 3. Ubicacion */
    if (jobDepartmentName && profile.department) {

        const misma =
            normalizar(jobDepartmentName) ===
            normalizar(profile.department);

        checks.push({
            ok: misma,
            text: misma
                ? `Vive en el departamento de la vacante (${jobDepartmentName})`
                : `La vacante es en ${jobDepartmentName}; el perfil dice ${profile.department}`,
        });

    }

    /* 4. Habilidades: cuantas de las suyas pide la vacante */
    const habilidades = String(profile.skills || "")
        .split(",")
        .map((habilidad) => habilidad.trim())
        .filter(Boolean);

    if (habilidades.length > 0) {

        const encontradas = habilidades.filter((habilidad) =>
            textoVacante.includes(normalizar(habilidad))
        );

        checks.push({
            ok: encontradas.length > 0,
            text: encontradas.length > 0
                ? `${encontradas.length} de ${habilidades.length} habilidades mencionadas en la vacante: ${encontradas.join(", ")}`
                : `Ninguna de sus ${habilidades.length} habilidades aparece en la vacante`,
        });

    }

    /* 5. Profesion mencionada en la vacante */
    const palabrasProfesion = palabrasDe(profile.profession, 3);

    if (palabrasProfesion.length > 0) {

        const coincide = palabrasProfesion.some((palabra) =>
            textoVacante.includes(palabra)
        );

        checks.push({
            ok: coincide,
            text: coincide
                ? `La profesión (${profile.profession}) coincide con la vacante`
                : "La profesión no aparece en la descripción de la vacante",
        });

    }

    /* 6. Experiencia relacionada con el puesto */
    const palabrasTitulo = palabrasDe(job.title, 3);
    const experiencia = normalizar(profile.experience);

    if (experiencia && palabrasTitulo.length > 0) {

        const relacionada = palabrasTitulo.some((palabra) =>
            experiencia.includes(palabra)
        );

        checks.push({
            ok: relacionada,
            text: relacionada
                ? "Su experiencia menciona el tipo de puesto"
                : "Su experiencia no menciona el tipo de puesto",
        });

    }

    /* 7. Nivel academico declarado (informativo) */
    if (profile.education_level) {

        checks.push({
            ok: true,
            text: `Nivel académico: ${profile.education_level}${profile.education_institution ? ` (${profile.education_institution})` : ""}`,
        });

    }

    const score = checks.filter((check) => check.ok).length;

    return { checks, score, total: checks.length, salaryMismatch };

}
