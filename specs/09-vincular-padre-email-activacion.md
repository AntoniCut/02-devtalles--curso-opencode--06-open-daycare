# SPEC 09 — Vincular padre: invitación con email (Resend) y activación de cuenta

> **Estado:** Aprobado
> **Depende de:** SPEC 05, SPEC 07, SPEC 08, SPEC SUPABASE 02, SPEC SUPABASE 04
> **Fecha:** 2026-09-14
> **Objetivo:** Convertir `/vincular-padre` en dinámica persistiendo invitaciones en la tabla `invitations` y enviándolas por email con Resend desde Next.js, y que `/activate` registre al padre con el código creando su cuenta, su perfil en `users` (rol `parent`) y el vínculo en `parent_children`.

## Scope

**In:**

- Migración única con: enums `relationship_type` (`father`/`mother`/`guardian`) e `invitation_status` (`pending`/`accepted`/`expired`/`cancelled`); tabla `invitations` (tabla 6 del esquema de referencia: `child_id`, `invited_by`, `full_name`, `email`, `relationship`, `code` UNIQUE, `status`, `expires_at`, `accepted_at` + `created_at`/`updated_at`); tabla `parent_children` (tabla 5: `parent_id` FK→`users`, `child_id` FK→`children`, `relationship`, UNIQUE compuesto) + índices de FKs, trigger `updated_at` reutilizando `set_updated_at()` y RLS con policies mínimas.
- Policies RLS: anon SELECT en `invitations` (necesario para validar el código en `/activate` sin sesión), authenticated SELECT/UPDATE en `invitations`, authenticated SELECT/INSERT en `parent_children`.
- Paquete `resend` instalado con pnpm; envío del email del lado de Next.js (Server Action) con `RESEND_API_KEY` en `.env` y remitente `onboarding@resend.dev` (prueba) configurable por variable de entorno.
- `/vincular-padre` dinámica (`app/vincular-padre/page.tsx`): lee `?kid=<id>`, carga el niño real de la DB, header "a {nombre real}", botón X → `/kids/[slug]` del niño; sin `?kid=` válido → redirect a `/kids`.
- Código de invitación real generado server-side: 5 caracteres del alfabeto sin ambiguas (sin 0/O/1/I), estilo visual del mockup intacto (Fredoka 600 34px, tracking 7px), texto "Vence en 7 días" acorde.
- Server Action `app/vincular-padre/actions.ts`: valida requeridos, inserta en `invitations` (`status: pending`, `expires_at` = +7 días, `invited_by` = usuario autenticado vía `getAuthenticatedUser()` de SPEC 07) y envía el email con Resend (template inline: código grande, nombre del niño, guardería, vencimiento). Éxito → redirect a `/kids/[slug]`. Mapeo pills: Mamá→`mother`, Papá→`father`, Tutor/a→`guardian`.
- `/activate` (`app/(auth)/activate/page.tsx`) convertida a Client Component con estilo idéntico al mockup; Server Action de activación que: valida código (existe, `pending`, no expirado) **y coincidencia de email**, hace `signUp` con `options.data` (`daycare_id`, `role: 'parent'`, `full_name`) para que el trigger `handle_new_user` (SPEC SUPABASE 02) cree el perfil, inserta en `parent_children` y marca la invitación `accepted` con `accepted_at`; al éxito → `redirect("/")` (temporal hasta que exista `/parent-feed`).
- Errores inline en `/activate`: código inexistente/expirado/usado o email no coincidente → "Código de invitación inválido o expirado" bajo el campo; contraseña requerida.
- Paso previo de configuración: verificar que "Confirm email" esté desactivado en Supabase Auth (decisión del usuario: la cuenta se crea directamente; el código de invitación actúa como verificación) para que `signUp` devuelva sesión.
- Verificación: migración con `supabase_list_tables`/`supabase_list_migrations`/`supabase_get_advisors`; flujo end-to-end con Playwright (invitar → email recibido → activar → filas en `parent_children` e invitación `accepted`); `pnpm lint` + `pnpm build`.

**Out of scope (para specs futuros):**

- Feed del padre `/parent-feed` (tras activar se redirige temporalmente a `/`).
- Login del padre recién creado (su cuenta queda lista para usar en `/login`).
- Reenvío, revoque o listado de invitaciones; expiración automática por cron (el estado `expired` se evalúa por `expires_at` al validar).
- Policies multi-tenant finas (por `daycare_id`).
- Responsive móvil/tablet y modo oscuro.

## Data model

```sql
do $$ begin
  create type public.relationship_type as enum ('father', 'mother', 'guardian');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');
exception when duplicate_object then null; end $$;

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id),
  invited_by uuid not null references public.users(id),
  full_name text not null,
  email text not null,
  relationship public.relationship_type not null,
  code text not null unique,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.parent_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users(id),
  child_id uuid not null references public.children(id),
  relationship public.relationship_type not null,
  created_at timestamptz not null default now(),
  unique (parent_id, child_id)
);
```

Más: RLS habilitado en ambas, policies citadas en Scope, índices `invitations_child_id_idx`, `invitations_invited_by_idx`, `parent_children_parent_id_idx`, `parent_children_child_id_idx`, y triggers `set_*_updated_at` en `invitations`.

```ts
// app/vincular-padre/actions.ts (Server Action)
type SendInvitationResult = { error: string } | undefined;
// code: 5 chars de "23456789ABCDEFGHJKMNPQRSTUVWXYZ" (sin 0/O/1/I), crypto.randomInt
// relationship: "Mamá" -> "mother" | "Papá" -> "father" | "Tutor/a" -> "guardian"
```

Variables de entorno (`.env`, ya esbozadas en `.env.example`): `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (default `onboarding@resend.dev`).

## Implementation plan

1. Cargar skills `supabase` + `supabase-postgres-best-practices`; crear migración (patrón CLI `supabase migration new`) con enums, tablas, RLS + policies, índices y triggers; aplicar con `supabase_apply_migration`; verificar con `supabase_list_tables`, `supabase_list_migrations` y `supabase_get_advisors`.
2. Verificar en Supabase Auth que "Confirm email" está desactivado; instalar `resend` (`pnpm add resend`); añadir `RESEND_API_KEY` / `RESEND_FROM_EMAIL` a `.env` y `.env.example`.
3. `app/vincular-padre/page.tsx` dinámica: leer `searchParams`, cargar niño real (join children+rooms), header "a {nombre}", X → `/kids/[slug]`, código generado server-side en la tarjeta (estilo mockup intacto); sin niño válido → redirect a `/kids`.
4. `app/vincular-padre/actions.ts`: Server Action que genera código, inserta invitación y envía email con Resend; `components/link-parent-form.tsx` pasa a usar la action con estado loading/error inline y redirect a `/kids/[slug]` al éxito.
5. `app/(auth)/activate/activate-form.tsx` (Client Component) + `actions.ts`: Server Action que valida código+email, hace `signUp` con metadata, inserta `parent_children`, marca `accepted` y redirige a `/`; la página server queda como wrapper con el estilo del mockup intacto y errores inline.
6. Verificación end-to-end con Playwright (invitar a un email real → recibir el email → activar con el código → comprobar filas en `parent_children` e `invitations.accepted`) + `pnpm lint` + `pnpm build`.

## Acceptance criteria

- [x] `supabase_list_tables` muestra `invitations` y `parent_children` con las columnas del esquema; los enums `relationship_type` e `invitation_status` existen.
- [x] `invitations` y `parent_children` tienen RLS habilitado; anon puede hacer SELECT en `invitations` (y no INSERT/UPDATE); authenticated puede SELECT/UPDATE `invitations` y SELECT/INSERT `parent_children`; anon no puede tocar `parent_children`.
- [x] `supabase_list_migrations` incluye la migración y `supabase_get_advisors` no reporta avisos nuevos.
- [x] `/vincular-padre?kid=<uuid>` muestra el nombre real del niño en el subtítulo y el botón X lleva a su perfil `/kids/[slug]`.
- [x] `/vincular-padre` sin `?kid=` o con id inexistente redirige a `/kids`.
- [x] La tarjeta muestra un código real de 5 caracteres (estilo del mockup intacto) y "Vence en 7 días".
- [x] Enviar el formulario válido inserta una fila en `invitations` (`status: pending`, `expires_at` = +7 días, `invited_by` = usuario autenticado) y redirige a `/kids/[slug]`.
- [x] El envío dispara un email de Resend al destinatario con el código, el nombre del niño y el vencimiento.
- [x] Submit vacío o email inválido mantiene los errores de SPEC 05 ("Campo requerido" / "Email inválido") y no inserta ni envía nada.
- [x] Un fallo del insert o del envío muestra error inline sin perder el estilo y sin navegar.
- [x] `/activate` con código+email válidos y contraseña crea la cuenta en `auth.users`, el perfil en `public.users` (rol `parent`, `daycare_id` del niño vía metadata) y redirige a `/`.
- [x] Tras activar existen: fila en `parent_children` (parent_id, child_id, relationship correcto) y la invitación pasa a `accepted` con `accepted_at`.
- [x] Código inexistente, expirado, ya usado, o email que no coincide → error inline "Código de invitación inválido o expirado" y no se crea ninguna cuenta.
- [x] Contraseña vacía → error inline y no se crea la cuenta.
- [x] El estilo de `/activate` es idéntico al mockup (tarjeta, inputs, checkbox, CTA).
- [x] `pnpm lint` y `pnpm build` sin errores; consola sin errores ni warnings de hidratación.
- [x] (Addendum) El perfil del niño muestra padres vinculados (badge ACTIVA) e invitaciones pendientes (badge PENDIENTE, "invitación enviada"); la lista `/kids` muestra "N padres vinculados" / "sin padres vinculados" según datos reales.
- [x] (Addendum) El botón "Vincular otro padre" del perfil lleva a `/vincular-padre?kid=<id>` del niño.

## Decisions

- **Sí:** un solo spec para todo el flujo (decisión del usuario) — invitación + email + activación, aunque toca dos pantallas y dos tablas.
- **Sí:** `/vincular-padre` dinámica con `?kid=<id>` (decisión del usuario) — la invitación necesita saber a qué niño vincular; sustituye la decisión estática de SPEC 05.
- **Sí:** `invited_by` = usuario autenticado vía `getAuthenticatedUser()` (SPEC 07).
- **Sí:** email enviado desde Next.js con el paquete `resend` en una Server Action (decisión del usuario), no desde Edge Functions ni triggers de DB.
- **Sí:** remitente de prueba `onboarding@resend.dev` con `RESEND_FROM_EMAIL` en env para cambiar a dominio verificado sin tocar código.
- **Sí:** cuenta creada directamente sin confirmación de email de Supabase (decisión del usuario) — el código de invitación actúa como verificación.
- **Sí:** email del formulario de activación debe coincidir con `invitations.email` (recomendación aceptada) — evita registrar la invitación con un email ajeno.
- **Sí:** código de 5 caracteres alfanuméricos sin ambiguos (0/O/1/I), generado con `crypto`, vence en 7 días, `status: pending`.
- **Sí:** anon SELECT en `invitations` — el visitante de `/activate` no tiene sesión aún; se mitiga con código corto + expiración.
- **Sí:** tras activar → `/` temporal (recomendación aceptada) hasta que exista `/parent-feed`.
- **No:** cron de expiración de invitaciones — el estado `expired` se evalúa comparando `expires_at` al validar; automatizarlo es otro spec.
- **No:** normalizar `relationship` en tablas propias — el enum `relationship_type` del esquema de referencia cubre el caso.

## Addendum — Cambios surgidos durante la implementación

Los 16 criterios originales se verificaron con el agente verificador (16/16). Durante la implementación surgieron las siguientes piezas necesarias, no previstas en el plan original, aplicadas y verificadas sobre la misma rama:

1. **Migración `add_invitations_insert_delete_policies`** — el spec solo listaba SELECT/UPDATE en `invitations`; sin policy INSERT el staff no puede crear invitaciones y sin DELETE no se puede revertir el insert cuando Resend falla. Se añaden ambas.
2. **Dependencia `@react-email/render`** — `resend` v6 exige el paquete para renderizar el template React (`react:` prop); sin él el envío lanza error 500.
3. **Función `get_invitation_preview(p_code)`** (migraciones `create_get_invitation_preview` + `add_daycare_id_to_invitation_preview`) — SECURITY DEFINER para mostrar la tarjeta real de la invitación en `/activate` sin sesión (RLS de `children` bloquea al anon); devuelve también `daycare_id` para la metadata del `signUp`. Solo expone nombres si el código exacto coincide con una invitación pendiente no expirada.
4. **Fix del botón "Vincular otro padre"** — el link del perfil (`app/kids/[slug]/page.tsx`) apuntaba a `/vincular-padre` sin `?kid=` y la página dinámica rebotaba a `/kids`; ahora lleva `?kid=<id>` y el modelo `Kid` incorpora `id` (opcional para no tocar el mock de SPEC 06).
5. **Función `get_child_parents()` + UI de padres vinculados/pendientes** — el perfil mostraba siempre "sin padres vinculados" (SPEC 08 dejaba `parents: []` fijo). Nueva función SECURITY DEFINER que une vínculos activos (`parent_children`+`users`) e invitaciones `pending` no expiradas, y `lib/kids.ts` (`parentsForChild()`) los pinta en el perfil (badges ACTIVA/PENDIENTE) y en la lista (`N padres vinculados`). Solicitado explícitamente por el usuario (comportamiento del curso); solo expone nombres y granted a `authenticated`.

Nota de limpieza: los artefactos de prueba (usuario `verif.spec09@example.com`, invitaciones `4HD5M`/`SPEC9`/`974YS`) se eliminaron tras la verificación.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `onboarding@resend.dev` solo envía al email de la cuenta Resend | Documentado; en pruebas se usa el email de esa cuenta; `RESEND_FROM_EMAIL` permite cambiar a dominio verificado. |
| "Confirm email" activo haría que `signUp` no devuelva sesión y rompería el flujo | Verificación del ajuste en el paso 2 antes de implementar la activación. |
| Anon SELECT en `invitations` permite sondear códigos/emails | Código corto sin ambiguos + expiración 7 días; el sondeo masivo queda fuera de alcance (rate limit en spec futuro). |
| `signUp` con metadata ya usado por staff (SPEC 07) — colisión del trigger | El trigger `handle_new_user` ya existe y es genérico; solo se añade `role: 'parent'` en `options.data`. |
| Race: dos staff generan el mismo código | `code` UNIQUE; en colisión se regenera antes de insertar. |

## What is **not** in this spec

- Feed del padre `/parent-feed`, login del padre recién creado.
- Reenvío/revoque de invitaciones, expiración automática por cron y rate limiting de activación.
- Policies multi-tenant finas (por `daycare_id`).
- Responsive móvil/tablet y modo oscuro.

Cada uno de esos, si aterriza, va en su propio spec. (La visualización de padres vinculados/invitaciones pendientes, marcada aquí como out-of-scope al inicio, se implementó como addendum por solicitud del usuario — ver sección Addendum.)
