-- Security audit fix (2026-10-02) — move RLS helpers to a private schema.
-- Functions in `public` are exposed as RPC endpoints through PostgREST; the
-- helpers only need to be callable from RLS policies, so they live in a
-- non-exposed schema. Public policies are recreated to reference them.

create schema if not exists private;

create or replace function private.current_user_daycare_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select u.daycare_id
  from public.users u
  where u.id = (select auth.uid())
$$;

create or replace function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select u.role
  from public.users u
  where u.id = (select auth.uid())
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users u
    where u.id = (select auth.uid())
      and u.role = 'admin'
  )
$$;

create or replace function private.is_parent_of_child(p_child_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.parent_children pc
    where pc.child_id = p_child_id
      and pc.parent_id = (select auth.uid())
  )
$$;

create or replace function private.is_parent_of_room(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.children c
    join public.parent_children pc on pc.child_id = c.id
    where c.room_id = p_room_id
      and pc.parent_id = (select auth.uid())
  )
$$;

create or replace function private.is_staff_of_daycare(p_daycare_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.users u
    where u.id = (select auth.uid())
      and u.role = 'staff'
      and u.daycare_id = p_daycare_id
  )
$$;

create or replace function private.is_staff_of_room(p_room_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.rooms r
    where r.id = p_room_id
      and private.is_staff_of_daycare(r.daycare_id)
  )
$$;

create or replace function private.is_staff_of_child(p_child_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.children c
    where c.id = p_child_id
      and private.is_staff_of_room(c.room_id)
  )
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;

revoke all on function private.current_user_daycare_id() from public, anon;
revoke all on function private.current_user_role() from public, anon;
revoke all on function private.is_admin() from public, anon;
revoke all on function private.is_parent_of_child(uuid) from public, anon;
revoke all on function private.is_parent_of_room(uuid) from public, anon;
revoke all on function private.is_staff_of_daycare(uuid) from public, anon;
revoke all on function private.is_staff_of_room(uuid) from public, anon;
revoke all on function private.is_staff_of_child(uuid) from public, anon;

grant execute on function private.current_user_daycare_id() to authenticated;
grant execute on function private.current_user_role() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_parent_of_child(uuid) to authenticated;
grant execute on function private.is_parent_of_room(uuid) to authenticated;
grant execute on function private.is_staff_of_daycare(uuid) to authenticated;
grant execute on function private.is_staff_of_room(uuid) to authenticated;
grant execute on function private.is_staff_of_child(uuid) to authenticated;

drop policy if exists "daycares_select_own" on public.daycares;
create policy "daycares_select_own"
  on public.daycares
  for select
  to authenticated
  using (
    private.is_admin()
    or id = private.current_user_daycare_id()
  );

drop policy if exists "users_select_self_or_admin" on public.users;
create policy "users_select_self_or_admin"
  on public.users
  for select
  to authenticated
  using (
    id = (select auth.uid())
    or private.is_admin()
  );

drop policy if exists "rooms_select_scoped" on public.rooms;
create policy "rooms_select_scoped"
  on public.rooms
  for select
  to authenticated
  using (
    private.is_admin()
    or private.is_staff_of_room(id)
    or private.is_parent_of_room(id)
  );

drop policy if exists "children_select_scoped" on public.children;
create policy "children_select_scoped"
  on public.children
  for select
  to authenticated
  using (
    private.is_admin()
    or private.is_staff_of_child(id)
    or private.is_parent_of_child(id)
  );

drop policy if exists "children_insert_staff_own_daycare" on public.children;
create policy "children_insert_staff_own_daycare"
  on public.children
  for insert
  to authenticated
  with check (
    private.is_admin()
    or private.is_staff_of_room(room_id)
  );

drop policy if exists "invitations_select_staff_own_daycare" on public.invitations;
create policy "invitations_select_staff_own_daycare"
  on public.invitations
  for select
  to authenticated
  using (
    private.is_admin()
    or private.is_staff_of_child(child_id)
  );

drop policy if exists "invitations_insert_staff_own_daycare" on public.invitations;
create policy "invitations_insert_staff_own_daycare"
  on public.invitations
  for insert
  to authenticated
  with check (
    private.is_admin()
    or (
      private.is_staff_of_child(child_id)
      and invited_by = (select auth.uid())
    )
  );

drop policy if exists "invitations_delete_staff_own_daycare" on public.invitations;
create policy "invitations_delete_staff_own_daycare"
  on public.invitations
  for delete
  to authenticated
  using (
    private.is_admin()
    or private.is_staff_of_child(child_id)
  );

drop policy if exists "parent_children_select_scoped" on public.parent_children;
create policy "parent_children_select_scoped"
  on public.parent_children
  for select
  to authenticated
  using (
    private.is_admin()
    or parent_id = (select auth.uid())
    or private.is_staff_of_child(child_id)
  );

create or replace function public.get_child_parents()
returns table (
  child_id uuid,
  parent_name text,
  relationship public.relationship_type,
  status text
)
language sql
stable
security definer
set search_path = ''
as $$
  with visible_children as (
    select c.id
    from public.children c
    where private.is_admin()
      or private.is_staff_of_child(c.id)
      or private.is_parent_of_child(c.id)
  )
  select pc.child_id, u.full_name, pc.relationship, 'active'::text
  from public.parent_children pc
  join public.users u on u.id = pc.parent_id
  where pc.child_id in (select id from visible_children)
  union all
  select i.child_id, i.full_name, i.relationship, 'pending'::text
  from public.invitations i
  where i.status = 'pending'
    and i.expires_at > now()
    and i.accepted_at is null
    and i.child_id in (select id from visible_children);
$$;

drop function if exists public.current_user_daycare_id();
drop function if exists public.current_user_role();
drop function if exists public.is_admin();
drop function if exists public.is_parent_of_child(uuid);
drop function if exists public.is_parent_of_room(uuid);
drop function if exists public.is_staff_of_daycare(uuid);
drop function if exists public.is_staff_of_room(uuid);
drop function if exists public.is_staff_of_child(uuid);

revoke execute on function public.accept_invitation(text) from anon;
