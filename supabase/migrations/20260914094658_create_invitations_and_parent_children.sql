-- SPEC 09 — Create `invitations` and `parent_children` tables, enums, RLS policies,
-- FK indexes and updated_at triggers.
-- Reference schema: 07-db-Schema/opendaycare-database-schema.md (tables 5 and 6)
-- Depends on: SPEC SUPABASE 02 (users, set_updated_at), SPEC SUPABASE 04 (children)

do $$ begin
  create type public.relationship_type as enum ('father', 'mother', 'guardian');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');
exception
  when duplicate_object then null;
end $$;

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id),
  invited_by uuid not null references public.users(id),
  full_name text not null,
  email text not null,
  relationship public.relationship_type not null,
  code text not null unique,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.parent_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users(id),
  child_id uuid not null references public.children(id),
  relationship public.relationship_type not null,
  created_at timestamptz not null default now(),
  unique (parent_id, child_id)
);

alter table public.invitations enable row level security;
alter table public.parent_children enable row level security;

-- Anonymous visitors need to validate the invitation code on /activate
-- before having a session. Codes are short-lived (7 days) single-use tokens.
create policy "invitations_select_anon"
  on public.invitations
  for select
  to anon
  using (true);

create policy "invitations_select_authenticated"
  on public.invitations
  for select
  to authenticated
  using (true);

create policy "invitations_update_authenticated"
  on public.invitations
  for update
  to authenticated
  using (true)
  with check (true);

create policy "parent_children_select_authenticated"
  on public.parent_children
  for select
  to authenticated
  using (true);

create policy "parent_children_insert_authenticated"
  on public.parent_children
  for insert
  to authenticated
  with check (true);

create index invitations_child_id_idx on public.invitations (child_id);
create index invitations_invited_by_idx on public.invitations (invited_by);
create index parent_children_parent_id_idx on public.parent_children (parent_id);
create index parent_children_child_id_idx on public.parent_children (child_id);

create trigger set_invitations_updated_at
  before update on public.invitations
  for each row
  execute function public.set_updated_at();
