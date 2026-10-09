-- SPEC 11 — Alta de miembros del equipo (staff y admin) desde la app:
-- funciones del flujo de invitación de equipo.
-- - get_team_invitation_preview(p_code): preview pública para la tarjeta de
--   `/activate` (anon), solo códigos pendientes y no expirados.
-- - accept_team_invitation(p_code): promueve `public.users` (rol, sala y
--   guardería de la invitación) y consume la invitación de forma atómica.
-- - get_team_members(): listado del equipo para el admin (miembros activos +
--   invitaciones pendientes); un no-admin obtiene 0 filas.
-- - handle_new_user(): además de la invitación de padres, resuelve `daycare_id`
--   desde una invitación de equipo pendiente por email. El rol queda `parent`
--   hasta que `accept_team_invitation` lo promueva con el código.
-- Respecto de la SPEC 11, `get_team_members` agrega `expires_at` (el listado
-- muestra el vencimiento de las invitaciones pendientes, como pide el criterio
-- de aceptación y la interfaz `TeamMember`).
-- Depends on: SPEC 11 (staff_invitations), SPEC 09 (invitation_status,
-- accept_invitation, handle_new_user), SPEC SUPABASE 02 (users).

--  -----  preview pública de una invitación de equipo (tarjeta de /activate)  -----
create function public.get_team_invitation_preview(p_code text)
returns table (
  invitation_full_name text,
  invitation_email text,
  role public.user_role,
  room_name text,
  daycare_name text,
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
  select si.full_name, si.email, si.role, r.name, d.name, si.status, si.expires_at, si.accepted_at, si.daycare_id
  from public.staff_invitations si
  join public.daycares d on d.id = si.daycare_id
  left join public.rooms r on r.id = si.room_id
  where si.code = upper(p_code)
    and si.status = 'pending'
    and si.expires_at > now()
    and si.accepted_at is null
  limit 1;
$$;

revoke all on function public.get_team_invitation_preview(text) from public;
grant execute on function public.get_team_invitation_preview(text) to anon, authenticated;

--  -----  activación de equipo: promueve el perfil y consume la invitación  -----
create function public.accept_team_invitation(p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_user_email text;
  v_invitation public.staff_invitations%rowtype;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select u.email into v_user_email
  from auth.users u
  where u.id = v_user_id;

  --  -----  la invitación debe existir, estar pendiente, no expirada y bloquearse  -----
  select si.* into v_invitation
  from public.staff_invitations si
  where si.code = upper(p_code)
    and si.status = 'pending'
    and si.expires_at > now()
    and si.accepted_at is null
  for update;

  --  -----  código inválido/expirado/usado o email de la sesión distinto  -----
  if v_invitation.id is null
     or lower(v_invitation.email) <> lower(coalesce(v_user_email, '')) then
    raise exception 'Invalid or expired invitation';
  end if;

  --  -----  defensa en profundidad: la sala debe ser de la guardería de la invitación  -----
  if v_invitation.room_id is not null
     and not exists (
       select 1
       from public.rooms r
       where r.id = v_invitation.room_id
         and r.daycare_id = v_invitation.daycare_id
     ) then
    raise exception 'Invalid invitation room';
  end if;

  --  -----  promoción del perfil: rol, sala (staff) y guardería  -----
  update public.users
  set role = v_invitation.role,
      room_id = v_invitation.room_id,
      daycare_id = v_invitation.daycare_id
  where id = v_user_id;

  --  -----  consumo de la invitación  -----
  update public.staff_invitations
  set status = 'accepted',
      accepted_at = now()
  where id = v_invitation.id;
end;
$$;

revoke all on function public.accept_team_invitation(text) from public;
grant execute on function public.accept_team_invitation(text) to authenticated;

--  -----  listado del equipo (solo admin de la propia guardería)  -----
create function public.get_team_members()
returns table (
  user_id uuid,
  invitation_id uuid,
  full_name text,
  email text,
  role public.user_role,
  room_name text,
  status text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  with admin_daycare as (
    select u.daycare_id
    from public.users u
    where u.id = (select auth.uid())
      and u.role = 'admin'
  )
  --  -----  miembros activos del equipo (staff/admin) de esa guardería  -----
  select u.id as user_id,
         null::uuid as invitation_id,
         u.full_name as full_name,
         au.email as email,
         u.role as role,
         r.name as room_name,
         'active'::text as status,
         null::timestamptz as expires_at
  from public.users u
  join admin_daycare ad on ad.daycare_id = u.daycare_id
  left join auth.users au on au.id = u.id
  left join public.rooms r on r.id = u.room_id
  where u.role in ('staff', 'admin')
  union all
  --  -----  invitaciones pendientes y no expiradas  -----
  select null::uuid as user_id,
         si.id as invitation_id,
         si.full_name as full_name,
         si.email as email,
         si.role as role,
         r.name as room_name,
         'pending'::text as status,
         si.expires_at as expires_at
  from public.staff_invitations si
  join admin_daycare ad on ad.daycare_id = si.daycare_id
  left join public.rooms r on r.id = si.room_id
  where si.status = 'pending'
    and si.expires_at > now()
    and si.accepted_at is null
  order by status, full_name;
$$;

revoke all on function public.get_team_members() from public;
grant execute on function public.get_team_members() to authenticated;

--  -----  handle_new_user: resuelve la guardería desde una invitación de equipo  -----
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

  -- Self-signups: daycare and name come from a pending parent invitation matching the email.
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

  -- Team self-signups: daycare from a pending staff invitation matching the
  -- email; the role stays 'parent' until accept_team_invitation promotes it.
  if v_daycare_id is null then
    select si.daycare_id, coalesce(v_full_name, si.full_name)
      into v_daycare_id, v_full_name
    from public.staff_invitations si
    where lower(si.email) = lower(new.email)
      and si.status = 'pending'
      and si.expires_at > now()
      and si.accepted_at is null
    order by si.created_at desc
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

revoke execute on function public.handle_new_user() from public, anon, authenticated;
