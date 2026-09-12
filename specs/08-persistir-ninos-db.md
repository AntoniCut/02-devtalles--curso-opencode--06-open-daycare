# SPEC 08 — Persistir niños: `/agregar-nino` → tabla `children` y lectura real en `/kids`

> **Estado:** Implementado
> **Depende de:** SPEC 04, SPEC 07, SPEC SUPABASE 03, SPEC SUPABASE 04
> **Fecha:** 2026-09-12
> **Objetivo:** Guardar los niños del formulario `/agregar-nino` en la tabla `children` de Supabase (con policies RLS) y que `/kids` y `/kids/[slug]` lean los niños reales, con seed de los 8 del mock.

## Scope

**In:**

- Migración con policies RLS: `children` (SELECT + INSERT para `authenticated`) y `rooms` (SELECT para `authenticated`).
- Seed vía SQL directo (MCP) de los 8 niños del mock a `children` (sala Soles, fechas, alergias y notas mapeadas fielmente).
- Server Action `app/agregar-nino/actions.ts`: inserta en `children` (`full_name`, `birth_date`, `room_id`, `allergy_tags` split por comas, `medical_notes` no se envía, `enrolled_at` = hoy); al éxito → `/kids`.
- `add-kid-form.tsx`: recibe salas reales de la página server (select guarda `room_id`), estado loading en "Guardar", error inline si falla el insert.
- `/kids` y `/kids/[slug]` leen de Supabase (join con `rooms`); mapper DB→`Kid` calcula slug, edad, inicial, colores de avatar y tags de alergia.
- Contador de niños calculado de los datos reales; etiqueta "SALA SOLES" → "NIÑOS" (todas las salas).
- Perfil con sección de padres vacía + CTA "Vincular otro padre" (ya soportado con `parents: []`).

**Out of scope (para specs futuros):**

- Vinculación real de padre (`parent_children`, emails) — SPEC 05 sigue estático.
- Editar/archivar niños, subir fotos, `photo_consent` en UI.
- Reemplazar el mock de `lib/kids.ts` usado por los chips PARA de `/crear-publicacion` (SPEC 06).
- Policies por daycare (multi-tenant fino), responsive, modo oscuro.

## Data model

```ts
// app/agregar-nino/actions.ts
type InsertKidResult = { error: string } | undefined;

// lib/kids.ts — mapper (agregado; el mock de los 8 se conserva para SPEC 06)
const mapDbChildToKid = (child, roomName): Kid => ({
  slug: slugify(child.full_name),
  age: ageFromBirthDate(child.birth_date),   // "3 años"
  initial: firstLetter(child.full_name),
  background/color: paleta por hash del nombre,
  tag: child.allergy_tags[0] ? { label: upper(tag), variant: "alert" } : undefined,
  allergyNote: child.medical_notes ?? undefined,
  birthDate: formatEs(child.birth_date),     // "12 mar 2022"
  classroom: roomName,
  entry: child.enrolled_at ? formatMes(child.enrolled_at) : "—", // "feb 2025"
  parents: [],
});
```

## Implementation plan

1. Migración de policies (archivo + `supabase_apply_migration`): SELECT/INSERT en `children` y SELECT en `rooms` para `authenticated`. Verificar con advisors.
2. Seed de los 8 niños vía `supabase_execute_sql` (mapeo fiel del mock). Verificar con SELECT.
3. `lib/kids.ts`: helpers `slugify`, `ageFromBirthDate`, paleta de avatares y `mapDbChildToKid` (mock intacto para SPEC 06).
4. `app/kids/page.tsx`: query children+rooms → `mapDbChildToKid` → `KidsBrowser`; contador y etiqueta desde datos reales.
5. `app/kids/[slug]/page.tsx`: buscar por `slug` en los niños de DB (404 si no existe).
6. `app/agregar-nino/page.tsx` (server): leer rooms → pasarlas al form; `actions.ts` con Server Action de insert; form con loading, error inline y `router.push("/kids")`.
7. Verificación Playwright (agregar niño real → aparece en `/kids` → su perfil), consola limpia, `pnpm lint` + `pnpm build`.

## Acceptance criteria

- [x] Las policies existen y un usuario autenticado puede leer `children`/`rooms` e insertar en `children`; anónimo no.
- [x] `children` contiene los 8 niños del mock con fechas, alergias y notas mapeadas.
- [x] `/kids` lista los 9+ niños de la DB (8 seed + nuevos) con contador real y etiqueta "NIÑOS".
- [x] Pulsar un niño nuevo (y los seeded) abre su perfil con datos correctos (edad calculada, sala, ingreso).
- [x] El select de salas muestra las salas reales de la DB (Soles, Estrellas, Luna).
- [x] Guardar un niño válido lo inserta en `children` y redirige a `/kids` donde aparece.
- [x] "Guardar" muestra estado de carga; un fallo de insert muestra error inline sin perder el estilo.
- [x] La validación actual (requeridos + máscara + fecha real) sigue igual.
- [x] `/crear-publicacion` sigue funcionando (chips del mock intactos).
- [x] `pnpm lint` y `pnpm build` sin errores; consola limpia.

## Decisions

- **Sí:** policies para `authenticated` en `children` (SELECT+INSERT) y `rooms` (SELECT) — mínimo para que la app funcione; por daycare en spec futuro.
- **Sí:** seed vía SQL directo (decisión del usuario) — es dato, no esquema; las policies sí van por migración versionada.
- **Sí:** seed fiel (fechas, alergias→`allergy_tags`, notas→`medical_notes`, todos en sala Soles).
- **Sí:** padres vacíos en DB → perfil muestra CTA "Vincular otro padre" (decisión del usuario).
- **Sí:** conservar el mock de `lib/kids.ts` para los chips PARA de SPEC 06 (evita ampliar alcance).
- **No:** insertar `medical_notes` desde el form en este spec (queda null; "lo mínimo", decisión del usuario).
- **No:** filtrar `/kids` por sala (todas las salas, decisión del usuario).

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Slug duplicado (`full_name` → kebab) | Se documenta; colisión → 404 del primero. Spec futuro: columna slug en DB. |
| "Lunas" (mock) vs "Luna" (DB) | Se leen salas reales; divergencia aceptada y documentada. |
| RLS sin policy de UPDATE/DELETE futuros | Solo SELECT/INSERT en este spec; el resto en spec de policies completo. |

## What is **not** in this spec

- Vinculación real de padres, edición de niños, fotos, multi-tenant RLS, responsive/oscuro.

Cada uno, si aterriza, va en su propio spec.
