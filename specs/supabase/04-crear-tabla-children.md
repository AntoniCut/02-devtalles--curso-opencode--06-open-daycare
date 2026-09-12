# SPEC SUPABASE 04 — Crear tabla `children`

> **Estado:** Implementado
> **Depende de:** SPEC SUPABASE 03
> **Fecha:** 2026-09-12
> **Objetivo:** Crear la tabla `public.children` (tabla 4 del esquema de referencia 07-db-Schema) con FK a `rooms`, enum `child_status`, `allergy_tags text[]`, RLS habilitado, trigger `updated_at` reutilizando `set_updated_at()` e índice de la FK.

## Scope

**In:**

- Migración `supabase/migrations/YYYYMMDDHHMMSS_create_children.sql` (patrón CLI de Supabase) con:
  - Creación del enum `child_status` (`active` / `archived`) si no existe.
  - DDL de `public.children` según el esquema de referencia (07-db-Schema, tabla 4) + `updated_at` (consistencia con SPEC SUPABASE 01/02/03).
  - FK → `rooms(id)`, RLS habilitado sin policies.
  - Índice `children_room_id_idx` sobre `room_id` (best practice de Supabase: indexar el lado FK).
  - Trigger `set_children_updated_at` reutilizando `public.set_updated_at()`.
- Aplicar la migración al remoto con `supabase_apply_migration` (name: `create_children`).
- Verificación: `supabase_list_tables`, `supabase_list_migrations`, `supabase_get_advisors`, prueba `UPDATE` que refresca `updated_at`.

**Out of scope (para specs futuros):**

- Seeds de niños (decisión del usuario: sin seeds; los datos llegarán por la app).
- Policies de RLS (llegan junto con el modelo de auth, igual que `daycares`, `users` y `rooms`).
- Tabla `parent_children` (vínculo padre ↔ niño) y el resto del esquema.
- Normalización de `allergy_tags` a tablas `allergies` + `child_allergies`.
- CRUD de niños desde la app.

## Data model

```sql
do $$ begin
  create type public.child_status as enum ('active', 'archived');
exception
  when duplicate_object then null;
end $$;

create table public.children (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id),
  full_name text not null,
  birth_date date not null,
  enrolled_at date,
  medical_notes text,
  allergy_tags text[] not null default '{}',
  photo_consent boolean not null default true,
  status public.child_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.children enable row level security;

create index children_room_id_idx on public.children (room_id);

create trigger set_children_updated_at
  before update on public.children
  for each row
  execute function public.set_updated_at();
```

Notas sobre el mapeo desde el esquema de referencia:

- PK `id uuid` con `gen_random_uuid()`, timestamps `timestamptz` (convención del esquema).
- `allergy_tags text[]` con default `'{}'` (array de Postgres; valores en inglés, la UI traduce a MANÍ, LACTOSA, etc.).
- `photo_consent boolean default true` según el esquema.
- `status child_status default 'active'` (borrado lógico vía `archived`).
- `enrolled_at` nullable: el esquema no marca NOT NULL para la fecha de ingreso.
- `updated_at` + trigger añadidos por consistencia con las tablas anteriores (decisión del usuario).

## Implementation plan

1. Cargar la skill `supabase` + `supabase-postgres-best-practices` (regla del repo antes de tocar la DB).
2. Crear la migración con `supabase migration new create_children` y escribir en ella el contenido de la sección Data model.
3. Aplicar la migración al remoto con `supabase_apply_migration` (name: `create_children`).
4. Verificar: `supabase_list_tables` (tabla con las columnas esperadas y sin filas), `supabase_list_migrations` (`create_children` registrado), `supabase_get_advisors` (sin avisos nuevos).
5. Confirmar con SQL de prueba que un `UPDATE` sobre una fila de prueba (creada y eliminada en la misma verificación) refresca `updated_at`.

## Acceptance criteria

- [x] Existe `supabase/migrations/YYYYMMDDHHMMSS_create_children.sql` con enum, DDL, RLS, índice de la FK y trigger.
- [x] `supabase_list_tables` muestra `public.children` con columnas `id`, `room_id`, `full_name`, `birth_date`, `enrolled_at`, `medical_notes`, `allergy_tags`, `photo_consent`, `status`, `created_at`, `updated_at`.
- [x] Existe el enum `child_status` con valores `active` y `archived`.
- [x] Existe el índice `children_room_id_idx` sobre `room_id`.
- [x] Hacer `UPDATE` sobre una fila cambia su `updated_at`.
- [x] `rls_enabled` es `true` para `children`.
- [x] `supabase_list_migrations` incluye `create_children`.
- [x] `supabase_get_advisors` no reporta avisos nuevos sobre `children` (solo `unused_index` INFO esperado y los avisos pre-existentes de `daycares`/`users`/`rooms`/`handle_new_user`).

## Decisions

- **No:** seeds de niños (decisión del usuario). Los datos llegarán por la app o en un spec futuro.
- **Sí:** `allergy_tags text[]` tal cual el esquema de referencia (decisión del usuario). La normalización a `allergies` + `child_allergies` queda descartada por ahora; si aterriza, va en su propio spec.
- **Sí:** `updated_at` + trigger `set_children_updated_at` reutilizando `set_updated_at()` (decisión del usuario). Consistencia con `daycares` (01), `users` (02) y `rooms` (03).
- **Sí:** índice `children_room_id_idx` en la misma migración. El advisor de performance ya exigió indexar las FK en specs anteriores; se adelanta aquí.
- **Sí:** RLS habilitado sin policies, igual que las tablas anteriores. Seguro por defecto; policies junto con auth en un spec futuro.
- **Sí:** creación del enum `child_status` con guard `duplicate_object` para que la migración sea idempotente si se re-aplica.
- **Sí:** defaults en `allergy_tags` (`'{}'`), `photo_consent` (`true`) y `status` (`active`) — el esquema define defaults para los dos últimos y el array vacío evita `NULL` en inserciones simples.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `text[]` dificulta consultas/validación de alérgenos a futuro | Decisión documentada; normalizar es un cambio aislado en un spec futuro. |
| Tabla sin policies con RLS activo: nadie puede leer/escribir desde la app | Comportamiento esperado hasta el spec de policies; las seeds de UI siguen siendo mock. |
