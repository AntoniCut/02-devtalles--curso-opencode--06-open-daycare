-- SPEC 09 (fix) — Missing INSERT/DELETE policies on `invitations`.
-- The staff Server Action inserts invitations (and reverts them if the email
-- fails), but the original migration only granted SELECT/UPDATE.

create policy "invitations_insert_authenticated"
  on public.invitations
  for insert
  to authenticated
  with check (true);

create policy "invitations_delete_authenticated"
  on public.invitations
  for delete
  to authenticated
  using (true);
