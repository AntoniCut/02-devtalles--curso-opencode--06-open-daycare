-- Security audit fix (2026-10-02) — make the children SELECT policy
-- RETURNING-safe: staff visibility is checked through the room, so
-- INSERT ... RETURNING (used by supabase-js .insert().select()) also passes
-- for the newly inserted row.

drop policy if exists "children_select_scoped" on public.children;
create policy "children_select_scoped"
  on public.children
  for select
  to authenticated
  using (
    private.is_admin()
    or private.is_staff_of_room(room_id)
    or private.is_parent_of_child(id)
  );
