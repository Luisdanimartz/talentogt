-- =====================================================================
-- 044 - Orden correcto en el Tarifario (admin) y "Asignar tarifa"
--
-- admin_list_pricing_plans() ordena por sort_order y luego por fecha
-- de creación. Como Reclutador se creó antes que Individual/
-- Empresarial, aparecía primero — al revés de como se ve en la
-- página pública /planes. Se fija sort_order explícito para que el
-- orden sea siempre: Individual, Empresarial, Reclutador.
--
-- Segura de correr más de una vez.
-- =====================================================================

update public.pricing_plans set sort_order = 1 where name = 'Individual';
update public.pricing_plans set sort_order = 2 where name = 'Empresarial 5 créditos';
update public.pricing_plans set sort_order = 3 where name = 'Empresarial 10 créditos';
update public.pricing_plans set sort_order = 4 where name = 'Reclutador Trimestral';
update public.pricing_plans set sort_order = 5 where name = 'Reclutador Semestral';
update public.pricing_plans set sort_order = 6 where name = 'Reclutador Anual';
