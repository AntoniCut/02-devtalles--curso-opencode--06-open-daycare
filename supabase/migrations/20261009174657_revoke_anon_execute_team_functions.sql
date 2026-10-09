-- SPEC 11 — Cierre de grants por defecto sobre las RPCs de equipo.
-- Los default privileges de Supabase otorgan EXECUTE directamente a `anon` y
-- `authenticated` al crear una función; revocar de `public` no alcanza.
-- `accept_team_invitation` y `get_team_members` son solo para usuarios con
-- sesión (mismo fix que `revoke_anon_execute_get_child_parents`).
-- `get_team_invitation_preview` sí queda ejecutable por `anon` (preview pública
-- de /activate, igual que `get_invitation_preview`).

revoke execute on function public.accept_team_invitation(text) from anon;
revoke execute on function public.get_team_members() from anon;
