// =====================================================================
// ChanceGT - Funcion de notificaciones por correo
//
// La llaman de dos formas:
//
//  A) Los Database Webhooks de Supabase, cuando:
//     1. Se crea un perfil de candidato  -> bienvenida + consejos
//     2. Se inserta un evento en application_status_history:
//        - status = "applied" -> confirma al candidato y avisa al
//          reclutador
//        - otro status        -> avisa al candidato el cambio de
//          estado
//
//  B) El cron diario (pg_cron, ver SQL 048), con
//     { "action": "recordatorios_pendientes" } -> le avisa a la
//     empresa cuántos candidatos tiene sin respuesta hace varios
//     días, para que no se atrase.
//
// Secretos requeridos (Edge Functions -> Secrets):
//  RESEND_API_KEY   -> la llave de tu cuenta de Resend
//  WEBHOOK_SECRET   -> palabra secreta que tambien pones en el webhook
//                      y en el cron job de SQL 048
// =====================================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const RESEND_KEY = Deno.env.get("RESEND_API_KEY")!;
const SECRET = Deno.env.get("WEBHOOK_SECRET")!;

// Cambia esto cuando verifiques tu dominio en Resend:
const FROM = "ChanceGT <notificaciones@chancegt.com>";

const ETIQUETAS: Record<string, string> = {
  reviewing: "En revisión",
  interview: "Entrevista",
  hired: "Contratado",
  rejected: "No seleccionado",
};

const MENSAJES: Record<string, string> = {
  reviewing:
    "La empresa está revisando tu perfil. ¡Buen momento para repasar que tu información esté completa!",
  interview:
    "¡Felicidades! La empresa quiere entrevistarte. Pronto se pondrán en contacto contigo — mantén tu teléfono a la mano.",
  hired:
    "¡FELICIDADES! 🎉 La empresa te seleccionó para el puesto. ¡Lo lograste!",
  rejected:
    "Esta vez la empresa eligió otro perfil. No te desanimes: cada postulación te acerca más. Hay más vacantes esperándote en ChanceGT.",
};

async function enviarCorreo(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_KEY}`,
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });

  if (!res.ok) {
    console.error("Resend error:", await res.text());
  }
}

function plantilla(titulo: string, cuerpo: string) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
    <div style="background:#0B1F3A;border-radius:12px 12px 0 0;padding:22px 26px;">
      <span style="color:#fff;font-size:20px;font-weight:bold;">Chance<span style="color:#4B8BFF;">GT</span></span>
    </div>
    <div style="border:1px solid #E6E8EC;border-top:none;border-radius:0 0 12px 12px;padding:26px;">
      <h2 style="color:#0B1F3A;margin:0 0 12px;">${titulo}</h2>
      <div style="color:#333;font-size:15px;line-height:1.6;">${cuerpo}</div>
      <p style="color:#94A0B1;font-size:12px;margin-top:26px;">
        ChanceGT — Conectamos talento, creamos oportunidades 🇬🇹<br/>
        Este correo se envió automáticamente; no es necesario responderlo.
      </p>
    </div>
  </div>`;
}

async function emailDeUsuario(userId: string): Promise<string | null> {
  const { data } = await supabase.auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

Deno.serve(async (req) => {
  // Solo acepta llamadas que traigan la palabra secreta
  if (req.headers.get("x-webhook-secret") !== SECRET) {
    return new Response("No autorizado", { status: 401 });
  }

  const payload = await req.json();
  const { table, type, record, action } = payload;

  try {
    // ============ 0. Recordatorio diario de pendientes atrasados ============
    if (action === "recordatorios_pendientes") {
      const { data: filas, error } = await supabase.rpc(
        "empresas_con_pendientes_atrasados",
        { umbral_dias: 3, cooldown_dias: 3 },
      );

      if (error) {
        console.error("Error consultando pendientes atrasados:", error);
        return new Response("ok");
      }

      const yaMarcadas = new Set<string>();

      for (const fila of filas ?? []) {
        if (!fila.destinatario_email) continue;

        await enviarCorreo(
          fila.destinatario_email,
          `Tienes ${fila.pendientes} candidato(s) esperando respuesta en ${fila.company_name}`,
          plantilla(
            "Candidatos esperando tu respuesta",
            `<p>En <strong>${fila.company_name}</strong> tienes <strong>${fila.pendientes}</strong> candidato(s) sin respuesta todavía.</p>
             <p>El más antiguo lleva <strong>${fila.dias_mas_antiguo} días</strong> esperando.</p>
             <p style="background:#FBF0DF;border-radius:8px;padding:12px;">💡 Responder rápido — aunque sea "No seleccionado" — mejora tu reputación pública en ChanceGT y atrae mejor talento.</p>
             <p>Entra a tu panel → <strong>Candidatos</strong> para revisarlos ahora.</p>`,
          ),
        );

        if (!yaMarcadas.has(fila.company_id)) {
          await supabase.rpc("marcar_recordatorio_enviado", {
            p_company_id: fila.company_id,
          });
          yaMarcadas.add(fila.company_id);
        }
      }

      return new Response("ok");
    }

    // ============ 1. Bienvenida al crear perfil ============
    if (table === "candidate_profiles" && type === "INSERT") {
      const email = await emailDeUsuario(record.user_id);
      if (!email) return new Response("ok");

      const nombre = record.first_name || "";

      await enviarCorreo(
        email,
        "¡Bienvenido a ChanceGT! Tu perfil ya está listo 🇬🇹",
        plantilla(
          `¡Hola ${nombre}! Tu perfil quedó creado`,
          `<p>Ya puedes postularte a las vacantes de ChanceGT. Tres consejos para conseguir empleo más rápido:</p>
           <ul>
             <li><strong>Completa tu perfil al 100%</strong> — formación, experiencia y habilidades. Las empresas ven primero a los perfiles completos.</li>
             <li><strong>Usa las palabras clave</strong> que las empresas escriben en sus requisitos (por ejemplo: SAP, Excel, ventas). Así subes en las coincidencias.</li>
             <li><strong>Revisa tu pretensión salarial</strong> — si está dentro del rango de la plaza, apareces mejor posicionado.</li>
           </ul>
           <p>En cada vacante verás tus <strong>coincidencias reales</strong> y qué tan bien responde la empresa a sus candidatos. ¡Mucha suerte!</p>`,
        ),
      );
    }

    // ============ 2. Eventos de postulacion ============
    if (table === "application_status_history" && type === "INSERT") {
      // Datos de la postulacion: vacante, candidato y empresa
      const { data: app } = await supabase
        .from("applications")
        .select(`
          id,
          jobs (
            title,
            company_profiles ( company_name, user_id )
          ),
          candidate_profiles ( first_name, last_name, user_id )
        `)
        .eq("id", record.application_id)
        .maybeSingle();

      if (!app) return new Response("ok");

      const vacante = app.jobs?.title ?? "la vacante";
      const empresa = app.jobs?.company_profiles?.company_name ?? "La empresa";
      const candidato = [
        app.candidate_profiles?.first_name,
        app.candidate_profiles?.last_name,
      ].filter(Boolean).join(" ") || "Un candidato";

      const emailCandidato = app.candidate_profiles?.user_id
        ? await emailDeUsuario(app.candidate_profiles.user_id)
        : null;

      if (record.status === "applied") {
        // --- Confirmacion al candidato ---
        if (emailCandidato) {
          await enviarCorreo(
            emailCandidato,
            `Tu postulación a "${vacante}" fue enviada ✅`,
            plantilla(
              "¡Postulación enviada!",
              `<p>Tu postulación a <strong>${vacante}</strong> en <strong>${empresa}</strong> ya llegó al reclutador.</p>
               <p>Te avisaremos por este correo cada vez que la empresa cambie el estado de tu proceso. También puedes seguirlo en tiempo real desde <strong>Mi panel → Ver mi proceso</strong>.</p>`,
            ),
          );
        }

        // --- Aviso al reclutador ---
        const emailEmpresa = app.jobs?.company_profiles?.user_id
          ? await emailDeUsuario(app.jobs.company_profiles.user_id)
          : null;

        if (emailEmpresa) {
          await enviarCorreo(
            emailEmpresa,
            `Nuevo candidato para "${vacante}" 🎯`,
            plantilla(
              "¡Tienes un candidato nuevo!",
              `<p><strong>${candidato}</strong> acaba de postularse a <strong>${vacante}</strong>.</p>
               <p>Entra a tu panel → <strong>Candidatos</strong> para ver su perfil completo y su afinidad con la plaza.</p>
               <p style="background:#FBF0DF;border-radius:8px;padding:12px;">💡 Recuerda: tu porcentaje de respuesta es público para los candidatos. Responder rápido —aunque sea "No seleccionado"— mejora tu reputación y atrae mejor talento.</p>`,
            ),
          );
        }
      } else if (emailCandidato && ETIQUETAS[record.status]) {
        // --- Cambio de estado -> candidato ---
        await enviarCorreo(
          emailCandidato,
          `Tu postulación a "${vacante}" cambió a: ${ETIQUETAS[record.status]}`,
          plantilla(
            `Novedades de tu postulación`,
            `<p><strong>${empresa}</strong> cambió el estado de tu postulación a <strong>${vacante}</strong>:</p>
             <p style="background:#E4F5F0;color:#0E8F73;border-radius:8px;padding:12px;font-size:17px;font-weight:bold;text-align:center;">${ETIQUETAS[record.status]}</p>
             <p>${MENSAJES[record.status] ?? ""}</p>
             <p>Mira tu línea de tiempo completa en <strong>Mi panel → Ver mi proceso</strong>.</p>`,
          ),
        );
      }
    }
  } catch (e) {
    console.error("Error enviando notificacion:", e);
  }

  return new Response("ok");
});
