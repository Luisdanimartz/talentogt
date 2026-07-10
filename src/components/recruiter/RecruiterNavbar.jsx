import "../../styles/recruiter/RecruiterNavbar.css";

function RecruiterNavbar() {

    return (

        <header className="recruiter-navbar">

            <div className="recruiter-navbar-container">

                <div className="recruiter-logo">

                    <h2>ChanceGT</h2>

                    <span>Panel Empresarial</span>

                </div>

                <nav>

                    <a href="#">Dashboard</a>

                    <a href="#">Vacantes</a>

                    <a href="#">Candidatos</a>

                    <a href="#">Mensajes</a>

                    <a href="#">Empresa</a>

                </nav>

                <button>

                    Mi Perfil

                </button>

            </div>

        </header>

    );

}

export default RecruiterNavbar;