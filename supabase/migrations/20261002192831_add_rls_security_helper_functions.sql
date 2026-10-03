-- Security audit fix (2026-10-02) — RLS helper functions.
-- SECURITY DEFINER so policies can resolve the caller's daycare/role and
-- parent-child links without being filtered by the RLS of public.users or
-- public.parent_children (which would recurse between policies).

create or replace function public.current_user_daycare_id()
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

create or replace function public.current_user_role()
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

create or replace function public.is_admin()
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

create or replace function public.is_parent_of_child(p_child_id uuid)
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

create or replace function public.is_parent_of_room(p_room_id uuid)
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

create or replace function public.is_staff_of_daycare(p_daycare_id uuid)
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

create or replace function public.is_staff_of_room(p_room_id uuid)
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
      and public.is_staff_of_daycare(r.daycare_id)
  )
$$;

create or replace function public.is_staff_of_child(p_child_id uuid)
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
      and public.is_staff_of_room(c.room_id)
  )
$$;

revoke all on function public.current_user_daycare_id() from public;
revoke all on function public.current_user_role() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.is_parent_of_child(uuid) from public;
revoke all on function public.is_parent_of_room(uuid) from public;
revoke all on function public.is_staff_of_daycare(uuid) from public;
revoke all on function public.is_staff_of_room(uuid) from public;
revoke all on function public.is_staff_of_child(uuid) from public;

grant execute on function public.current_user_daycare_id() to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_parent_of_child(uuid) to authenticated;
grant execute on function public.is_parent_of_room(uuid) to authenticated;
grant execute on function public.is_staff_of_daycare(uuid) to authenticated;
grant execute on function public.is_staff_of_room(uuid) to authenticated;
grant execute on function public.is_staff_of_child(uuid) to authenticated;
