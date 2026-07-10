import "../../styles/recruiter/RecruiterJobs.css";

function RecruiterJobs() {
  return (
    <section className="recruiter-jobs">

      <div className="jobs-header">
        <h2>Vacantes activas</h2>

        <button className="new-job-btn">
          + Nueva vacante
        </button>
      </div>

      <div className="jobs-table">

        <div className="table-head">
          <span>Vacante</span>
          <span>Estado</span>
          <span>Candidatos</span>
          <span>Acciones</span>
        </div>

        <div className="table-row">
          <span>Ejecutivo de Ventas</span>
          <span className="status active">Activa</span>
          <span>42</span>
          <button>Ver</button>
        </div>

        <div className="table-row">
          <span>Auxiliar Contable</span>
          <span className="status active">Activa</span>
          <span>18</span>
          <button>Ver</button>
        </div>

        <div className="table-row">
          <span>Gerente Comercial</span>
          <span className="status draft">Borrador</span>
          <span>0</span>
          <button>Editar</button>
        </div>

      </div>

    </section>
  );
}

export default RecruiterJobs;