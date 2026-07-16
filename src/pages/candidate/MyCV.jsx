import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../../styles/theme.css";
import "../../styles/MyCV.css";

import { toTitleCase } from "../../utils/textFormat";

import { getCurrentCandidateProfile } from "../../services/candidateService";
import { useAuth } from "../../context/AuthContext";
import { sinVineta, duracionEnMeses } from "../../utils/bullets";

/* "2" (perfiles viejos) -> "2 años"; "1 año 6 meses" queda igual */
function duracionHumana(years) {

    const t = String(years || "").trim();

    if (!t) return null;

    if (/^\d+(\.\d+)?$/.test(t)) {
        const n = Number(t);
        return `${n} ${n === 1 ? "año" : "años"}`;
    }

    return t;

}

/* "Licenciatura" + "Administración de Empresas" -> "Licenciatura en Administración de Empresas" */
function tituloEducacion(edu) {
    if (edu.level && edu.career_name) return `${edu.level} en ${edu.career_name}`;
    return edu.career_name || edu.level || "Formación académica";
}

const ESTADO_ACADEMICO_LABEL = {
    graduado: "Graduado",
    cierre_pensum: "Cierre de pénsum",
    estudiando: "Actualmente estudiando",
};

function detalleEducacion(edu) {
    const estado = ESTADO_ACADEMICO_LABEL[edu.status];
    if (estado && edu.graduation_year) return `${estado} · ${edu.graduation_year}`;
    return estado || edu.graduation_year || null;
}

/*
  Mi CV — nivel profesional, generado del perfil real.

  Estructura inspirada en CVs ejecutivos:
   - Titular + contacto (telefono, correo, ubicacion, LinkedIn,
     disponibilidad)
   - Franja de numeros REALES calculados del perfil
   - Perfil Profesional (resumen)
   - Competencias Clave (cuadricula)
   - Experiencia con periodo y logros en viñetas
   - Formacion Academica
*/

function MyCV() {

    const navigate = useNavigate();
    const { user } = useAuth();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [plantilla, setPlantilla] = useState("clasico");

    useEffect(() => {

        getCurrentCandidateProfile().then(({ data }) => {
            setProfile(data);
            setLoading(false);
        });

    }, []);

    if (loading) {
        return (
            <div className="cv-wrap">
                <p className="cv-loading">Preparando tu CV…</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="cv-wrap">
                <div className="cv-empty">
                    <h2>Aún no tienes perfil</h2>
                    <p>
                        Crea tu perfil y con esos datos generamos tu CV
                        profesional, listo para descargar.
                    </p>
                    <button onClick={() => navigate("/candidato/crear-cv")}>
                        Crear mi perfil
                    </button>
                </div>
            </div>
        );
    }

    const nombre = [
        profile.first_name,
        profile.middle_name,
        profile.last_name,
        profile.second_last_name,
    ].filter(Boolean).join(" ");

    const contacto = [
        profile.phone ? `📞 ${profile.phone}` : null,
        user?.email ? `✉ ${user.email}` : null,
        [profile.municipality, profile.department].filter(Boolean).length
            ? `📍 ${[profile.municipality, profile.department].filter(Boolean).map(toTitleCase).join(", ")}`
            : null,
    ].filter(Boolean);

    const direccion = profile.address || null;

    const habilidades = String(profile.skills || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const experiencia = profile.candidate_experience || [];
    const formacion = profile.candidate_education || [];

    /* ===== Franja de numeros: calculados, no inventados ===== */

    /* Suma de duraciones humanas ("1 año 6 meses" -> 18 meses) */
    const totalMeses = experiencia.reduce(
        (suma, exp) => suma + duracionEnMeses(exp.years),
        0
    );

    const totalAnios = Math.floor(totalMeses / 12);

    const empresas = new Set(
        experiencia.map((exp) => exp.company).filter(Boolean)
    ).size;

    const nivelTop = formacion[0]?.level || null;

    const stats = [
        totalAnios > 0 && {
            valor: `${totalAnios}+`,
            texto: "Años de experiencia",
        },
        totalAnios === 0 && totalMeses > 0 && {
            valor: totalMeses,
            texto: totalMeses === 1
                ? "Mes de experiencia"
                : "Meses de experiencia",
        },
        empresas > 0 && {
            valor: empresas,
            texto: empresas === 1 ? "Empresa" : "Empresas",
        },
        habilidades.length > 0 && {
            valor: habilidades.length,
            texto: "Competencias",
        },
        nivelTop && {
            valor: nivelTop,
            texto: formacion[0]?.institution || "Formación",
        },
    ].filter(Boolean);

    return (

        <div className="cv-wrap">

            <div className="cv-actions">

                <button
                    className="cv-back"
                    onClick={() => navigate("/candidato/dashboard")}
                >
                    ← Volver a mi panel
                </button>

                <div className="cv-template-switch">

                    <button
                        type="button"
                        className={plantilla === "clasico" ? "active" : ""}
                        onClick={() => setPlantilla("clasico")}
                    >
                        Clásico
                    </button>

                    <button
                        type="button"
                        className={plantilla === "impacto" ? "active" : ""}
                        onClick={() => setPlantilla("impacto")}
                    >
                        Impacto
                    </button>

                </div>

                <div>

                    <button
                        className="cv-edit"
                        onClick={() => navigate("/candidato/crear-cv")}
                    >
                        Editar datos
                    </button>

                    <button
                        className="cv-download"
                        onClick={() => window.print()}
                    >
                        ⬇ Descargar PDF
                    </button>

                </div>

            </div>

            <p className="cv-hint">
                {plantilla === "clasico" ? (
                    <>
                        Al presionar "Descargar PDF", elige la impresora
                        <strong> "Guardar como PDF"</strong>. Formato amigable
                        con ATS: úsalo para otras plazas o llévalo a tu
                        entrevista.
                    </>
                ) : (
                    <>
                        Pensado para que un reclutador decida en segundos,
                        sin perder el formato de texto real que leen los
                        sistemas de reclutamiento (ATS).
                    </>
                )}
            </p>

            {plantilla === "clasico" ? (

            <article className="cv-page">

                <header className="cv-header">

                    <h1>{nombre}</h1>

                    {profile.profession && (
                        <p className="cv-profession">{profile.profession}</p>
                    )}

                    <p className="cv-contact">
                        {contacto.join("  ·  ")}
                    </p>

                    {direccion && (
                        <p className="cv-contact">
                            🏠 {direccion}
                        </p>
                    )}

                    {(profile.linkedin || profile.availability) && (
                        <p className="cv-contact">
                            {[profile.linkedin, profile.availability]
                                .filter(Boolean)
                                .join("  ·  ")}
                        </p>
                    )}

                </header>

                {stats.length > 1 && (

                    <div className="cv-stats">

                        {stats.map((stat, i) => (

                            <div key={i} className="cv-stat">

                                <strong>{stat.valor}</strong>

                                <span>{stat.texto}</span>

                            </div>

                        ))}

                    </div>

                )}

                {profile.summary && (

                    <section className="cv-section">

                        <h2>Perfil Profesional</h2>

                        <p className="cv-summary">{profile.summary}</p>

                    </section>

                )}

                {habilidades.length > 0 && (

                    <section className="cv-section">

                        <h2>Competencias Clave</h2>

                        <div className="cv-skill-grid">

                            {habilidades.map((skill) => (
                                <span key={skill}>{skill}</span>
                            ))}

                        </div>

                    </section>

                )}

                {experiencia.length > 0 && (

                    <section className="cv-section">

                        <h2>Experiencia Profesional</h2>

                        {experiencia.map((exp, i) => (

                            <div key={i} className="cv-item">

                                <strong>
                                    {[exp.company, exp.job_title]
                                        .filter(Boolean)
                                        .join(" | ")}
                                </strong>

                                <span>
                                    {[exp.period, duracionHumana(exp.years)]
                                        .filter(Boolean)
                                        .join(" · ")}
                                </span>

                                {exp.description && (
                                    <ul className="cv-bullets">
                                        {exp.description
                                            .split("\n")
                                            .map((linea) => sinVineta(linea))
                                            .filter(Boolean)
                                            .map((logro, j) => (
                                                <li key={j}>{logro}</li>
                                            ))}
                                    </ul>
                                )}

                                {exp.reference_phone && (
                                    <p className="cv-reference">
                                        Referencia laboral: {exp.reference_phone}
                                    </p>
                                )}

                            </div>

                        ))}

                    </section>

                )}

                {formacion.length > 0 && (

                    <section className="cv-section">

                        <h2>Formación Académica</h2>

                        {formacion.map((edu, i) => (

                            <div key={i} className="cv-item">

                                <strong>{tituloEducacion(edu)}</strong>

                                <span>
                                    {[edu.institution, detalleEducacion(edu)]
                                        .filter(Boolean)
                                        .join(" · ")}
                                </span>

                            </div>

                        ))}

                    </section>

                )}

                <footer className="cv-footer">
                    CV generado con ChanceGT — chancegt.com
                </footer>

            </article>

            ) : (

            <article className="cv-page cv-impact">

                <header className="cv-impact-header">

                    <div className="cv-impact-avatar">
                        {(nombre || "?").trim().charAt(0).toUpperCase()}
                    </div>

                    <div className="cv-impact-headtext">

                        <h1>{nombre}</h1>

                        {profile.profession && (
                            <p className="cv-impact-profession">
                                {profile.profession}
                            </p>
                        )}

                        <p className="cv-impact-contact">
                            {[...contacto, direccion ? `🏠 ${direccion}` : null]
                                .filter(Boolean)
                                .join("   ")}
                        </p>

                        {(profile.linkedin || profile.availability) && (
                            <p className="cv-impact-contact">
                                {[profile.linkedin, profile.availability]
                                    .filter(Boolean)
                                    .join("   ")}
                            </p>
                        )}

                    </div>

                </header>

                {stats.length > 1 && (

                    <div className="cv-impact-stats">

                        {stats.map((stat, i) => (
                            <div key={i} className="cv-impact-stat">
                                <strong>{stat.valor}</strong>
                                <span>{stat.texto}</span>
                            </div>
                        ))}

                    </div>

                )}

                {habilidades.length > 0 && (

                    <div className="cv-impact-tags">
                        {habilidades.map((skill) => (
                            <span key={skill}>{skill}</span>
                        ))}
                    </div>

                )}

                {profile.summary && (

                    <section className="cv-impact-section">

                        <h2>Perfil profesional</h2>

                        <p className="cv-summary">{profile.summary}</p>

                    </section>

                )}

                {experiencia.length > 0 && (

                    <section className="cv-impact-section">

                        <h2>Experiencia profesional</h2>

                        <div className="cv-impact-timeline">

                            {experiencia.map((exp, i) => (

                                <div key={i} className="cv-impact-timeline-item">

                                    <strong>
                                        {[exp.job_title, exp.company]
                                            .filter(Boolean)
                                            .join(" — ")}
                                    </strong>

                                    <span>
                                        {[exp.period, duracionHumana(exp.years)]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </span>

                                    {exp.description && (
                                        <ul className="cv-bullets">
                                            {exp.description
                                                .split("\n")
                                                .map((linea) => sinVineta(linea))
                                                .filter(Boolean)
                                                .map((logro, j) => (
                                                    <li key={j}>{logro}</li>
                                                ))}
                                        </ul>
                                    )}

                                    {exp.reference_phone && (
                                        <p className="cv-reference">
                                            Referencia laboral: {exp.reference_phone}
                                        </p>
                                    )}

                                </div>

                            ))}

                        </div>

                    </section>

                )}

                {formacion.length > 0 && (

                    <section className="cv-impact-section">

                        <h2>Formación académica</h2>

                        <div className="cv-impact-timeline">

                            {formacion.map((edu, i) => (

                                <div key={i} className="cv-impact-timeline-item">

                                    <strong>{tituloEducacion(edu)}</strong>

                                    <span>
                                        {[edu.institution, detalleEducacion(edu)]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </span>

                                </div>

                            ))}

                        </div>

                    </section>

                )}

                <footer className="cv-footer">
                    CV generado con ChanceGT — chancegt.com
                </footer>

            </article>

            )}

        </div>

    );

}

export default MyCV;
