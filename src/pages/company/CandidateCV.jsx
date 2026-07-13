import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "../../styles/theme.css";
import "../../styles/MyCV.css";

import { getApplicationForCV } from "../../services/applicationService";
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

/*
  CV del candidato — vista de la EMPRESA.

  Misma estructura visual que "Mi CV" (candidato), pero de
  solo lectura: sin "Editar datos", solo volver y descargar.
  Útil para reclutadores que necesitan el CV físico para
  su propio registro/expediente.
*/
function CandidateCV() {

    const { applicationId } = useParams();
    const navigate = useNavigate();

    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {

        getApplicationForCV(applicationId).then(({ data, error }) => {

            if (error) {
                setLoadError(error.message);
            }

            setApplication(data || null);
            setLoading(false);

        });

    }, [applicationId]);

    if (loading) {
        return (
            <div className="cv-wrap">
                <p className="cv-loading">Cargando CV…</p>
            </div>
        );
    }

    const profile = application?.candidate_profiles;

    if (loadError || !profile) {
        return (
            <div className="cv-wrap">
                <div className="cv-empty">
                    <h2>No se pudo abrir este CV</h2>
                    <p>
                        {loadError ||
                            "El candidato aún no ha completado su perfil."}
                    </p>
                    <button onClick={() => navigate("/empresa/candidatos")}>
                        Volver
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
        [profile.municipality, profile.department].filter(Boolean).length
            ? `📍 ${[profile.municipality, profile.department].filter(Boolean).join(", ")}`
            : null,
    ].filter(Boolean);

    const direccion = profile.address || null;

    const habilidades = String(profile.skills || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const experiencia = profile.candidate_experience || [];
    const formacion = profile.candidate_education || [];

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
                    onClick={() => navigate("/empresa/candidatos")}
                >
                    ← Volver a candidatos
                </button>

                <div>

                    <button
                        className="cv-download"
                        onClick={() => window.print()}
                    >
                        ⬇ Descargar PDF
                    </button>

                </div>

            </div>

            <p className="cv-hint">
                Al presionar "Descargar PDF", elige la impresora
                <strong> "Guardar como PDF"</strong> (o imprímelo
                directo para tu expediente físico).
            </p>

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

                                <strong>{edu.level}</strong>

                                <span>
                                    {[edu.institution, edu.graduation_year]
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

        </div>

    );

}

export default CandidateCV;
