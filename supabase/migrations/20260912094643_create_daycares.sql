-- SPEC SUPABASE 01 — Create root table `daycares` (replacement migration)
-- Reference schema: 07-db-Schema/opendaycare-database-schema.md (table 1)
-- User-requested additions: `address`, `updated_at` (+ trigger)

create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.daycares enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_daycares_updated_at
  before update on public.daycares
  for each row
  execute function public.set_updated_at();

insert into public.daycares (name) values
  ('Guardería Sala Soles'),
  ('Guardería Estrellitas'),
  ('Guardería Pequeños Genios'),
  ('Guardería Tricolor');
