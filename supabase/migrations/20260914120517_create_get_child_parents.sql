-- SPEC 09 (UI follow-up) — Child-parent links + pending invitations for the UI.
-- The `users` table has RLS with no policies, so PostgREST cannot embed it from
-- `parent_children` for authenticated clients. This SECURITY DEFINER function
-- exposes only display names: active links (parent_children + users) and
-- pending, unexpired, unaccepted invitations, each marked with its status.
-- Execution is granted to authenticated only (staff/parent app users).

create function public.get_child_parents()
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
  select pc.child_id, u.full_name, pc.relationship, 'active'::text
  from public.parent_children pc
  join public.users u on u.id = pc.parent_id
  union all
  select i.child_id, i.full_name, i.relationship, 'pending'::text
  from public.invitations i
  where i.status = 'pending'
    and i.expires_at > now()
    and i.accepted_at is null
$$;

revoke all on function public.get_child_parents() from public;

grant execute on function public.get_child_parents() to authenticated;
