-- =========================================================
-- 030_vencimiento_en_lista.sql
--
-- Agrega la fecha de vencimiento y los dias restantes del
-- plan de PAGO vigente directo en admin_companies(), para
-- verlo en la tabla sin tener que entrar a cada empresa.
-- =========================================================

drop function if exists public.admin_companies();

create or replace function public.admin_companies()
returns table (
  id uuid,
  company_name text,
  nit text,
  email text,
  phone text,
  department_name text,
  status text,
  plan text,
  active_plan_name text,
  plan_expires_at timestamptz,
  dias_para_vencer integer,
  is_collaborator boolean,
  total_vacantes bigint,
  total_postulaciones bigint,
  unlock_credits integer,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin

  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  return query
  select
    c.id,
    c.company_name::text,
    c.nit::text,
    c.email::text,
    c.phone::text,
    d.name::text,
    c.status::text,
    c.plan::text,
    (select gap.plan_name from public.get_company_active_plan(c.id) gap),
    v.expires_at,
    case when v.expires_at is null then null
         else greatest(0, ceil(extract(epoch from (v.expires_at - now())) / 86400))::integer end,
    c.is_collaborator,
    count(distinct j.id)::bigint,
    count(distinct a.id)::bigint,
    c.unlock_credits,
    c.created_at
  from public.company_profiles c
  left join public.departments d on d.id = c.department_id
  left join public.jobs j on j.company_id = c.id
  left join public.applications a on a.job_id = j.id
  left join lateral (
    select cpa.expires_at
    from public.company_pricing_assignments cpa
    where cpa.company_id = c.id
      and cpa.pricing_plan_id is not null
      and (cpa.expires_at is null or cpa.expires_at > now())
    order by cpa.started_at desc
    limit 1
  ) v on true
  group by c.id, c.company_name, c.nit, c.email, c.phone, d.name,
           c.status, c.plan, c.is_collaborator, c.unlock_credits, c.created_at,
           v.expires_at
  order by c.created_at desc;

end;
$$;

revoke all on function public.admin_companies() from public;
grant execute on function public.admin_companies() to authenticated;
