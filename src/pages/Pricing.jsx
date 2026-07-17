import "../styles/theme.css";
import "../styles/Pricing.css";

function Pricing() {

  return (

    <div className="pricing-page">

      <section className="pricing-hero">
        <div className="pricing-wrap">

          <span className="pricing-eyebrow">Tarifas 2026</span>

          <h1>Publica más barato, y sé de las pocas empresas que sí responden.</h1>

          <p className="pricing-lead">
            Sin cotizaciones, sin esperar respuesta. Ves el precio y publicas.
          </p>

          <div className="pricing-compare">

            <p className="compare-title">Lo que cuesta publicar una vacante</p>

            <div className="bar-row">
              <span className="bar-label us">ChanceGT</span>
              <div className="bar-track"><div className="bar-fill us" style={{ width: "22%" }} /></div>
              <span className="bar-value">Q224</span>
            </div>

            <div className="bar-row">
              <span className="bar-label">Otras bolsas de trabajo en Guatemala</span>
              <div className="bar-track"><div className="bar-fill them" style={{ width: "100%" }} /></div>
              <span className="bar-value">Hasta 5x más</span>
            </div>

            <p className="bar-note">
              Comparación referencial con tarifas públicas de bolsas de
              trabajo en Guatemala, 2026, IVA incluido.
            </p>

          </div>

        </div>
      </section>

      <section className="pricing-plans-section">
        <div className="pricing-wrap">

          <div className="pricing-plans-heading">
            <h2>Tres planes. Nada más que decidir.</h2>
            <p>Todas tus vacantes se publican por 30 días, sin importar el plan.</p>
          </div>

          <div className="pricing-plans">

            {/* Individual */}
            <div className="pricing-plan">

              <p className="plan-name">Para una plaza puntual</p>
              <h3 className="plan-title">Individual</h3>
              <p className="plan-desc">
                Cubre una vacante específica, sin comprometerte a nada más.
              </p>

              <div className="plan-price-row">
                <span className="plan-price">Q224</span>
              </div>
              <p className="plan-price-note">por 1 publicación · 30 días</p>

              <a className="plan-cta" href="/register?tipo=empresa">Publicar ahora</a>

              <ul className="plan-features">
                <li><span className="check">✓</span> 1 vacante activa 30 días</li>
                <li><span className="check">✓</span> Republicación gratis si no se llenó en 7 días</li>
                <li><span className="check">✓</span> Visible en toda la plataforma</li>
              </ul>

              <div className="extra-box">
                <strong>+Q168 opcional:</strong> destaca tu vacante con
                🔥 Urgente y prioridad en los resultados.
              </div>

            </div>

            {/* Paquete */}
            <div className="pricing-plan featured">

              <span className="plan-tag">Más elegido</span>

              <p className="plan-name">Para quien recluta seguido</p>
              <h3 className="plan-title">Empresarial</h3>
              <p className="plan-desc">
                Créditos que compras una vez y usas cuando los necesites.
                No vencen.
              </p>

              <div className="plan-price-row">
                <span className="plan-price">Q1,344 <small>/ 10 créditos</small></span>
              </div>
              <p className="plan-price-note">
                Q134 por publicación · también disponible: 5 créditos por Q728
              </p>

              <a className="plan-cta" href="/register?tipo=empresa">Elegir paquete</a>

              <ul className="plan-features">
                <li><span className="check">✓</span> Cada publicación dura 30 días</li>
                <li><span className="check">✓</span> Los créditos no vencen nunca</li>
                <li><span className="check">✓</span> Publica cuando quieras, no hay prisa</li>
              </ul>

              <div className="plan-options">
                <p className="plan-options-label">Tamaños disponibles</p>
                <div className="option-row"><span>5 créditos</span><span className="amt">Q728</span></div>
                <div className="option-row"><span>10 créditos</span><span className="amt">Q1,344</span></div>
              </div>

              <div className="extra-box">
                <strong>+Q168 opcional:</strong> destaca cualquiera de tus
                vacantes, cuando quieras, con 🔥 Urgente y prioridad en
                los resultados.
              </div>

            </div>

            {/* Reclutador */}
            <div className="pricing-plan">

              <p className="plan-name">Para reclutar sin límite</p>
              <h3 className="plan-title">Reclutador</h3>
              <p className="plan-desc">
                Vacantes y usuarios de tu equipo ilimitados, mientras dure
                el período.
              </p>

              <div className="plan-price-row">
                <span className="plan-price">Q3,584 <small>/ trimestre</small></span>
              </div>
              <p className="plan-price-note">equivale a Q1,195 al mes</p>

              <a className="plan-cta" href="/register?tipo=empresa">Empezar ahora</a>

              <ul className="plan-features">
                <li><span className="check">✓</span> Vacantes ilimitadas</li>
                <li><span className="check">✓</span> Usuarios de equipo ilimitados</li>
                <li><span className="check">✓</span> Cada publicación dura 30 días</li>
              </ul>

              <div className="plan-options">
                <p className="plan-options-label">Elige tu período</p>
                <div className="option-row"><span>Trimestral</span><span className="amt">Q3,584</span></div>
                <div className="option-row"><span>Semestral</span><span className="amt">Q6,720</span></div>
                <div className="option-row"><span>Anual</span><span className="amt">Q12,096</span></div>
              </div>

              <div className="extra-box">
                <strong>Destacado automático opcional</strong> en todas
                tus vacantes (🔥 Urgente + prioridad), según el período
                que elijas: <strong>+Q896</strong> trimestral ·{" "}
                <strong>+Q1,792</strong> semestral ·{" "}
                <strong>+Q3,584</strong> anual.
              </div>

            </div>

          </div>

          <p className="pricing-footnote">
            Precios en quetzales, IVA incluido. El candidato nunca paga.
            Todos los planes incluyen el reporte de tiempo de respuesta,
            para que sepas si tu equipo está atendiendo a los candidatos
            a tiempo.
          </p>

        </div>
      </section>

    </div>

  );

}

export default Pricing;
