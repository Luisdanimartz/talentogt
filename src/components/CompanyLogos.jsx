import "../styles/CompanyLogos.css";

function CompanyLogos() {
  return (
    <section className="company-logos">

      <div className="logos-container">

        <h2>Empresas que confían en ChanceGT</h2>

        <div className="logos-slider">

          <div className="logos-track">

            <img src="/logos/bam.png" alt="BAM" />
            <img src="/logos/tigo.png" alt="Tigo" />
            <img src="/logos/bac.png" alt="BAC" />
            <img src="/logos/walmart.png" alt="Walmart" />
            <img src="/logos/cargill.png" alt="Cargill" />
            <img src="/logos/campero.png" alt="Pollo Campero" />
            <img src="/logos/progreso.png" alt="Progreso" />

            {/* duplicados para animación */}

            <img src="/logos/bam.png" alt="BAM" />
            <img src="/logos/tigo.png" alt="Tigo" />
            <img src="/logos/bac.png" alt="BAC" />
            <img src="/logos/walmart.png" alt="Walmart" />
            <img src="/logos/cargill.png" alt="Cargill" />
            <img src="/logos/campero.png" alt="Pollo Campero" />
            <img src="/logos/progreso.png" alt="Progreso" />

          </div>

        </div>

      </div>

    </section>
  );
}

export default CompanyLogos;