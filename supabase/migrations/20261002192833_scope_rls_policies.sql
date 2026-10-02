-- Security audit fix (2026-10-02) — scoped RLS policies.
-- Replaces the `using (true)` policies with the project access model:
-- staff -> own daycare, parent -> own children, admin -> everything.
-- Anon access to invitations goes through get_invitation_preview and the
-- activation through accept_invitation (SECURITY DEFINER).

drop policy if exists "children_select_authenticated" on public.children;
drop policy if exists "children_insert_authenticated" on public.children;
drop policy if exists "rooms_select_authenticated" on public.rooms;
drop policy if exists "invitations_select_anon" on public.invitations;
drop policy if exists "invitations_select_authenticated" on public.invitations;
drop policy if exists "invitations_insert_authenticated" on public.invitations;
drop policy if exists "invitations_update_authenticated" on public.invitations;
drop policy if exists "invitations_delete_authenticated" on public.invitations;
drop policy if exists "parent_children_select_authenticated" on public.parent_children;
drop policy if exists "parent_children_insert_authenticated" on public.parent_children;

create policy "daycares_select_own"
  on public.daycares
  for select
  to authenticated
  using (
    public.is_admin()
    or id = public.current_user_daycare_id()
  );

create policy "users_select_self_or_admin"
  on public.users
  for select
  to authenticated
  using (
    id = (select auth.uid())
    or public.is_admin()
  );

create policy "rooms_select_scoped"
  on public.rooms
  for select
  to authenticated
  using (
    public.is_admin()
    or public.is_staff_of_room(id)
    or public.is_parent_of_room(id)
  );

create policy "children_select_scoped"
  on public.children
  for select
  to authenticated
  using (
    public.is_admin()
    or public.is_staff_of_child(id)
    or public.is_parent_of_child(id)
  );

create policy "children_insert_staff_own_daycare"
  on public.children
  for insert
  to authenticated
  with check (
    public.is_admin()
    or public.is_staff_of_room(room_id)
  );

create policy "invitations_select_staff_own_daycare"
  on public.invitations
  for select
  to authenticated
  using (
    public.is_admin()
    or public.is_staff_of_child(child_id)
  );

create policy "invitations_insert_staff_own_daycare"
  on public.invitations
  for insert
  to authenticated
  with check (
    public.is_admin()
    or (
      public.is_staff_of_child(child_id)
      and invited_by = (select auth.uid())
    )
  );

create policy "invitations_delete_staff_own_daycare"
  on public.invitations
  for delete
  to authenticated
  using (
    public.is_admin()
    or public.is_staff_of_child(child_id)
  );

create policy "parent_children_select_scoped"
  on public.parent_children
  for select
  to authenticated
  using (
    public.is_admin()
    or parent_id = (select auth.uid())
    or public.is_staff_of_child(child_id)
  );
