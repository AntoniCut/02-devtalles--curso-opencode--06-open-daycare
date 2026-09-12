# SPEC SUPABASE 02 — Crear tabla `users` + enums + usuario staff de prueba

> **Estado:** Aprovado
> **Depende de:** SPEC SUPABASE 01
> **Fecha:** 2026-09-12
> **Objetivo:** Crear los enums `user_role` y `user_status`, la tabla `public.users` vinculada a `auth.users` con RLS y trigger `updated_at`, el trigger `AFTER INSERT` en `auth.users` que genera el perfil automáticamente, y un usuario staff de prueba con auth real para poder probar el flujo end-to-end.

## Scope

**In:**

- Migración `supabase/migrations/YYYYMMDDHHMMSS_create_users.sql` (patrón CLI de Supabase) con:
  - Enums `user_role` (`staff`, `parent`, `admin`) y `user_status` (`pending`, `active`) — solo los que la tabla `users` necesita.
  - DDL de `public.users` según el esquema de referencia (07-db-Schema, tabla 2): FK → `auth.users(id)` ON DELETE CASCADE, FK → `daycares`, RLS habilitado, trigger `updated_at` reutilizando `public.set_updated_at()` (SPEC SUPABASE 01).
  - Función `public.handle_new_user()` (`SECURITY DEFINER`) + trigger `on_auth_user_created` (`AFTER INSERT` en `auth.users`) que crea la fila de perfil desde `raw_user_meta_data` (`daycare_id`, `role`, `full_name`).
- Usuario staff de prueba creado vía `supabase_execute_sql` (datos de auth no viven en migraciones versionadas): email `staff@opendaycare.com`, nombre **Antonio Cutillas**, contraseña `Test1234!` (hash bcrypt con `extensions.crypt`), email confirmado, insert en `auth.users` **y** `auth.identities`, con `raw_user_meta_data` apuntando al daycare "Guardería Sala Soles" y `role: staff`. El trigger genera el perfil automáticamente.
- Verificación: `supabase_list_tables`, `supabase_list_migrations`, `supabase_get_advisors`, SELECT del perfil creado por el trigger y prueba de login/contraseña vía SQL (comparación del hash).

**Out of scope (para specs futuros):**

- Policies de RLS (llegan junto con el modelo de auth, igual que quedó `daycares`).
- Resto de enums (`relationship_type`, `invitation_status`, `post_type`, `child_status`) y tablas (`rooms`, `children`, `posts`, etc.).
- Integración con `@supabase/ssr` en Next.js, signup/login desde la UI.

## Data model

```sql
create type public.user_role as enum ('staff', 'parent', 'admin');
create type public.user_status as enum ('pending', 'active');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  daycare_id uuid not null references public.daycares(id),
  role public.user_role not null,
  status public.user_status not null default 'active',
  full_name text not null,
  avatar_url text,
  notify_on_post boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

create trigger set_users_updated_at
  before update on public.users
  for each row
  execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, daycare_id, role, full_name)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'daycare_id')::uuid,
    (new.raw_user_meta_data ->> 'role')::public.user_role,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
```

Convención del esquema de referencia: PK `id uuid` (mismo UUID que Supabase Auth, no `gen_random_uuid()` porque es FK a `auth.users`), timestamps `timestamptz`, enums/códigos en inglés, `full_name` como dato de usuario en español. No se duplican `email` ni `password_hash` — viven en `auth.users`.

**Usuario staff de prueba** (SQL ad-hoc de seed, no migración):

- Email: `staff@opendaycare.com`
- `full_name`: `Antonio Cutillas`
- Rol: `staff`
- Contraseña: `Test1234!` (cifrada con `extensions.crypt(..., 'bf')`)
- `email_confirmed_at` = `now()` (usuario activo sin flujo de confirmación)
- `raw_user_meta_data`: `{"daycare_id": "<uuid de Guardería Sala Soles>", "role": "staff", "full_name": "Antonio Cutillas"}`
- Fila correspondiente en `auth.identities` (provider `email`, mismo `user_id`/`id`) para que el registro sea consistente con lo que genera Supabase Auth en un signup real.

## Implementation plan

1. Cargar la skill `supabase-postgres-best-practices` (regla del repo antes de tocar la DB).
2. Crear la migración con `supabase migration new create_users` y escribir en ella el contenido de la sección Data model.
3. Aplicar la migración al remoto con `supabase_apply_migration` (name: `create_users`).
4. Crear el usuario staff de prueba vía `supabase_execute_sql`: insert en `auth.users` + `auth.identities` con el `raw_user_meta_data` del spec; verificar que el trigger `on_auth_user_created` creó la fila en `public.users`.
5. Verificar: `supabase_list_tables` (tabla `users` con sus 10 columnas y 1 fila), `supabase_list_migrations` (`create_users` registrado), `supabase_get_advisors` (sin avisos nuevos) y SELECT del perfil (`role = staff`, `daycare_id` correcto, `status = active` por default).
6. Confirmar con SQL de prueba que el hash de la contraseña valida con `Test1234!` y que un `UPDATE` sobre `public.users` refresca `updated_at`.

## Acceptance criteria

- [ ] Existe `supabase/migrations/YYYYMMDDHHMMSS_create_users.sql` con enums, DDL, RLS, trigger `updated_at`, función `handle_new_user` y trigger `on_auth_user_created`.
- [ ] `supabase_list_tables` muestra `public.users` con columnas `id`, `daycare_id`, `role`, `status`, `full_name`, `avatar_url`, `notify_on_post`, `daily_summary_enabled`, `created_at`, `updated_at`.
- [ ] `role` solo acepta `staff`/`parent`/`admin` y `status` solo `pending`/`active` (enums aplicados).
- [ ] `rls_enabled` es `true` para `users`.
- [ ] `supabase_list_migrations` incluye `create_users`.
- [ ] Existe el usuario `staff@opendaycare.com` en `auth.users` con fila en `auth.identities` y email confirmado.
- [ ] El trigger creó automáticamente la fila en `public.users` con `full_name = 'Antonio Cutillas'`, `role = 'staff'`, `status = 'active'` y el `daycare_id` de "Guardería Sala Soles".
- [ ] La contraseña `Test1234!` valida contra el hash bcrypt almacenado.
- [ ] Hacer `UPDATE` sobre la fila de `users` cambia su `updated_at`.
- [ ] `supabase_get_advisors` no reporta avisos nuevos sobre `users`.

## Decisions

- **Sí:** solo `user_role` y `user_status` en esta migración (decisión del usuario). El resto de enums llega con su propia tabla — patrón tabla por tabla del repo.
- **Sí:** trigger `handle_new_user` (`SECURITY DEFINER`) incluido en este spec (decisión del usuario). Es lo que pide el esquema de referencia y deja el flujo signup → perfil listo, probado con el usuario staff.
- **Sí:** usuario staff con auth real (`auth.users` + `auth.identities`) en vez de solo perfil (decisión del usuario). Prueba el flujo end-to-end del trigger.
- **Sí:** RLS habilitado sin policies (decisión del usuario), igual que `daycares` en SPEC SUPABASE 01. Seguro por defecto; policies junto con auth en un spec futuro.
- **Sí:** datos del usuario de prueba definidos por el usuario: `staff@opendaycare.com`, "Antonio Cutillas", contraseña `Test1234!` (recomendada y aceptada).
- **Sí:** seed de auth vía `supabase_execute_sql` y no en la migración. Las migraciones versionadas son la fuente de verdad del esquema; los datos de `auth.users` son de entorno, no de esquema.
- **Sí:** FK `id → auth.users(id) ON DELETE CASCADE` sin `gen_random_uuid()`. El UUID lo emite Supabase Auth; borrar el usuario auth borra su perfil.
- **No:** insertar el perfil de `users` a mano para el seed. El trigger debe demostrar que funciona — insertarlo a mano ocultaría un fallo del trigger.
- **No:** policies de RLS ahora. Sin el modelo de auth integrado en la app no hay a quién dar acceso.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Insert manual en `auth.users` deja fila huérfana en `auth.identities` (o viceversa) | Insertar ambas tablas en la misma transacción con los mismos campos que genera Supabase Auth en un signup real (`provider: email`, `provider_id = user_id`). |
| `pgcrypto`/`crypt` no resuelve sin cualificar | El schema de extensiones en Supabase es `extensions` — usar `extensions.crypt(...)` y `extensions.gen_salt('bf')`. |
| El trigger falla en signups futuros sin metadata (`daycare_id`/`role`/`full_name` ausentes) | Comportamiento aceptado por ahora: falla con error claro en vez de crear perfiles incompletos; se endurecerá en el spec de auth. |
| La contraseña de prueba queda documentada en el repo | Es una cuenta de prueba sin datos reales; no es un secreto de producción. |
| Trigger sobre `auth.users` dispara en signups de otros proyectos/flujos | Solo existe este proyecto Supabase; el trigger es idempotente en la inserción de un único perfil por usuario (PK). |

## What is **not** in this spec

- Policies de RLS.
- Resto del esquema (rooms, children, parent_children, posts, etc.) y sus enums.
- Integración con la UI de Next.js (`@supabase/ssr`, login, signup).
- Flujos de invitación de padres.

Cada uno de esos, si aterriza, va en su propio spec.
