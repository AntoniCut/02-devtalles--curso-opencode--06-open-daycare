do $$ begin
  create type public.child_status as enum ('active', 'archived');
exception
  when duplicate_object then null;
end $$;

create table public.children (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id),
  full_name text not null,
  birth_date date not null,
  enrolled_at date,
  medical_notes text,
  allergy_tags text[] not null default '{}',
  photo_consent boolean not null default true,
  status public.child_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.children enable row level security;

create index children_room_id_idx on public.children (room_id);

create trigger set_children_updated_at
  before update on public.children
  for each row
  execute function public.set_updated_at();
