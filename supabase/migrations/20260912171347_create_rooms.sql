create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

create index rooms_daycare_id_idx on public.rooms (daycare_id);

create trigger set_rooms_updated_at
  before update on public.rooms
  for each row
  execute function public.set_updated_at();

insert into public.rooms (daycare_id, name)
select id, s.name
from public.daycares d
  cross join (values ('Soles'), ('Luna'), ('Estrellas')) as s(name)
where d.name = 'Guardería Sala Soles';
