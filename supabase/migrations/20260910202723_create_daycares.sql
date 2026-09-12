-- SPEC SUPABASE 01 — Create root table `daycares`
-- Reference schema: 07-db-Schema/opendaycare-database-schema.md (table 1)
-- Additions requested by the user: `address`, `updated_at`

create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.daycares enable row level security;

insert into public.daycares (name) values ('Guardería Sala Soles');
