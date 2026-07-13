import { supabase } from "../lib/supabase";
import { updateApplicationStatus } from "./applicationService";

/*
  Entrevistas (tabla interviews).

  Agendar una entrevista tambien mueve la postulacion al estado
  "interview": eso alimenta la linea de tiempo del candidato y
  dispara el correo automatico que ya existe (webhook de
  application_status_history -> Edge Function notificaciones).
*/

export const INTERVIEW_MODALITIES = [
  "Presencial",
  "Virtual",
  "Telefónica",
];

export const INTERVIEW_STATUSES = [
  { value: "programada", label: "Programada" },
  { value: "realizada", label: "Realizada" },
  { value: "cancelada", label: "Cancelada" },
];

/* Agenda una entrevista y actualiza el estado de la postulacion */
export async function scheduleInterview({
  applicationId,
  scheduledAt,
  modality,
  locationOrLink,
  notes,
  currentStatus,
}) {

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await supabase
    .from("interviews")
    .insert({
      application_id: applicationId,
      scheduled_at: scheduledAt,
      modality: modality || "Presencial",
      location_or_link: locationOrLink || null,
      notes: notes || null,
      created_by: user?.id || null,
    })
    .select("id, scheduled_at, modality, location_or_link, notes, status")
    .single();

  /*
    Paso real en la linea de tiempo + correo automatico:
    solo si la postulacion no estaba ya en "interview".
  */
  if (result.data && currentStatus !== "interview") {
    await updateApplicationStatus(applicationId, "interview");
  }

  return result;

}

/*
  Todas las entrevistas de una empresa, con candidato y vacante.
  El filtro por empresa va anidado (jobs.company_id).
*/
export async function getCompanyInterviews(companyId) {

  return await supabase
    .from("interviews")
    .select(`
      id,
      scheduled_at,
      modality,
      location_or_link,
      notes,
      status,
      created_at,
      updated_at,
      applications!inner (
        id,
        current_status,
        jobs!inner ( id, title, company_id ),
        candidate_profiles ( id, first_name, last_name, phone, profession )
      )
    `)
    .eq("applications.jobs.company_id", companyId)
    .order("scheduled_at", { ascending: true });

}

/* Cambiar estado (realizada / cancelada) o notas */
export async function updateInterview(interviewId, fields) {

  return await supabase
    .from("interviews")
    .update(fields)
    .eq("id", interviewId)
    .select("id, scheduled_at, modality, location_or_link, notes, status")
    .single();

}

/* Eliminar una entrevista agendada por error */
export async function deleteInterview(interviewId) {

  return await supabase
    .from("interviews")
    .delete()
    .eq("id", interviewId);

}

/*
  Entrevistas de UNA postulacion vistas por el CANDIDATO.
  Usa la funcion candidate_interviews (sin notas internas).
*/
export async function getMyInterviewsForApplication(applicationId) {

  return await supabase.rpc("candidate_interviews", {
    p_application_id: applicationId,
  });

}

/* ¿Es hoy? (en hora local del navegador) */
export function esHoy(fechaISO) {

  if (!fechaISO) return false;

  const fecha = new Date(fechaISO);
  const hoy = new Date();

  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()
  );

}
