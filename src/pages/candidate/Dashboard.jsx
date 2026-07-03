import StatCard from "../../components/ui/StatCard";

function Dashboard() {
  return (
    <div className="dashboard">

      {/* ENCABEZADO */}

      <div className="dashboard-header">

        <div>

          <h1>Bienvenido, Luis 👋</h1>

          <p>
            Completa tu perfil para aumentar tus posibilidades de conseguir empleo.
          </p>

        </div>

        <button className="profile-btn">
          Ver mi perfil
        </button>

      </div>


      {/* PERFIL */}

      <div className="profile-progress">

        <div className="progress-header">

          <span>Perfil completado</span>

          <strong>18%</strong>

        </div>

        <div className="progress-bar">

          <div className="progress-fill"></div>

        </div>

      </div>


      {/* TARJETAS */}

      <div className="dashboard-grid">

        <StatCard
          number="15"
          title="Postulaciones"
        />

        <StatCard
          number="4"
          title="Procesos activos"
        />

        <StatCard
          number="2"
          title="Entrevistas"
        />

        <StatCard
          number="80%"
          title="Empresas que respondieron"
        />

      </div>


      {/* DOS COLUMNAS */}

      <div className="dashboard-columns">

        <div className="activity">

          <h2>Actividad reciente</h2>

          <ul>

            <li>✅ Banco Industrial revisó tu CV.</li>

            <li>✅ Tigo descargó tu CV.</li>

            <li>📅 Entrevista mañana 10:00 AM.</li>

            <li>📩 Farmacias Batres envió un mensaje.</li>

          </ul>

        </div>


        <div className="processes">

          <h2>Mis procesos activos</h2>

          <div className="process-card">

            <div>

              <h3>Asesor Comercial</h3>

              <p>Banco Industrial</p>

            </div>

            <span className="status review">
              CV Revisado
            </span>

          </div>

          <div className="process-card">

            <div>

              <h3>Supervisor de Ventas</h3>

              <p>Tigo Guatemala</p>

            </div>

            <span className="status interview">
              Entrevista
            </span>

          </div>

          <div className="process-card">

            <div>

              <h3>Analista Financiero</h3>

              <p>Cementos Progreso</p>

            </div>

            <span className="status send">
              CV Enviado
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;