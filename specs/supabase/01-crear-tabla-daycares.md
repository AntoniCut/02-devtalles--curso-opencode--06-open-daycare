# SPEC SUPABASE 01 — Crear tabla `daycares` (reemplazo)

> **Estado:** Implementado
> **Depende de:** —
> **Fecha:** 2026-09-12
> **Objetivo:** Reemplazar la definición previa de la tabla raíz `daycares` en Supabase (nunca aplicada) con DDL + RLS + trigger `updated_at` + 4 filas seed, aplicando el patrón de migraciones versionadas en el repo y aplicadas al remoto vía MCP.

## Scope

**In:**

- Sobrescribir esta spec (reemplaza la versión anterior del 2026-09-10, nunca implementada ni commiteada).
- Eliminar la migración anterior `supabase/migrations/20260910202723_create_daycares.sql`.
- Nuevo archivo de migración `supabase/migrations/YYYYMMDDHHMMSS_create_daycares.sql` (patrón de nombres del CLI de Supabase) con: DDL de `daycares`, `enable row level security`, función + trigger para `updated_at` y 4 filas seed.
- Aplicar la migración al proyecto Supabase remoto vía MCP (`supabase_apply_migration`, name: `create_daycares`).
- Verificación con `supabase_list_tables`, `supabase_list_migrations` y `supabase_get_advisors`.

**Out of scope (para specs futuros):**

- Policies de RLS (requieren el modelo de auth).
- Tablas `users`, `rooms`, `children` y el resto del esquema de referencia (07-db-Schema).
- CRUD de daycares desde la app y cliente `@supabase/ssr` en Next.js.

## Data model

```sql
create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.daycares enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_daycares_updated_at
  before update on public.daycares
  for each row
  execute function public.set_updated_at();

insert into public.daycares (name) values
  ('Guardería Sala Soles'),
  ('Guardería Estrellitas'),
  ('Guardería Pequeños Genios'),
  ('Guardería Tricolor');
```

Convención del esquema de referencia: PK `id uuid` con `gen_random_uuid()`, timestamps `timestamptz`. Enums/códigos persistidos en inglés; `name` y `address` son datos de usuario (nombres propios en español). "Guardería Sala Soles" es la fila que usará la UI.

## Implementation plan

1. Cargar la skill `supabase-postgres-best-practices` (regla del repo antes de tocar la DB).
2. Eliminar `supabase/migrations/20260910202723_create_daycares.sql`.
3. Crear la nueva migración con `supabase migration new create_daycares` y escribir en ella el contenido de la sección Data model.
4. Aplicar la migración al remoto con `supabase_apply_migration` (name: `create_daycares`).
5. Verificar: `supabase_list_tables` (tabla con 5 columnas y 4 filas), `supabase_list_migrations` (`create_daycares` registrado) y `supabase_get_advisors` (RLS habilitado, sin avisos nuevos).
6. Confirmar con SQL de prueba que un `UPDATE` refresca `updated_at`.

## Acceptance criteria

- [x] Ya no existe `supabase/migrations/20260910202723_create_daycares.sql` en el repo.
- [x] Existe un nuevo archivo en `supabase/migrations/` con DDL, `enable row level security`, trigger y 4 seeds.
- [x] `supabase_list_tables` muestra `public.daycares` con columnas `id`, `name`, `address`, `created_at`, `updated_at`.
- [x] La tabla contiene exactamente 4 filas y una es "Guardería Sala Soles".
- [x] Hacer `UPDATE` sobre una fila cambia su `updated_at`.
- [x] `rls_enabled` es `true` para `daycares`.
- [x] `supabase_list_migrations` incluye `create_daycares`.
- [x] `supabase_get_advisors` no reporta avisos nuevos sobre `daycares`.

## Decisions

- **Sí:** sobrescribir la spec 01 en vez de crear una 02. La versión anterior nunca se commiteó ni aplicó; mantener el número evita ruido.
- **Sí:** `address` y `updated_at` adicionales al esquema de referencia. Pedido explícito del usuario.
- **Sí:** trigger `set_updated_at` (BEFORE UPDATE). La columna siempre refleja la última modificación sin depender de la app.
- **Sí:** 4 filas seed en la misma migración, "Guardería Sala Soles" primero. Las próximas tablas (rooms, users) necesitan un `daycare_id`.
- **Sí:** RLS habilitado sin policies. Seguro por defecto: la API pública no puede leer/escribir; policies junto con auth en un spec futuro.
- **Sí:** nombres de migración con patrón CLI (`YYYYMMDDHHMMSS_slug.sql`). Es el estándar de `supabase/migrations/`.
- **No:** `DROP TABLE` previo. El remoto está vacío (0 tablas, 0 migraciones): la nueva migración es la primera del historial.
- **No:** aplicar el schema completo de una vez. Se spec-ea tabla por tabla empezando por la raíz.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| La migración anterior existiera en algún entorno distinto al remoto | Verificar con `supabase_list_migrations` antes de aplicar; hoy el remoto está vacío. |
| Trigger dispara sobre `UPDATE` masivos | Trigger trivial por fila; la tabla tendrá muy pocas filas. |

## What is **not** in this spec

- Policies de RLS.
- Resto del esquema (users, rooms, children, posts, etc.).
- Integración con la UI de Next.js.
