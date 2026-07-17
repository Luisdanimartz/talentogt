import { useEffect, useState } from "react";

import { Box, Typography, Alert } from "@mui/material";

import RecruiterSidebar from "../../components/recruiter/layout/RecruiterSidebar";

import { useAuth } from "../../context/AuthContext";
import { getMyCompanyContext } from "../../services/teamService";
import { sendContactMessage } from "../../services/contactService";

import "../../styles/theme.css";
import "../../styles/recruiter/layout/RecruiterDashboard.css";
import "../../styles/Pricing.css";

/*
  Los mismos 3 planes de /planes (publica), pero:
  - vive dentro del panel de la empresa, sin que se salga a otra pagina
  - el boton no lleva a registro, manda un correo al admin pidiendo
    ese plan/opcion (con o sin destacado, segun el checkbox marcado).
    El admin activa a mano con admin_assign_plan cuando confirme el
    pago (mismo flujo que ya usas hoy).

  El destacado (Urgente + prioridad) es un checkbox, no un boton
  aparte, para no tener que multiplicar botones por cada combinacion
  de plan x destacado. Un solo "Solicitar" ya manda lo que este
  marcado.
*/

const DESTACADO_INDIVIDUAL = 168;
const DESTACADO_EMPRESARIAL = 168; // por publicación que decida destacar
const DESTACADO_RECLUTADOR = { trimestral: 896, semestral: 1792, anual: 3584 };

function formatQ(monto) {
  return `Q${monto.toLocaleString("es-GT")}`;
}

function Plans() {

  const { user } = useAuth();

  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const [destacarIndividual, setDestacarIndividual] = useState(false);
  const [destacadasEmpresarial, setDestacadasEmpresarial] = useState(0);
  const [destacarReclutador, setDestacarReclutador] = useState(false);

  const [solicitando, setSolicitando] = useState(null);
  const [enviado, setEnviado] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {

    loadData();

  }, []);

  async function loadData() {

    const { company: companyData } = await getMyCompanyContext();

    setCompany(companyData);
    setLoading(false);

  }

  async function solicitarPlan(clave, descripcionPlan) {

    setSolicitando(clave);
    setError(null);

    const { error: sendError } = await sendContactMessage({
      nombre: company?.company_name || "Empresa sin nombre",
      correo: company?.email || user?.email || "",
      mensaje:
        `Solicitud de plan desde el panel de la empresa.\n\n` +
        `Empresa: ${company?.company_name || "—"}\n` +
        `Correo de la empresa: ${company?.email || "—"}\n` +
        `NIT: ${company?.nit || "—"}\n` +
        `Plan solicitado: ${descripcionPlan}\n\n` +
        `Confirmar el pago con la empresa y activar el plan desde ` +
        `Admin → Empresas → Asignar plan.`,
    });

    setSolicitando(null);

    if (sendError) {
      setError(
        `No se pudo enviar la solicitud. Detalle técnico: ${sendError.message || "sin detalle"}`
      );
      return;
    }

    setEnviado(clave);

  }

  function pedirIndividual() {

    const precio = 224 + (destacarIndividual ? DESTACADO_INDIVIDUAL : 0);

    const desc = destacarIndividual
      ? `Individual + Destacada — ${formatQ(precio)} (Q224 + Q${DESTACADO_INDIVIDUAL} de destacado)`
      : `Individual — Q224`;

    solicitarPlan("individual", desc);

  }

  function pedirEmpresarial(creditos) {

    const base = creditos === 10 ? 1344 : 728;
    const destacadas = Math.min(destacadasEmpresarial, creditos);
    const extra = destacadas * DESTACADO_EMPRESARIAL;
    const precio = base + extra;

    const desc = destacadas > 0
      ? `Empresarial — ${creditos} créditos (${formatQ(precio)}: ${formatQ(base)} + ${destacadas} destacada${destacadas === 1 ? "" : "s"} × Q${DESTACADO_EMPRESARIAL} = ${formatQ(extra)})`
      : `Empresarial — ${creditos} créditos (${formatQ(base)})`;

    solicitarPlan(`empresarial${creditos}`, desc);

  }

  function pedirReclutador(periodo) {

    const precios = { trimestral: 3584, semestral: 6720, anual: 12096 };
    const base = precios[periodo];
    const destacadoExtra = DESTACADO_RECLUTADOR[periodo];
    const precio = base + (destacarReclutador ? destacadoExtra : 0);

    const desc = destacarReclutador
      ? `Reclutador — ${periodo} (${formatQ(precio)}, incluye destacado automático +${formatQ(destacadoExtra)})`
      : `Reclutador — ${periodo} (${formatQ(base)})`;

    solicitarPlan(`reclutador${periodo}`, desc);

  }

  return (

    <div className="dashboard">

      <RecruiterSidebar company={company} role="dueno" />

      <main className="dashboard-content">

        <Box sx={{ maxWidth: 1000, py: 4, px: { xs: 2, md: 0 } }}>

          <Typography variant="h4" fontWeight="bold" color="#0B1F3A">
            Planes
          </Typography>

          <Typography color="text.secondary" mb={3}>
            Elige el plan que necesites y solicítalo — te contactamos
            para confirmar el pago y lo activamos de inmediato.
          </Typography>

          {loading && <Typography>Cargando…</Typography>}

          {enviado && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Solicitud enviada. Te contactaremos en breve para
              confirmar el pago y activar tu plan.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {!loading && (

            <div className="pricing-plans">

              {/* Individual */}
              <div className="pricing-plan">

                <p className="plan-name">Para una plaza puntual</p>
                <h3 className="plan-title">Individual</h3>
                <p className="plan-desc">
                  Cubre una vacante específica, sin comprometerte a nada más.
                </p>

                <div className="plan-price-row">
                  <span className="plan-price">
                    {formatQ(224 + (destacarIndividual ? DESTACADO_INDIVIDUAL : 0))}
                  </span>
                </div>
                <p className="plan-price-note">por 1 publicación · 30 días</p>

                <label className="destacar-check">
                  <input
                    type="checkbox"
                    checked={destacarIndividual}
                    onChange={(e) => setDestacarIndividual(e.target.checked)}
                  />
                  Destacar esta vacante (+{formatQ(DESTACADO_INDIVIDUAL)}: Urgente + prioridad)
                </label>

                <button
                  className="plan-cta"
                  style={{ cursor: "pointer", width: "100%", border: "none" }}
                  disabled={solicitando === "individual"}
                  onClick={pedirIndividual}
                >
                  {solicitando === "individual" ? "Enviando…" : "Solicitar este plan"}
                </button>

                <ul className="plan-features">
                  <li><span className="check">✓</span> 1 vacante activa 30 días</li>
                  <li><span className="check">✓</span> Republicación gratis si no se llenó en 7 días</li>
                  <li><span className="check">✓</span> Visible en toda la plataforma</li>
                </ul>

              </div>

              {/* Empresarial */}
              <div className="pricing-plan featured">

                <span className="plan-tag">Más elegido</span>

                <p className="plan-name">Para quien recluta seguido</p>
                <h3 className="plan-title">Empresarial</h3>
                <p className="plan-desc">
                  Créditos que compras una vez y usas cuando los necesites.
                  No vencen.
                </p>

                <div className="plan-price-row">
                  <span className="plan-price">
                    {formatQ(1344 + Math.min(destacadasEmpresarial, 10) * DESTACADO_EMPRESARIAL)}
                    {" "}<small>/ 10 créditos</small>
                  </span>
                </div>
                <p className="plan-price-note">
                  Q134 por publicación · también disponible: 5 créditos por Q728
                </p>

                <label className="destacar-check destacar-check-cantidad">
                  <span>
                    ¿Cuántas quieres destacadas (🔥 Urgente + prioridad)?
                    +{formatQ(DESTACADO_EMPRESARIAL)} cada una.
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={destacadasEmpresarial}
                    onChange={(e) =>
                      setDestacadasEmpresarial(
                        Math.max(0, Math.min(10, Number(e.target.value) || 0))
                      )
                    }
                  />
                </label>

                <button
                  className="plan-cta"
                  style={{ cursor: "pointer", width: "100%", border: "none" }}
                  disabled={solicitando === "empresarial10"}
                  onClick={() => pedirEmpresarial(10)}
                >
                  {solicitando === "empresarial10"
                    ? "Enviando…"
                    : `Solicitar 10 créditos (${formatQ(1344 + Math.min(destacadasEmpresarial, 10) * DESTACADO_EMPRESARIAL)})`}
                </button>

                <button
                  className="plan-cta"
                  style={{
                    cursor: "pointer", width: "100%",
                    background: "transparent", color: "#0E8F73",
                    border: "1px solid #0E8F73", marginBottom: 24,
                  }}
                  disabled={solicitando === "empresarial5"}
                  onClick={() => pedirEmpresarial(5)}
                >
                  {solicitando === "empresarial5"
                    ? "Enviando…"
                    : `Solicitar 5 créditos (${formatQ(728 + Math.min(destacadasEmpresarial, 5) * DESTACADO_EMPRESARIAL)})`}
                </button>

                <ul className="plan-features">
                  <li><span className="check">✓</span> Cada publicación dura 30 días</li>
                  <li><span className="check">✓</span> Los créditos no vencen nunca</li>
                  <li><span className="check">✓</span> Publica cuando quieras, no hay prisa</li>
                </ul>

              </div>

              {/* Reclutador */}
              <div className="pricing-plan">

                <p className="plan-name">Para reclutar sin límite</p>
                <h3 className="plan-title">Reclutador</h3>
                <p className="plan-desc">
                  Vacantes y usuarios de tu equipo ilimitados, mientras
                  dure el período.
                </p>

                <div className="plan-price-row">
                  <span className="plan-price">
                    {formatQ(3584 + (destacarReclutador ? DESTACADO_RECLUTADOR.trimestral : 0))}
                    {" "}<small>/ trimestre</small>
                  </span>
                </div>
                <p className="plan-price-note">
                  equivale a {formatQ(Math.round((3584 + (destacarReclutador ? DESTACADO_RECLUTADOR.trimestral : 0)) / 3))} al mes
                </p>

                <label className="destacar-check">
                  <input
                    type="checkbox"
                    checked={destacarReclutador}
                    onChange={(e) => setDestacarReclutador(e.target.checked)}
                  />
                  Destacado automático en todas tus vacantes (el extra
                  varía según el período que elijas abajo)
                </label>

                <button
                  className="plan-cta"
                  style={{ cursor: "pointer", width: "100%", border: "none" }}
                  disabled={solicitando === "reclutadortrimestral"}
                  onClick={() => pedirReclutador("trimestral")}
                >
                  {solicitando === "reclutadortrimestral" ? "Enviando…" : "Solicitar trimestral"}
                </button>

                <ul className="plan-features">
                  <li><span className="check">✓</span> Vacantes ilimitadas</li>
                  <li><span className="check">✓</span> Usuarios de equipo ilimitados</li>
                  <li><span className="check">✓</span> Cada publicación dura 30 días</li>
                </ul>

                <div className="plan-options">

                  <p className="plan-options-label">Otros períodos</p>

                  <div className="option-row option-row-btn">
                    <span>
                      Semestral —{" "}
                      {formatQ(6720 + (destacarReclutador ? DESTACADO_RECLUTADOR.semestral : 0))}
                    </span>
                    <button
                      className="plan-cta"
                      style={{ cursor: "pointer", width: "auto", padding: "10px 16px", fontSize: 13.5, border: "none" }}
                      disabled={solicitando === "reclutadorsemestral"}
                      onClick={() => pedirReclutador("semestral")}
                    >
                      {solicitando === "reclutadorsemestral" ? "Enviando…" : "Solicitar"}
                    </button>
                  </div>

                  <div className="option-row option-row-btn">
                    <span>
                      Anual —{" "}
                      {formatQ(12096 + (destacarReclutador ? DESTACADO_RECLUTADOR.anual : 0))}
                    </span>
                    <button
                      className="plan-cta"
                      style={{ cursor: "pointer", width: "auto", padding: "10px 16px", fontSize: 13.5, border: "none" }}
                      disabled={solicitando === "reclutadoranual"}
                      onClick={() => pedirReclutador("anual")}
                    >
                      {solicitando === "reclutadoranual" ? "Enviando…" : "Solicitar"}
                    </button>
                  </div>

                </div>

              </div>

            </div>

          )}

        </Box>

      </main>

    </div>

  );

}

export default Plans;
