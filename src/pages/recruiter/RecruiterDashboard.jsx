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

import { getCurrentCompany } from "../../services/companyService";
import { getCompanyJobs } from "../../services/jobService";
import { getCompanyApplications } from "../../services/applicationService";

function RecruiterDashboard() {

    const navigate = useNavigate();

    const [company, setCompany] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [applicationsError, setApplicationsError] = useState(false);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {

        loadDashboard();

    }, []);

    async function loadDashboard() {

        setLoading(true);

        const { data: companyData } = await getCurrentCompany();

        if (!companyData) {
            setLoading(false);
            return;
        }

        setCompany(companyData);

        const [jobsRes, appsRes] = await Promise.all([
            getCompanyJobs(companyData.id),
            getCompanyApplications(companyData.id),
        ]);

        setJobs(jobsRes.data || []);

        if (appsRes.error) {
            setApplicationsError(true);
        }

        setApplications(appsRes.data || []);

        setLoading(false);

    }

    function handleCardClick(target) {

        if (target === "candidatos") {
            navigate("/empresa/candidatos");
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

            <RecruiterSidebar company={company} />

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
