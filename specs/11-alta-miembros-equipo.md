# SPEC 11 — Alta de miembros del equipo (staff y admin) desde la app

> **Estado:** Aprovado
> **Depende de:** SPEC 07, SPEC 09, SPEC 10
> **Fecha:** 2026-10-08
> **Objetivo:** Un admin invita por email a un nuevo miembro del equipo (staff o admin) y la persona activa su cuenta en `/activate` para entrar al panel de guardería con su rol y su sala.

## Scope

**In:**

- Migración `create_staff_invitations`: tabla `staff_invitations` (`daycare_id`, `invited_by`, `full_name`, `email`, `role` staff/admin, `room_id` nullable, `code` UNIQUE, `status`, `expires_at`, `accepted_at`, `created_at`/`updated_at`), CHECKs (rol válido; `staff` exige sala, `admin` sin sala), índices, trigger `updated_at` reutilizando `set_updated_at()` y RLS con policies: SELECT/INSERT/DELETE solo para admin de su propia guardería, INSERT además con `invited_by = auth.uid()`.
- Migración `add_team_invitation_functions`: RPC `get_team_invitation_preview(p_code)` (SECURITY DEFINER, anon+authenticated) para la tarjeta de `/activate`; RPC `accept_team_invitation(p_code)` (SECURITY DEFINER, authenticated) que valida código+email de la sesión, promueve `public.users` (`role`, `room_id`, `daycare_id`) y consume la invitación; RPC `get_team_members()` (SECURITY DEFINER, authenticated, solo admin) que une miembros activos (staff/admin + sala) e invitaciones pendientes; y `handle_new_user` actualizado para resolver `daycare_id` desde una invitación de equipo pendiente por email (el rol queda `parent` hasta `accept_team_invitation`).
- Datos: usuario admin de prueba en producción `admin@opendaycare.com` (Carla Domínguez, `Test1234!`), creado **con aprobación explícita** del usuario y documentado en `references/datos-prueba.md` (hoy no existe ningún admin y sin admin no hay bootstrap posible desde la app).
- `lib/team.ts`: tipos de equipo (`TeamMember`, `TeamRole`), helpers de estado (ACTIVO/PENDIENTE) reutilizando `ROLE_LABELS` de `lib/roles.ts`.
- `/staff/equipo` (`app/staff/equipo/page.tsx`): server component que exige rol admin (staff → `/staff`, parent → `/familia`), carga el equipo vía RPC y las salas de la guardería y pasa todo al cliente.
- `components/team-invite-form.tsx`: listado del equipo (avatar con inicial, nombre, rol · sala, badges ACTIVO/PENDIENTE con vencimiento) + botón "Invitar miembro" que despliega la tarjeta de invitación con Nombre, Email, Rol (Maestra/Administrador) y Sala (obligatoria para Maestra, oculta para Administrador); código de 5 caracteres generado server-side y visible en la tarjeta (patrón `/staff/vincular-padre`); validaciones inline.
- `app/staff/equipo/actions.ts`: Server Action que revalida, inserta la invitación (reintenta si el código choca con UNIQUE) y envía el email con Resend; si el email falla, borra la invitación y muestra error inline; al éxito redirige a `/staff/equipo`.
- Email de equipo (`app/staff/equipo/team-invitation-email.tsx`): mismo lenguaje visual que el de padres, con guardería, rol, sala (si aplica), código grande, "Vence en 7 días" y link `{NEXT_PUBLIC_APP_BASE_URL}/activate?code=<código>`.
- Sidebar: ítem "Equipo" en `components/staff-sidebar.tsx` visible solo para admin (el layout pasa el rol); icono nuevo en `components/nav-icons.tsx`.
- `/activate` unificada: `lookupInvitation` resuelve el código primero en invitaciones de padres y luego en `staff_invitations` (union discriminada `parent`/`team`); la tarjeta del formulario muestra el niño (padre) o la guardería+rol+sala (equipo); `activateAccount` ramifica el consumo (`accept_invitation` o `accept_team_invitation`) y redirige con `homeForRole`; el flujo de padres no cambia de comportamiento (incluido el mensaje "Ese email ya tiene cuenta. Iniciá sesión.").
- Verificación: `supabase_list_migrations`/`supabase_list_tables`/`supabase_get_advisors`; tests de impersonación con rollback; E2E con Playwright (admin invita → código leído de la DB → activación → login del nuevo staff/admin y comprobación de rol/sala; regresión del flujo de padres); `pnpm lint` + `pnpm build`.

**Out of scope (para specs futuros):**

- Cancelar o reenviar invitaciones de equipo, expiración automática por cron y rate limiting.
- Editar o eliminar miembros, cambiar rol/sala de un miembro existente.
- Ver el equipo o invitar desde otros roles (staff no-admin) y desde `/staff/mi-cuenta`.
- Notificaciones (in-app o email) al aceptar una invitación.
- Crear guarderías o invitar a miembros de otra guardería.
- Recuperación/cambio de contraseña, confirmación de email de Supabase.
- Responsive móvil/tablet y modo oscuro.

## Data model

```sql
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
```

Más: índices `staff_invitations_daycare_id_idx`, `staff_invitations_invited_by_idx`, `staff_invitations_room_id_idx`, `staff_invitations_email_lower_idx` (`lower(email)`); trigger `set_staff_invitations_updated_at`; RLS habilitado.

Semántica: invitación `staff` → con `room_id`; `admin` → `room_id` null. `daycare_id` sale del admin que invita.

```sql
-- RPCs (SECURITY DEFINER, search_path = '')
get_team_invitation_preview(p_code text) returns table (
  invitation_full_name text, invitation_email text,
  role public.user_role, room_name text, daycare_name text,
  invitation_status public.invitation_status,
  expires_at timestamptz, accepted_at timestamptz, daycare_id uuid
)

accept_team_invitation(p_code text) returns void
-- valida código pendiente/no expirado + email de la sesión; luego:
-- update public.users set role, room_id, daycare_id where id = auth.uid()
-- update staff_invitations set status='accepted', accepted_at=now()

get_team_members() returns table (
  user_id uuid, invitation_id uuid, full_name text, email text,
  role public.user_role, room_name text, status text -- 'active' | 'pending'
)
```

```ts
// app/(auth)/activate/actions.ts — preview unificada
export type InvitationPreview =
  | { kind: "parent"; childName: string; roomName: string; invitationEmail: string; invitationFullName: string }
  | { kind: "team"; daycareName: string; role: "staff" | "admin"; roomName: string | null; invitationEmail: string; invitationFullName: string };

// lib/team.ts
export interface TeamMember {
  userId: string | null;
  invitationId: string | null;
  fullName: string;
  email: string;
  role: "staff" | "admin";
  roomName: string | null;
  status: "active" | "pending";
  expiresAt: string | null;
}
```

Convenciones: código de 5 caracteres de `lib/invitation-code.ts`, vence en 7 días; fechas del listado en TZ America/Argentina/Buenos_Aires; etiquetas "Maestra"/"Administrador" de `lib/roles.ts`.

## Implementation plan

1. Cargar skills `supabase` + `supabase-postgres-best-practices`; crear migración `create_staff_invitations` (tabla, CHECKs, índices, trigger, RLS) con el patrón CLI; aplicarla al remoto con `supabase_apply_migration` **previa aprobación explícita** (producción); verificar con `supabase_list_migrations`, `supabase_list_tables` y `supabase_get_advisors`.
2. Migración `add_team_invitation_functions`: `get_team_invitation_preview`, `accept_team_invitation` (con validación sala↔guardería), `get_team_members` y `handle_new_user` actualizado; aplicar con aprobación; tests de impersonación con rollback.
3. `lib/team.ts` + icono `teamIcon` en `components/nav-icons.tsx`.
4. Sidebar/layout: ítem "Equipo" solo para admin (`StaffSidebarUser` recibe el rol); pasar el perfil desde `app/staff/layout.tsx`.
5. `app/staff/equipo/page.tsx`: guard de admin, `get_team_members`, salas de la guardería y código provisional server-side.
6. `components/team-invite-form.tsx`: listado + tarjeta de invitación con validaciones (nombre/email/rol/sala) y errores inline.
7. `app/staff/equipo/team-invitation-email.tsx` + `app/staff/equipo/actions.ts`: insert con reintento de código, envío con Resend, rollback si falla y redirect a `/staff/equipo`.
8. `/activate` unificada: extender `lookupInvitation`, la tarjeta de `activate-form.tsx` y `activateAccount` (rama equipo); copy neutral del subtítulo cuando no hay preview.
9. Datos de prueba: crear `admin@opendaycare.com` en producción **con aprobación explícita** y documentarlo en `references/datos-prueba.md`.
10. Verificación E2E con Playwright + `pnpm lint` + `pnpm build` + limpieza de artefactos de prueba (con aprobación).

## Acceptance criteria

- [ ] `supabase_list_tables` muestra `staff_invitations` con columnas, CHECKs e índices; `supabase_list_migrations` incluye ambas migraciones y `supabase_get_advisors` no reporta avisos nuevos.
- [ ] RLS habilitado: un admin de la guardería puede SELECT/INSERT/DELETE `staff_invitations` (INSERT solo con `invited_by = auth.uid()` y su `daycare_id`); staff, padre y anon no pueden (tests de impersonación con rollback).
- [ ] El CHECK impide `staff` sin sala y `admin` con sala.
- [ ] `get_team_invitation_preview` devuelve la invitación solo si el código exacto existe, está `pending`, no expirado y sin `accepted_at`; anon puede ejecutarla y no expone invitaciones aceptadas.
- [ ] `accept_team_invitation` promueve `public.users` a rol/sala/guardería de la invitación y marca `accepted` con `accepted_at`; código inválido, expirado, usado o email de sesión distinto → excepción y ningún cambio (impersonación con rollback).
- [ ] `handle_new_user` resuelve `daycare_id` desde `staff_invitations` por email cuando no hay `app_metadata` ni invitación de padre; el perfil se crea con rol `parent` hasta que `accept_team_invitation` lo promueve.
- [ ] `get_team_members` devuelve solo el equipo (staff/admin activos + invitaciones pendientes no expiradas) de la guardería del admin; un no-admin obtiene 0 filas.
- [ ] `/staff/equipo` es accesible solo para admin; un staff es redirigido a `/staff` y un padre a `/familia`; el ítem "Equipo" del sidebar solo aparece para admin.
- [ ] El listado muestra miembros activos (nombre, rol, sala) e invitaciones pendientes (badge PENDIENTE + vencimiento).
- [ ] El formulario valida nombre, email, rol y sala (obligatoria para Maestra; Administrador sin sala) con errores inline y no envía nada inválido.
- [ ] Enviar una invitación válida inserta la fila (`daycare_id` del admin, `invited_by = auth.uid()`, `status pending`, `expires_at` +7 días) y envía el email de Resend con código, rol y link a `/activate?code=`.
- [ ] Si el envío falla, no queda fila en `staff_invitations` y se muestra error inline.
- [ ] `/activate?code=<código de equipo>` muestra la tarjeta de equipo (guardería, rol, sala) y el email prellenado; la tarjeta de padres no cambia.
- [ ] Activar con código+email válidos y contraseña crea la cuenta (`auth.users`), el perfil `public.users` con rol `staff`/`admin`, sala y guardería correctas, marca la invitación `accepted` y redirige a `/staff`.
- [ ] Código inexistente/expirado/usado o email no coincidente → error inline unificado y no se crea ninguna cuenta; email ya registrado → "Ese email ya tiene cuenta. Iniciá sesión."
- [ ] El flujo de activación de padres sigue funcionando igual (regresión E2E).
- [ ] `admin@opendaycare.com` existe en producción (creado con aprobación explícita) y está documentado en `references/datos-prueba.md`.
- [ ] `pnpm lint` y `pnpm build` sin errores; consola sin errores ni warnings de hidratación.

## Decisions

- **Sí:** solo admin invita y ve `/staff/equipo` (decisión del usuario) — evita que un staff se autoescale creando un admin; RLS acotada a admin de la guardería.
- **Sí:** tabla nueva `staff_invitations` (decisión del usuario) — no toca `invitations` ni el flujo de padres ya auditado; namespace propio de códigos.
- **Sí:** código + email + `/activate` reutilizada (decisiones del usuario) — un solo punto de activación con resolución unificada del código.
- **Sí:** el rol se promueve solo en `accept_team_invitation` (código + email de la sesión); `handle_new_user` solo resuelve guardería y crea el perfil con el rol menos privilegiado — con "Confirm email" desactivado, un `signUp` con el email invitado pero sin el código no obtiene privilegios de guardería.
- **Sí:** sala obligatoria para `staff` (decisión del usuario) — sin sala, `is_staff_of_child` no le daría acceso a ningún niño; `admin` sin sala.
- **Sí:** listado de equipo vía RPC `get_team_members` SECURITY DEFINER — los emails viven en `auth.users` y la RLS de `users` no los expone.
- **Sí:** código generado server-side y visible en la tarjeta antes de enviar (patrón `/staff/vincular-padre`), con reintento ante choque UNIQUE.
- **Sí:** email de equipo con link directo a `/activate?code=` (el de padres queda igual).
- **Sí:** el subtítulo de `/activate` pasa a uno neutral cuando no hay tarjeta cargada — desviación de copy del mockup de padres, intencional para no decir "tu hijo" a un miembro del equipo.
- **Sí:** el listado incluye invitaciones pendientes con badge PENDIENTE (patrón del perfil del niño).
- **Sí:** admin de prueba en producción con aprobación explícita (decisión del usuario) — sin admin no hay bootstrap posible desde la app.
- **No:** cancelar/reenviar invitaciones, cron de expiración, rate limiting — specs futuras.
- **No:** `service_role` en la app (arquitectura vigente) — la cuenta se crea con `signUp` + RPC como en padres.
- **No:** editar/eliminar miembros ni cambiar rol/sala después del alta.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `signUp` con email no verificado puede reclamar el email invitado (Confirm email desactivado) | El rol no se otorga hasta `accept_team_invitation` (código); la invitación queda pendiente; mismo modelo que padres, documentado. |
| Cambio en `handle_new_user` afecta a todos los signups | Regresión E2E del flujo de padres + tests de impersonación; la rama nueva solo corre si no hay `app_metadata` ni invitación de padre. |
| Colisión de código entre `invitations` y `staff_invitations` | Resolución determinista (padres primero) y reintento de UNIQUE; probabilidad ~1/33M, aceptada y documentada. |
| `onboarding@resend.dev` solo envía al email de la cuenta Resend | E2E usa el email de esa cuenta (patrón SPEC 09); `RESEND_FROM_EMAIL` permite dominio verificado. |
| Escrituras en producción (migraciones, admin de prueba, limpieza E2E) | Cada escritura se aplica solo con aprobación explícita del usuario en el momento; la spec las lista. |
| `get_team_members` expone emails del equipo | Solo admin de la propia guardería; función SECURITY DEFINER con guard interno. |
| Sala elegida de otra guardería al invitar | Validación en el Server Action y en `accept_team_invitation` (join `rooms` ↔ `daycare_id`). |
| Next 16 / React 19 difieren de los datos de entrenamiento | Leer `node_modules/next/dist/docs/` antes de escribir código (AGENTS.md) y Context7. |

## What is **not** in this spec

- Cancelar/reenviar invitaciones, expiración automática y rate limiting.
- Editar/eliminar miembros, cambiar rol o sala de un miembro existente.
- Equipo visible para staff no-admin y `/staff/mi-cuenta`.
- Notificaciones al aceptar, crear guarderías o invitar entre guarderías.
- Recuperación/cambio de contraseña y confirmación de email de Supabase.
- Responsive móvil/tablet y modo oscuro.

Cada uno de esos, si aterriza, va en su propio spec.
