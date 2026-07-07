import "../styles/Footer.css";
import footerLinks from "../data/footerLinks";

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-container">

        {/* Marca */}

        <div className="footer-brand">

          <h2>ChanceGT</h2>

          <p>
            Conectamos talento, impulsamos Guatemala.
          </p>

          <span>
            Plataforma creada para transformar la experiencia laboral en Guatemala.
          </span>

        </div>

        {/* Candidatos */}

        <div className="footer-column">

          <h3>Candidatos</h3>

          {footerLinks.candidates.map((item) => (
            <a key={item.name} href={item.href}>
              {item.name}
            </a>
          ))}

        </div>

        {/* Empresas */}

        <div className="footer-column">

          <h3>Empresas</h3>

          {footerLinks.companies.map((item) => (
            <a key={item.name} href={item.href}>
              {item.name}
            </a>
          ))}

        </div>

        {/* Legal */}

        <div className="footer-column">

          <h3>Legal</h3>

          {footerLinks.legal.map((item) => (
            <a key={item.name} href={item.href}>
              {item.name}
            </a>
          ))}

        </div>

      </div>

      <div className="footer-bottom">

        <p>
          © 2026 ChanceGT. Todos los derechos reservados.
        </p>

        <p>
          Construido en Guatemala para conectar talento con oportunidades.
        </p>

      </div>

    </footer>
  );
}

export default Footer;