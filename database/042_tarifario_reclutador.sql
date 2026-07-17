-- =====================================================================
-- 042 - Tarifario real: fuera el plan de prueba, entra Reclutador
--
-- 1. Desactiva "Paquete Basico" (el plan viejo de pruebas, Q350/30d).
--    No se borra porque una empresa ya lo tiene asignado en su
--    historial (borrarlo tronaría por la relación con
--    company_pricing_assignments) — con desactivarlo alcanza para
--    que ya no aparezca como opción al asignar tarifa nueva.
--
-- 2. Crea los 3 planes reales de Reclutador (Individual y Empresarial
--    NO van aquí — esos funcionan por créditos, ya resuelto en la
--    migración 041, se regalan directo desde la sección de arriba
--    en Empresas, no necesitan fila en el Tarifario).
--
-- Segura de correr más de una vez (no duplica los planes de
-- Reclutador si ya existen con ese nombre exacto).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Desactivar el plan de prueba viejo
-- ---------------------------------------------------------------------

update public.pricing_plans
set is_active = false
where name = 'Paquete Basico';


-- ---------------------------------------------------------------------
-- 2. Reclutador — trimestral, semestral, anual
-- ---------------------------------------------------------------------

insert into public.pricing_plans (name, price, currency, duration_days, job_limit, is_active, seat_limit)
select 'Reclutador Trimestral', 3584.00, 'GTQ', 90, null, true, null
where not exists (
  select 1 from public.pricing_plans where name = 'Reclutador Trimestral'
);

insert into public.pricing_plans (name, price, currency, duration_days, job_limit, is_active, seat_limit)
select 'Reclutador Semestral', 6720.00, 'GTQ', 180, null, true, null
where not exists (
  select 1 from public.pricing_plans where name = 'Reclutador Semestral'
);

insert into public.pricing_plans (name, price, currency, duration_days, job_limit, is_active, seat_limit)
select 'Reclutador Anual', 12096.00, 'GTQ', 365, null, true, null
where not exists (
  select 1 from public.pricing_plans where name = 'Reclutador Anual'
);
