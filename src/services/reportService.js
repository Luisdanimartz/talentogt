import { supabase } from "../lib/supabase";

/*
  Reportes de la empresa. Todo sale de funciones (011/012_reportes.sql)
  que calculan numeros reales a partir de applications,
  application_status_history y jobs — nada inventado.

  desde / hasta son opcionales (Date o ISO string). Si no se mandan,
  el reporte es de todo el historico.
*/

/* Embudo general: postulados -> revision -> entrevista -> contratado */
export async function getHiringFunnel(companyId, desde, hasta) {
  return await supabase
    .rpc("company_hiring_funnel", {
      cid: companyId,
      p_desde: desde ? new Date(desde).toISOString() : null,
      p_hasta: hasta ? new Date(hasta).toISOString() : null,
    })
    .single();
}

/* Cuantos dias tarda la empresa en pasar de una etapa a la
   siguiente. Ver database/059_eficiencia_por_etapa.sql */
export async function getStageEfficiency(companyId, desde, hasta) {
  return await supabase.rpc("company_stage_efficiency", {
    cid: companyId,
    p_desde: desde ? new Date(desde).toISOString() : null,
    p_hasta: hasta ? new Date(hasta).toISOString() : null,
  });
}

/* Postulaciones y contrataciones mes a mes (ultimos N meses).
   No usa el filtro de fecha de la pantalla a proposito: es una
   tendencia, y una tendencia de un solo mes no dice nada. */
export async function getMonthlyMetrics(companyId, meses = 12) {
  return await supabase.rpc("company_monthly_metrics", {
    cid: companyId,
    p_meses: meses,
  });
}

/* El mismo desglose, vacante por vacante */
export async function getJobsReport(companyId, desde, hasta) {
  return await supabase.rpc("company_jobs_report", {
    cid: companyId,
    p_desde: desde ? new Date(desde).toISOString() : null,
    p_hasta: hasta ? new Date(hasta).toISOString() : null,
  });
}
