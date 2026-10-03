-- Security audit fix (2026-10-02) — harden SECURITY DEFINER functions.
-- - accept_invitation: atomic activation (validates code + email, links the
--   parent and consumes the invitation) so the app no longer needs anon SELECT
--   on invitations nor authenticated INSERT on parent_children.
-- - handle_new_user: stops trusting user-editable metadata for role/daycare.
-- - get_invitation_preview: also returns the invited parent's name (display).
-- - get_child_parents: scoped to the caller (staff -> own daycare,
--   parent -> own children, admin -> all).
-- - Revokes execute on trigger functions exposed through PostgREST.

create or replace function public.accept_invitation(p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_user_email text;
  v_invitation public.invitations%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select u.email into v_user_email
  from auth.users u
  where u.id = v_user_id;

  select i.* into v_invitation
  from public.invitations i
  where i.code = upper(p_code)
    and i.status = 'pending'
    and i.expires_at > now()
    and i.accepted_at is null
  for update;

  if v_invitation.id is null
     or lower(v_invitation.email) <> lower(coalesce(v_user_email, '')) then
    raise exception 'Invalid or expired invitation';
  end if;

  insert into public.parent_children (parent_id, child_id, relationship)
  values (v_user_id, v_invitation.child_id, v_invitation.relationship)
  on conflict (parent_id, child_id) do nothing;

  update public.invitations
  set status = 'accepted',
      accepted_at = now()
  where id = v_invitation.id;
end;
$$;

revoke all on function public.accept_invitation(text) from public;
grant execute on function public.accept_invitation(text) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_daycare_id uuid;
  v_role public.user_role;
  v_full_name text;
begin
  -- app_metadata is only writable with the service role (admin-created staff).
  v_role := coalesce((new.raw_app_meta_data ->> 'role')::public.user_role, 'parent');
  v_daycare_id := (new.raw_app_meta_data ->> 'daycare_id')::uuid;
  v_full_name := new.raw_app_meta_data ->> 'full_name';

  -- Self-signups: daycare and name come from a pending invitation matching the email.
  if v_daycare_id is null then
    select r.daycare_id, coalesce(v_full_name, i.full_name)
      into v_daycare_id, v_full_name
    from public.invitations i
    join public.children c on c.id = i.child_id
    join public.rooms r on r.id = c.room_id
    where lower(i.email) = lower(new.email)
      and i.status = 'pending'
      and i.expires_at > now()
      and i.accepted_at is null
    order by i.created_at desc
    limit 1;
  end if;

  if v_full_name is null then
    v_full_name := coalesce(new.raw_user_meta_data ->> 'full_name', new.email, 'Usuario');
  end if;

  if v_daycare_id is null then
    raise exception 'No daycare could be resolved for new user';
  end if;

  insert into public.users (id, daycare_id, role, full_name)
  values (new.id, v_daycare_id, v_role, v_full_name);
  return new;
end;
$$;

drop function if exists public.get_invitation_preview(text);

create function public.get_invitation_preview(p_code text)
returns table (
  child_name text,
  room_name text,
  invitation_email text,
  invitation_full_name text,
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
  select c.full_name, r.name, i.email, i.full_name, i.status, i.expires_at, i.accepted_at, r.daycare_id
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
    where public.is_admin()
      or public.is_staff_of_child(c.id)
      or public.is_parent_of_child(c.id)
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

revoke all on function public.get_child_parents() from public;
grant execute on function public.get_child_parents() to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

do $$ begin
  revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
exception
  when undefined_function then null;
end $$;
