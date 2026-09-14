-- SPEC 09 — `get_invitation_preview` now also returns the child's `daycare_id`,
-- required as signup metadata for the handle_new_user trigger (SPEC SUPABASE 02).

drop function if exists public.get_invitation_preview(text);

create function public.get_invitation_preview(p_code text)
returns table (
  child_name text,
  room_name text,
  invitation_email text,
  invitation_status public.invitation_status,
  expires_at timestamptz,
  accepted_at timestamptz,
  daycare_id uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select c.full_name, r.name, i.email, i.status, i.expires_at, i.accepted_at, r.daycare_id
  from public.invitations i
  join public.children c on c.id = i.child_id
  join public.rooms r on r.id = c.room_id
  where i.code = upper(p_code)
    and i.status = 'pending'
    and i.expires_at > now()
    and i.accepted_at is null
  limit 1;
$$;

revoke all on function public.get_invitation_preview(text) from public;

grant execute on function public.get_invitation_preview(text) to anon, authenticated;
