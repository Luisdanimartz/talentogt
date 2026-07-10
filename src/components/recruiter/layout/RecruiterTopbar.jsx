import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./../../../styles/recruiter/layout/RecruiterTopbar.css";

import { getCurrentCompany } from "../../../services/companyService";

function RecruiterTopbar() {

    const navigate = useNavigate();

    const [companyName, setCompanyName] = useState("");

    useEffect(() => {

        loadCompany();

    }, []);

    async function loadCompany() {

        const { data } = await getCurrentCompany();

        if (data) {
            setCompanyName(data.company_name);
        }

    }

    return (

        <header className="topbar">

            <div className="topbar-title">
                <h1>Dashboard</h1>
                <p>
                    {companyName
                        ? `Bienvenido nuevamente, ${companyName}.`
                        : "Bienvenido nuevamente."}
                </p>
            </div>

            <div className="topbar-actions">

                <button
                    className="new-job-btn"
                    onClick={() => navigate("/empresa/nueva-vacante")}
                >
                    + Publicar Vacante
                </button>

            </div>

        </header>

    );

}

export default RecruiterTopbar;
