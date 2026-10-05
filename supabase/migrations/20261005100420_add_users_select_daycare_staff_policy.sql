-- Feeds de familia (change separacion-staff-familia): los miembros de una
-- guardería necesitan leer el perfil (nombre y avatar) del staff que publica.
-- La policy previa solo permitía al staff/admin verse entre sí y al padre su
-- propia fila, así que el embed `author:users(full_name)` del feed de familia
-- llegaba null. Se agrega una policy de lectura acotada al daycare propio:
-- únicamente perfiles staff/admin, nunca otros padres.

create policy "users_select_daycare_staff"
  on public.users
  for select
  to authenticated
  using (
    role in ('staff', 'admin')
    and daycare_id = private.current_user_daycare_id()
  );
