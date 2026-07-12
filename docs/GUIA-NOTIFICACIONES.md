# Guía: activar los correos de ChanceGT

Todo se hace con clics (sin terminal). Son 4 partes, ~20 minutos.

Los correos que se enviarán automáticamente:
- Candidato crea su perfil → bienvenida con consejos
- Candidato se postula → confirmación al candidato + aviso al reclutador
- Reclutador cambia un estado → aviso al candidato

---

## Parte 1 — Cuenta en Resend (el cartero)

1. Entra a **resend.com** → Sign up (gratis: 100 correos/día, 3,000/mes)
2. Menú **API Keys** → **Create API Key** → nombre `chancegt` → copia la
   llave (empieza con `re_...`). Guárdala, la usarás en la Parte 3.
3. Menú **Domains** → **Add Domain** → escribe `chancegt.com`
4. Resend te mostrará 2-3 registros DNS (tipo TXT/MX). Agrégalos donde
   administras el dominio chancegt.com (donde lo compraste, o Vercel →
   Settings → Domains si lo manejas ahí). Copia cada registro tal cual.
5. Espera a que Resend diga **Verified** (minutos u horas).

> Mientras el dominio no esté verificado, Resend solo envía correos A TU
> PROPIO correo de la cuenta Resend (modo prueba). Sirve para probar,
> pero para enviar a candidatos reales el dominio debe estar Verified.

---

## Parte 2 — Crear la función en Supabase

1. supabase.com → tu proyecto → menú **Edge Functions**
2. **Deploy a new function** → elige la opción de crear **en el editor
   del navegador** (Via Editor)
3. Nombre: `notificaciones`
4. Borra el código de ejemplo y pega TODO el contenido del archivo
   `supabase/functions/notificaciones/index.ts` (está en tu proyecto,
   ábrelo con VS Code y copia todo)
5. **Deploy**
6. Entra a la función → pestaña **Details** → desactiva
   **"Enforce JWT verification"** (el webhook la llamará directamente;
   la protegemos con una palabra secreta en su lugar)

---

## Parte 3 — Los secretos

1. Edge Functions → **Secrets** (o Settings → Edge Functions → Secrets)
2. Agrega DOS secretos:
   - Nombre: `RESEND_API_KEY` → Valor: la llave `re_...` de la Parte 1
   - Nombre: `WEBHOOK_SECRET` → Valor: inventa una palabra larga, por
     ejemplo `chancegt-notifica-2026-quetzal` (la usarás en la Parte 4)

---

## Parte 4 — Los gatillos (Database Webhooks)

Crearás DOS webhooks idénticos, uno por tabla.

1. Supabase → menú **Database** → **Webhooks** → **Create a new hook**

### Webhook 1: bienvenida
- Name: `bienvenida-candidato`
- Table: `candidate_profiles`
- Events: marca solo **Insert**
- Type: **Supabase Edge Functions** → selecciona `notificaciones`
- En **HTTP Headers** agrega uno nuevo:
  - Header name: `x-webhook-secret`
  - Header value: tu palabra secreta de la Parte 3
- **Create webhook**

### Webhook 2: eventos de postulación
- Name: `eventos-postulacion`
- Table: `application_status_history`
- Events: marca solo **Insert**
- Type: **Supabase Edge Functions** → `notificaciones`
- Mismo header `x-webhook-secret` con tu palabra secreta
- **Create webhook**

---

## Probar

1. Crea una cuenta de candidato nueva (con un correo tuyo real) y crea
   su perfil → debe llegar el correo de bienvenida
2. Postúlate a una vacante → correo de confirmación al candidato y
   correo de "nuevo candidato" al correo de la empresa
3. Como empresa, cambia el estado → correo al candidato con el estado

Si algo no llega:
- Revisa **Edge Functions → notificaciones → Logs** (ahí se imprime
  cualquier error, por ejemplo de Resend)
- Revisa en Resend → **Emails** si el envío aparece y su estado
- Modo prueba de Resend: sin dominio verificado, solo llegan correos
  a tu propia dirección de la cuenta Resend

## Nota sobre el remitente

El código envía desde `notificaciones@chancegt.com`. Ese buzón no
necesita existir para ENVIAR (Resend lo firma con tu dominio), pero
si quieres RECIBIR respuestas ahí, tendrías que crear el correo con
tu proveedor. Para el MVP no es necesario.
