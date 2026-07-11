create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null unique
    references auth.users(id)
    on delete cascade,

  role text not null check (role in ('candidato', 'empresa', 'admin')),

  first_name text,
  last_name text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_user_id_idx
  on public.profiles(user_id);

create index if not exists profiles_role_idx
  on public.profiles(role);

create table if not exists public.company_profiles (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null unique
    references auth.users(id)
    on delete cascade,

  commercial_name text not null,
  legal_name text not null,
  nit text not null unique,

  phone text,
  website text,

  department text not null,
  municipality text not null,
  address text,
  description text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists company_profiles_user_id_idx
  on public.company_profiles(user_id);

create index if not exists company_profiles_nit_idx
  on public.company_profiles(nit);

create index if not exists company_profiles_location_idx
  on public.company_profiles(department, municipality);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_company_profiles_updated_at on public.company_profiles;

create trigger set_company_profiles_updated_at
before update on public.company_profiles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.company_profiles enable row level security;

drop policy if exists "Users can read own profile"
on public.profiles;

create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (
  auth.uid() = user_id
);

drop policy if exists "Users can insert own profile"
on public.profiles;

create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (
  auth.uid() = user_id
);

drop policy if exists "Users can update own profile"
on public.profiles;

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);

drop policy if exists "Users can read own company profile"
on public.company_profiles;

create policy "Users can read own company profile"
on public.company_profiles
for select
to authenticated
using (
  auth.uid() = user_id
);

drop policy if exists "Users can insert own company profile"
on public.company_profiles;

create policy "Users can insert own company profile"
on public.company_profiles
for insert
to authenticated
with check (
  auth.uid() = user_id
);

drop policy if exists "Users can update own company profile"
on public.company_profiles;

create policy "Users can update own company profile"
on public.company_profiles
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);

comment on column public.company_profiles.department is
  'Temporary text field. Future sprint: replace with departments reference table and foreign key.';

comment on column public.company_profiles.municipality is
  'Temporary text field. Future sprint: replace with municipalities reference table and foreign key.';
