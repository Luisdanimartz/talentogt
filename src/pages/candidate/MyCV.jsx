import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../../styles/theme.css";
import "../../styles/MyCV.css";

import { getCurrentCandidateProfile } from "../../services/candidateService";
import { useAuth } from "../../context/AuthContext";

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
            ? `📍 ${[profile.municipality, profile.department].filter(Boolean).join(", ")}`
            : null,
    ].filter(Boolean);

    const habilidades = String(profile.skills || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const experiencia = profile.candidate_experience || [];
    const formacion = profile.candidate_education || [];

    /* ===== Franja de numeros: calculados, no inventados ===== */

    const totalAnios = experiencia.reduce(
        (suma, exp) => suma + (Number(exp.years) || 0),
        0
    );

    const empresas = new Set(
        experiencia.map((exp) => exp.company).filter(Boolean)
    ).size;

    const nivelTop = formacion[0]?.level || null;

    const stats = [
        totalAnios > 0 && {
            valor: `${totalAnios}+`,
            texto: "Años de experiencia",
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
                Al presionar "Descargar PDF", elige la impresora
                <strong> "Guardar como PDF"</strong>. Formato amigable
                con ATS: úsalo para otras plazas o llévalo a tu
                entrevista.
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
                                    {[
                                        exp.period ||
                                            (exp.years
                                                ? `${exp.years} ${Number(exp.years) === 1 ? "año" : "años"}`
                                                : null),
                                    ]
                                        .filter(Boolean)
                                        .join(" · ")}
                                </span>

                                {exp.description && (
                                    <ul className="cv-bullets">
                                        {exp.description
                                            .split("\n")
                                            .map((linea) => linea.trim())
                                            .filter(Boolean)
                                            .map((logro, j) => (
                                                <li key={j}>{logro}</li>
                                            ))}
                                    </ul>
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

export default MyCV;
