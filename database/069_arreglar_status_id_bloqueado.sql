-- 069_arreglar_status_id_bloqueado.sql
-- CORRIGE UN PROBLEMA DE ESQUEMA PREEXISTENTE, no relacionado con RLS ni con
-- las migraciones 063-068.
--
-- Se detectó que public.application_status_history tiene una columna
-- `status_id` (FK a application_statuses) marcada como NOT NULL sin valor
-- por defecto. Esa columna no está en ninguna migración registrada — se
-- agregó en algún momento directo desde el dashboard de Supabase, igual que
-- pasó antes con la tabla `testimonials` y con la función
-- `admin_get_current_assignment`.
--
-- El código real de la aplicación (src/services/applicationService.js y
-- candidateService.js) NUNCA llena `status_id` — solo llena `application_id`
-- y `status` (texto plano), que es como funciona el resto del sistema
-- (etiquetas, filtros, src/utils/applicationStatus.js). `application_statuses`
-- ya se había identificado como una tabla sin uso real en el código.
--
-- Resultado: CADA intento de guardar un cambio de estado en el historial
-- fallaba con error 23502 (not_null_violation) desde que se agregó esa
-- columna, de forma silenciosa (el código no revisa el resultado de ese
-- insert). Por eso la tabla estaba completamente vacía y el correo de aviso
-- nunca se disparaba — el webhook nunca tuvo un evento que detectar.
--
-- La corrección: devolver status_id a su estado opcional, que es
-- coherente con cómo el código realmente funciona hoy.

BEGIN;

ALTER TABLE public.application_status_history
  ALTER COLUMN status_id DROP NOT NULL;

COMMIT;
