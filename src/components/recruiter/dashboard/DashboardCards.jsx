import { useEffect, useState } from "react";

import "./../../../styles/recruiter/dashboard/DashboardCards.css";

import { getCurrentCompany } from "../../../services/companyService";
import { getCompanyJobs } from "../../../services/jobService";

function DashboardCards() {

    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        loadStats();

    }, []);

    async function loadStats() {

        setLoading(true);

        const { data: company } = await getCurrentCompany();

        if (!company) {
            setLoading(false);
            return;
        }

        const { data: jobs } = await getCompanyJobs(company.id);

        const jobList = jobs || [];

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const activas = jobList.filter(
            (job) => (job.status || "").toLowerCase() === "active"
        ).length;

        const esteMes = jobList.filter(
            (job) => new Date(job.created_at) >= startOfMonth
        ).length;

        const areas = new Set(
            jobList.map((job) => job.category_id).filter(Boolean)
        ).size;

        setCards([
            {
                title: "Vacantes activas",
                value: String(activas),
                color: "blue"
            },
            {
                title: "Publicadas este mes",
                value: String(esteMes),
                color: "orange"
            },
            {
                title: "Áreas con vacantes",
                value: String(areas),
                color: "green"
            }
        ]);

        setLoading(false);

    }

    if (loading) {

        return (
            <section className="dashboard-cards">
                <p>Cargando métricas...</p>
            </section>
        );

    }

    return (

        <section className="dashboard-cards">

            {cards.map((card) => (

                <article
                    key={card.title}
                    className={`dashboard-card ${card.color}`}
                >

                    <span className="card-title">
                        {card.title}
                    </span>

                    <h2>
                        {card.value}
                    </h2>

                </article>

            ))}

            <article className="dashboard-card gray">
                <span className="card-title">
                    Candidatos y métricas de IA
                </span>
                <h2 style={{ fontSize: 16 }}>
                    Próximamente
                </h2>
            </article>

        </section>

    );

}

export default DashboardCards;
