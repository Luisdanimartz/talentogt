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
import { getCompanyJobs } from "../../services/jobService";
import { getCompanyApplications } from "../../services/applicationService";
import { getCompanyInterviews, esHoy } from "../../services/interviewService";

function RecruiterDashboard() {

    const navigate = useNavigate();

    const [company, setCompany] = useState(null);
    const [myRole, setMyRole] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [applicationsError, setApplicationsError] = useState(false);
    const [interviewsToday, setInterviewsToday] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

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

        const [jobsRes, appsRes, interviewsRes] = await Promise.all([
            getCompanyJobs(companyData.id),
            getCompanyApplications(companyData.id),
            getCompanyInterviews(companyData.id),
        ]);

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
        } else {
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

                        <RecentActivity jobs={jobs} loading={loading} />

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
