-- RLS policies for children and rooms (SPEC 08)
-- Staff users (authenticated) can read children and rooms, and insert new children.
-- Scope limited to SELECT + INSERT on children and SELECT on rooms for this spec.

create policy "children_select_authenticated"
  on public.children
  for select
  to authenticated
  using (true);

create policy "children_insert_authenticated"
  on public.children
  for insert
  to authenticated
  with check (true);

create policy "rooms_select_authenticated"
  on public.rooms
  for select
  to authenticated
  using (true);
