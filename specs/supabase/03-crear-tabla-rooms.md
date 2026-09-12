# SPEC SUPABASE 03 — Crear tabla `rooms`

> **Estado:** Aprovado
> **Depende de:** SPEC SUPABASE 01
> **Fecha:** 2026-09-12
> **Objetivo:** Crear la tabla `public.rooms` (tabla 3 del esquema de referencia 07-db-Schema) con FK a `daycares`, RLS habilitado, trigger `updated_at` reutilizando `set_updated_at()`, índice de la FK y 3 salas seed de "Guardería Sala Soles".

## Scope

**In:**

- Migración `supabase/migrations/YYYYMMDDHHMMSS_create_rooms.sql` (patrón CLI de Supabase) con:
  - DDL de `public.rooms` según el esquema de referencia (07-db-Schema, tabla 3) + `updated_at` (consistencia con SPEC SUPABASE 01/02).
  - FK → `daycares(id)`, RLS habilitado sin policies.
  - Índice `rooms_daycare_id_idx` sobre `daycare_id` (best practice de Supabase: indexar el lado FK; el advisor ya exigió esto en SPEC SUPABASE 02).
  - Trigger `set_rooms_updated_at` reutilizando `public.set_updated_at()`.
  - 3 filas seed ("Soles", "Luna", "Estrellas") de "Guardería Sala Soles" insertadas por JOIN sobre el nombre del daycare (sin UUID hardcodeado).
- Aplicar la migración al remoto con `supabase_apply_migration` (name: `create_rooms`).
- Verificación: `supabase_list_tables`, `supabase_list_migrations`, `supabase_get_advisors`, SELECT de las seeds y prueba `UPDATE` que refresca `updated_at`.

**Out of scope (para specs futuros):**

- Policies de RLS (llegan junto con el modelo de auth, igual que `daycares` y `users`).
- Tabla `children` (depende de `rooms`) y el resto del esquema.
- CRUD de salas desde la app.

## Data model

```sql
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rooms enable row level security;

create index rooms_daycare_id_idx on public.rooms (daycare_id);

create trigger set_rooms_updated_at
  before update on public.rooms
  for each row
  execute function public.set_updated_at();

insert into public.rooms (daycare_id, name)
select id, s.name
from public.daycares d
  cross join (values ('Soles'), ('Luna'), ('Estrellas')) as s(name)
where d.name = 'Guardería Sala Soles';
```

Convención del esquema de referencia: PK `id uuid` con `gen_random_uuid()`, timestamps `timestamptz`, datos de usuario (nombres de salas) en español. "Soles" es la sala que usa la UI.

## Implementation plan

1. Cargar la skill `supabase` + `supabase-postgres-best-practices` (regla del repo antes de tocar la DB).
2. Crear la migración con `supabase migration new create_rooms` y escribir en ella el contenido de la sección Data model.
3. Aplicar la migración al remoto con `supabase_apply_migration` (name: `create_rooms`).
4. Verificar: `supabase_list_tables` (tabla con 5 columnas y 3 filas), `supabase_list_migrations` (`create_rooms` registrado), `supabase_get_advisors` (sin avisos nuevos) y SELECT de las seeds.
5. Confirmar con SQL de prueba que un `UPDATE` refresca `updated_at`.

## Acceptance criteria

- [x] Existe `supabase/migrations/20260912171347_create_rooms.sql` con DDL, RLS, índice de la FK, trigger y 3 seeds.
- [x] `supabase_list_tables` muestra `public.rooms` con columnas `id`, `daycare_id`, `name`, `created_at`, `updated_at`.
- [x] La tabla contiene exactamente 3 filas ("Soles", "Luna", "Estrellas"), todas apuntando a "Guardería Sala Soles".
- [x] Existe el índice `rooms_daycare_id_idx` sobre `daycare_id`.
- [x] Hacer `UPDATE` sobre una fila cambia su `updated_at`.
- [x] `rls_enabled` es `true` para `rooms`.
- [x] `supabase_list_migrations` incluye `create_rooms`.
- [x] `supabase_get_advisors` no reporta avisos nuevos sobre `rooms` (solo `unused_index` INFO esperado y los avisos pre-existentes de `daycares`/`users`/`handle_new_user`).

## Decisions

- **Sí:** `updated_at` + trigger adicional al esquema de referencia (decisión del usuario, vía recomendación). Consistencia con `daycares` (SPEC SUPABASE 01) y `users` (SPEC SUPABASE 02).
- **Sí:** índice `rooms_daycare_id_idx` incluido en la misma migración. El advisor de performance exigió lo mismo en SPEC SUPABASE 02 y obligó a una migración correctiva; se adelanta aquí.
- **Sí:** 3 seeds de "Guardería Sala Soles" (decisión del usuario, vía recomendación). Es la guardería que usa la UI.
- **Sí:** insert seed por JOIN sobre `d.name = 'Guardería Sala Soles'` en vez de hardcodear el UUID del daycare.
- **Sí:** RLS habilitado sin policies, igual que `daycares` y `users`. Seguro por defecto; policies junto con auth en un spec futuro.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El JOIN del seed no encuentra el daycare si cambia el nombre | "Guardería Sala Soles" ya existe desde SPEC SUPABASE 01; se verifica el SELECT tras aplicar. |
| Trigger dispara sobre `UPDATE` masivos | Trigger trivial por fila; la tabla tendrá muy pocas filas. |

## What is **not** in this spec

- Policies de RLS.
- Tabla `children` y el resto del esquema.
- Integración con la UI de Next.js.

Cada uno de esos, si aterriza, va en su propio spec.
