import { useEffect, useState } from "react";

import "./../../styles/theme.css";
import "./../../styles/recruiter/layout/RecruiterDashboard.css";
import "./../../styles/company/SearchCandidates.css";

import { toTitleCase } from "../../utils/textFormat";

import RecruiterSidebar from "../../components/recruiter/layout/RecruiterSidebar";

import { getMyCompanyContext } from "../../services/teamService";
import { getDepartments } from "../../services/locationService";

import {
    searchCandidates,
    unlockCandidateProfile,
    getUnlockedCandidate,
} from "../../services/companyService";

import { getMyJobCredits } from "../../services/jobService";

function nombreCompleto(c) {

    return [c.first_name, c.middle_name, c.last_name, c.second_last_name]
        .filter(Boolean)
        .join(" ") || "Candidato";

}

function SearchCandidates() {

    const [company, setCompany] = useState(null);
    const [myRole, setMyRole] = useState(null);
    const [ilimitado, setIlimitado] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [profession, setProfession] = useState("");
    const [department, setDepartment] = useState("");
    const [skill, setSkill] = useState("");

    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [searched, setSearched] = useState(false);
    const [searchError, setSearchError] = useState(null);

    const [unlockingId, setUnlockingId] = useState(null);
    const [unlocked, setUnlocked] = useState({}); // { [candidateId]: fullProfile }

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {

        setLoading(true);

        const [{ company: companyData, role }, departmentsRes, creditsRes] =
            await Promise.all([
                getMyCompanyContext(),
                getDepartments(),
                getMyJobCredits(),
            ]);

        setDepartments(departmentsRes.data || []);
        setCompany(companyData || null);
        setMyRole(role || null);
        setIlimitado(creditsRes?.data?.job_limit === null);

        setLoading(false);

    }

    async function handleSearch(e) {

        e.preventDefault();

        if (!company) return;

        setSearching(true);
        setSearchError(null);
        setSearched(true);

        const { data, error } = await searchCandidates(company.id, {
            profession: profession.trim() || null,
            department: department || null,
            skill: skill.trim() || null,
        });

        setSearching(false);

        if (error) {
            setSearchError(error.message);
            setResults([]);
            return;
        }

        setResults(data || []);

    }

    async function handleUnlock(candidateProfileId) {

        if (!company) return;

        const tieneCredito = ilimitado || company.unlock_credits > 0;
        const yaDesbloqueado = results.find(
            (r) => r.candidate_profile_id === candidateProfileId
        )?.already_unlocked;

        if (!yaDesbloqueado && !tieneCredito) {
            alert(
                "No te quedan usos de \"Ver perfil completo\" disponibles. Escribe a ChanceGT para adquirir más."
            );
            return;
        }

        if (!yaDesbloqueado) {

            const seguro = window.confirm(
                ilimitado
                    ? "Tu plan Reclutador incluye ver el perfil completo de este candidato sin costo. ¿Continuar?"
                    : "Esto usará 1 \"Ver perfil completo\" para ver toda la información de este candidato. ¿Continuar?"
            );

            if (!seguro) return;

        }

        setUnlockingId(candidateProfileId);

        const { error: unlockError } = await unlockCandidateProfile(
            company.id,
            candidateProfileId
        );

        if (unlockError) {
            setUnlockingId(null);
            alert("No se pudo desbloquear: " + unlockError.message);
            return;
        }

        const { data: fullProfile, error: fetchError } =
            await getUnlockedCandidate(company.id, candidateProfileId);

        setUnlockingId(null);

        if (fetchError) {
            alert("No se pudo cargar el perfil: " + fetchError.message);
            return;
        }

        setUnlocked((prev) => ({ ...prev, [candidateProfileId]: fullProfile }));

        if (!yaDesbloqueado && !ilimitado) {
            setCompany((prev) => ({
                ...prev,
                unlock_credits: prev.unlock_credits - 1,
            }));
        }

        setResults((prev) =>
            prev.map((r) =>
                r.candidate_profile_id === candidateProfileId
                    ? { ...r, already_unlocked: true }
                    : r
            )
        );

    }

    return (

        <div className="dashboard">

            <RecruiterSidebar company={company} role={myRole} />

            <main className="dashboard-content">

                <header className="search-header">

                    <div>

                        <h1>Buscar candidatos</h1>

                        <p>
                            Explora candidatos que activaron su
                            visibilidad, más allá de quienes ya
                            aplicaron a tus vacantes.
                        </p>

                    </div>

                    {!loading && (
                        <div className="credits-badge">
                            {ilimitado ? (
                                <span>
                                    <strong>Ilimitado</strong> "Ver perfil completo" — incluido en tu plan Reclutador
                                </span>
                            ) : (
                                <>
                                    <strong>{company?.unlock_credits ?? 0}</strong>
                                    <span>
                                        {company?.unlock_credits === 1
                                            ? "\"Ver perfil completo\" disponible"
                                            : "\"Ver perfil completo\" disponibles"}
                                    </span>
                                </>
                            )}
                        </div>
                    )}

                </header>

                {!loading && (

                    <form className="search-filters" onSubmit={handleSearch}>

                        <input
                            type="text"
                            placeholder="Profesión o puesto (ej. Ventas)"
                            value={profession}
                            onChange={(e) => setProfession(e.target.value)}
                        />

                        <select
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                        >
                            <option value="">Todos los departamentos</option>
                            {departments.map((d) => (
                                <option key={d.id} value={d.name}>
                                    {d.name}
                                </option>
                            ))}
                        </select>

                        <input
                            type="text"
                            placeholder="Habilidad (ej. Excel)"
                            value={skill}
                            onChange={(e) => setSkill(e.target.value)}
                        />

                        <button type="submit" disabled={searching}>
                            {searching ? "Buscando…" : "Buscar"}
                        </button>

                    </form>

                )}

                {searchError && (
                    <p className="search-error">{searchError}</p>
                )}

                {searched && !searching && results.length === 0 && !searchError && (
                    <div className="search-empty">
                        <h3>No encontramos candidatos con esos filtros</h3>
                        <p>
                            Prueba con términos más generales, o espera a
                            que más candidatos activen su visibilidad.
                        </p>
                    </div>
                )}

                <div className="candidate-results">

                    {results.map((c) => {

                        const full = unlocked[c.candidate_profile_id];

                        return (

                            <article
                                key={c.candidate_profile_id}
                                className="candidate-result-card"
                            >

                                <div className="candidate-result-main">

                                    <h3>
                                        {full
                                            ? nombreCompleto(full)
                                            : c.profession || "Candidato"}
                                    </h3>

                                    <p className="candidate-result-meta">
                                        {[
                                            c.profession,
                                            [c.municipality, c.department]
                                                .filter(Boolean)
                                                .map(toTitleCase)
                                                .join(", "),
                                            c.years_experience > 0
                                                ? `${c.years_experience} años de experiencia`
                                                : null,
                                        ]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </p>

                                    {c.skills && (
                                        <p className="candidate-result-skills">
                                            {c.skills}
                                        </p>
                                    )}

                                    {full && (
                                        <p className="candidate-result-contact">
                                            📞 {full.phone || "No indicado"}
                                            {full.address
                                                ? `  ·  🏠 ${full.address}`
                                                : ""}
                                        </p>
                                    )}

                                </div>

                                <div className="candidate-result-action">

                                    {c.expected_salary && (
                                        <span className="candidate-result-salary">
                                            Q{Number(c.expected_salary).toLocaleString("es-GT")}
                                        </span>
                                    )}

                                    {full ? (
                                        <span className="candidate-unlocked-chip">
                                            ✓ Desbloqueado
                                        </span>
                                    ) : (
                                        <button
                                            className="unlock-button"
                                            disabled={unlockingId === c.candidate_profile_id}
                                            onClick={() => handleUnlock(c.candidate_profile_id)}
                                        >
                                            {unlockingId === c.candidate_profile_id
                                                ? "Cargando…"
                                                : c.already_unlocked
                                                    ? "Ver perfil completo"
                                                    : ilimitado ? "Ver perfil completo (incluido)" : "Ver perfil completo (Q25)"}
                                        </button>
                                    )}

                                </div>

                            </article>

                        );

                    })}

                </div>

            </main>

        </div>

    );

}

export default SearchCandidates;
