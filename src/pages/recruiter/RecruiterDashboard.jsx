import "./../../styles/recruiter/layout/RecruiterDashboard.css";

import RecruiterSidebar from "../../components/recruiter/layout/RecruiterSidebar";
import RecruiterTopbar from "../../components/recruiter/layout/RecruiterTopbar";

import DashboardCards from "../../components/recruiter/dashboard/DashboardCards";
import JobsTable from "../../components/recruiter/dashboard/JobsTable";
import TasksPanel from "../../components/recruiter/dashboard/TasksPanel";
import CandidateExperience from "../../components/recruiter/dashboard/CandidateExperience";
import FeaturedCandidates from "../../components/recruiter/dashboard/FeaturedCandidates";
import InterviewPanel from "../../components/recruiter/dashboard/InterviewPanel";
import ActivityFeed from "../../components/recruiter/dashboard/ActivityFeed";
import DashboardFooter from "../../components/recruiter/dashboard/DashboardFooter";
import DecisionCenter from "../../components/recruiter/dashboard/DecisionCenter";

function RecruiterDashboard() {

    return (

        <div className="dashboard">

            <RecruiterSidebar />

            <main className="dashboard-content">

                <RecruiterTopbar />

                <DashboardCards />

                <div className="dashboard-grid">

                    <section className="dashboard-left">

                        <JobsTable />

                        <FeaturedCandidates />

                        <ActivityFeed />

                    </section>

                    <aside className="dashboard-right">

                        <TasksPanel />

                        <InterviewPanel />

                        <CandidateExperience />

                        <DecisionCenter />

                    </aside>

                </div>

                <DashboardFooter />

            </main>

        </div>

    );

}

export default RecruiterDashboard;