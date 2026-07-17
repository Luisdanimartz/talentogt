import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./../../styles/theme.css";
import "./../../styles/recruiter/layout/RecruiterDashboard.css";

import RecruiterSidebar from "../../components/recruiter/layout/RecruiterSidebar";
import RecruiterTopbar from "../../components/recruiter/layout/RecruiterTopbar";

import DashboardCards from "../../components/recruiter/dashboard/DashboardCards";
import JobsTable from "../../components/recruiter/dashboard/JobsTable";
import RecentActivity from "../../components/recruiter/dashboard/RecentActivity";
import StatusOverview from "../../components/recruiter/dashboard/StatusOverview";
import RoadmapPanel from "../../components/recruiter/dashboard/RoadmapPanel";

import { getMyCompanyContext } from "../../services/teamService";
import { getCompanyJobs, getMyJobCredits } from "../../services/jobService";
import { getCompanyApplications } from "../../services/applicationService";
import { getCompanyInterviews, esHoy } from "../../services/interviewService";

function RecruiterDashboard() {

    const navigate = useNavigate();

    const [company, setCompany] = useState(null);
    const [myRole, setMyRole] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [applicationsError, setApplicationsError] = useState(false);
    const [interviews, setInterviews] = useState([]);
    const [interviewsToday, setInterviewsToday] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [credits, setCredits] = useState(null);

    useEffect(() => {

        loadDashboard();

    }, []);

    async function loadDashboard() {

        setLoading(true);

        const { company: companyData, role } = await getMyCompanyContext();

        if (!companyData) {
            setLoading(false);
            return;
        }

        setCompany(companyData);
        setMyRole(role);

        const [jobsRes, appsRes, interviewsRes, creditsRes] = await Promise.all([
            getCompanyJobs(companyData.id),
            getCompanyApplications(companyData.id),
            getCompanyInterviews(companyData.id),
            getMyJobCredits(),
        ]);

        setCredits(creditsRes.data || null);

        setJobs(jobsRes.data || []);

        if (appsRes.error) {
            setApplicationsError(true);
        }

        setApplications(appsRes.data || []);

        /*
          Entrevistas de HOY (programadas). Si la tabla aun no
          existe (SQL 009 sin correr), la tarjeta queda honesta
          en modo "pronto".
        */
        if (interviewsRes.error) {
            setInterviewsToday(null);
            setInterviews([]);
        } else {
            setInterviews(interviewsRes.data || []);

            setInterviewsToday(
                (interviewsRes.data || []).filter(
                    (i) =>
                        i.status === "programada" &&
                        esHoy(i.scheduled_at)
                ).length
            );
        }

        setLoading(false);

    }

    function handleCardClick(target) {

        if (target === "candidatos") {
            navigate("/empresa/candidatos");
            return;
        }

        if (target === "entrevistas") {
            navigate("/empresa/entrevistas");
            return;
        }

        /* "jobs": bajar suavemente a la tabla de vacantes */
        document
            .getElementById("tus-vacantes")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });

    }

    const filteredJobs = useMemo(() => {

        const term = search.trim().toLowerCase();

        if (!term) return jobs;

        return jobs.filter((job) =>
            (job.title || "").toLowerCase().includes(term)
        );

    }, [jobs, search]);

    return (

        <div className="dashboard">

            <RecruiterSidebar company={company} role={myRole} />

            <main className="dashboard-content">

                <RecruiterTopbar
                    company={company}
                    search={search}
                    onSearchChange={setSearch}
                />

                {credits && (
                    <div className="plan-banner">
                        <span className="plan-banner-badge">
                            Plan: <strong>{credits.plan_name || "Sin plan"}</strong>
                        </span>

                        {credits.job_limit === null ? (
                            <span className="plan-banner-item">
                                📋 Vacantes ilimitadas
                            </span>
                        ) : (
                            <span className="plan-banner-item">
                                📋 <strong>{credits.job_credits_remaining ?? 0}</strong> publicación(es) disponible(s)
                            </span>
                        )}

                        {credits.destacado_ilimitado ? (
                            <span className="plan-banner-item">
                                🔥 Destacado ilimitado
                            </span>
                        ) : (
                            <span className="plan-banner-item">
                                🔥 <strong>{credits.destacado_credits_remaining ?? 0}</strong> destacada(s) disponible(s)
                            </span>
                        )}

                        <a href="/empresa/planes" className="plan-banner-link">
                            Conseguir más →
                        </a>
                    </div>
                )}

                <DashboardCards
                    jobs={jobs}
                    applications={applications}
                    applicationsError={applicationsError}
                    interviewsToday={interviewsToday}
                    loading={loading}
                    onCardClick={handleCardClick}
                />

                <div className="dashboard-grid">

                    <section className="dashboard-left" id="tus-vacantes">

                        <JobsTable
                            jobs={filteredJobs}
                            loading={loading}
                            searching={search.trim().length > 0}
                        />

                        <RecentActivity
                            jobs={jobs}
                            interviews={interviews}
                            loading={loading}
                        />

                    </section>

                    <aside className="dashboard-right">

                        <StatusOverview jobs={jobs} loading={loading} />

                        <RoadmapPanel />

                    </aside>

                </div>

            </main>

        </div>

    );

}

export default RecruiterDashboard;
