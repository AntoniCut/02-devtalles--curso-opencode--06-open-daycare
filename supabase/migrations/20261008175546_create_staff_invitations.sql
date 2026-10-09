-- SPEC 11 — Alta de miembros del equipo (staff y admin) desde la app:
-- tabla `staff_invitations` (invitación de equipo con rol y sala), CHECKs de
-- rol/sala, índices, trigger `updated_at` y RLS (solo admin de su guardería).
-- Reference schema: 07-db-Schema/opendaycare-database-schema.md (extensión del
-- flujo de `invitations` de la tabla 6, sin tocar la invitación de padres).
-- Depends on: SPEC SUPABASE 02 (users, set_updated_at), SPEC SUPABASE 03 (rooms),
-- SPEC 09 (invitation_status).

create table public.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id),
  invited_by uuid not null references public.users(id),
  full_name text not null,
  email text not null,
  role public.user_role not null,
  room_id uuid references public.rooms(id),
  code text not null unique,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_invitations_role_check check (role in ('staff', 'admin')),
  constraint staff_invitations_room_role_check check (
    (role = 'staff' and room_id is not null)
    or (role = 'admin' and room_id is null)
  )
);

create index staff_invitations_daycare_id_idx on public.staff_invitations (daycare_id);
create index staff_invitations_invited_by_idx on public.staff_invitations (invited_by);
create index staff_invitations_room_id_idx on public.staff_invitations (room_id);
create index staff_invitations_email_lower_idx on public.staff_invitations (lower(email));

create trigger set_staff_invitations_updated_at
  before update on public.staff_invitations
  for each row
  execute function public.set_updated_at();

alter table public.staff_invitations enable row level security;

--  -----  policies: solo el admin de la propia guardería gestiona invitaciones  -----
create policy "staff_invitations_select_admin_own_daycare"
  on public.staff_invitations
  for select
  to authenticated
  using (
    private.is_admin()
    and daycare_id = private.current_user_daycare_id()
  );

create policy "staff_invitations_insert_admin_own_daycare"
  on public.staff_invitations
  for insert
  to authenticated
  with check (
    private.is_admin()
    and daycare_id = private.current_user_daycare_id()
    and invited_by = (select auth.uid())
  );

-- DELETE para revertir el insert cuando falla el envío del email (patrón SPEC 09).
create policy "staff_invitations_delete_admin_own_daycare"
  on public.staff_invitations
  for delete
  to authenticated
  using (
    private.is_admin()
    and daycare_id = private.current_user_daycare_id()
  );

--  -----  grants (Data API no expone tablas nuevas automáticamente)  -----
revoke all on public.staff_invitations from anon;

grant select, insert, delete on public.staff_invitations to authenticated;
grant all on public.staff_invitations to service_role;
