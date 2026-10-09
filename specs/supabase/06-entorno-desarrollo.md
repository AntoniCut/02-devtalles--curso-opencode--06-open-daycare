# SPEC SUPABASE 06 — Entorno de desarrollo (OpenDayCare-Dev) y flujo dev → prod

> **Estado:** Aprovado
> **Depende de:** SPEC SUPABASE 05
> **Fecha:** 2026-10-08
> **Objetivo:** Trabajar contra el proyecto `OpenDayCare-Dev` (`rfunicjeleyzttwtlbyg`) con `.env.local` y la CLI linkeada a Dev, y aplicar migraciones primero en Dev y recién después en Producción con aprobación explícita.

## Scope

**In:**

- `.env.local` (gitignored): credenciales de Dev copiadas de `supabase/.backups/20261006/.env.old` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_DB_PASSWORD`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`) + `NEXT_PUBLIC_APP_BASE_URL=http://localhost:3000`. `.env` queda con las credenciales de Producción (Vercel usa sus propias env vars).
- `.env.example` documentando el layout por entornos: Dev vía `.env.local`, Producción vía `.env`/Vercel, sin secretos reales.
- CLI linkeada a Dev durante el desarrollo: `supabase link --project-ref rfunicjeleyzttwtlbyg` + verificación con `supabase migration list --linked` (22/22 antes de SPEC 11).
- Detección y reparación del drift de historial de Dev: sus 22 filas usan la hora de aplicación (`apply_migration`) en vez del timestamp del archivo; se reetiquetan a los versions del repo con `supabase migration repair --status reverted/applied` (solo metadatos, no toca el esquema) para que `db push` funcione.
- Flujo de migraciones dev → prod: aplicar en Dev con `supabase db push` (password de Dev), verificar (`supabase migration list`, tablas, advisors y tests de impersonación con rollback) y correr el E2E de Playwright contra la app local apuntando a Dev; el pase a Producción se hace al final con aprobación explícita del usuario (MCP `apply_migration` o CLI `db push`).
- Verificación y restauración de los usuarios de prueba documentados en `references/datos-prueba.md` en Dev (staff/admin/padres; solo si faltan). Dev es un proyecto de desarrollo: los seeds de prueba se aplican ahí, nunca en Producción.
- Actualización de `AGENTS.md` (sección de base de datos): flujo dev → prod, ubicación de credenciales y regla de aprobación explícita para Producción.
- Actualización de `specs/11-alta-miembros-equipo.md` (plan y decisiones): la migración y el E2E pasan por Dev; el admin de prueba de Producción se crea al final del spec con aprobación explícita.

**Out of scope (para specs futuros):**

- Supabase branches y Supabase local con Docker.
- CI/CD, rotación de claves y separación de secretos en Vercel (ya gestionados en el dashboard).
- Cambios de esquema (esta spec no toca la base de datos más allá de verificación/seed de Dev).

## Data model

No introduce estructuras nuevas. Reutiliza los proyectos `OpenDayCare-Dev` y `OpenDayCare-Prod` y los archivos de entorno de Next.js.

## Implementation plan

1. Crear `.env.local` desde `supabase/.backups/20261006/.env.old` (Dev) + `NEXT_PUBLIC_APP_BASE_URL=http://localhost:3000`; confirmar con `git check-ignore -v .env.local` que está ignorado.
2. Actualizar `.env.example` con el layout por entornos (Dev: `.env.local`; Producción: `.env`/Vercel) sin valores reales.
3. Linkear la CLI a Dev (`supabase link --project-ref rfunicjeleyzttwtlbyg --password "$DEV_DB_PASSWORD"`), detectar el drift del historial y repararlo con `supabase migration repair --status reverted <22 versions viejos>` + `--status applied <22 versions del repo>` (solo metadatos); verificar `supabase migration list --linked` (22/22 alineadas + `20261008175546` pendiente).
4. `pnpm dev` + verificación de que la app lee Dev (datos distintos a Prod, sin errores de consola) y E2E de humo (login con un usuario de Dev).
5. Verificar en Dev los usuarios de `references/datos-prueba.md` y restaurar solo los que falten (seed en Dev, nunca en Prod).
6. Actualizar `AGENTS.md` (flujo dev → prod) y `specs/11-alta-miembros-equipo.md` (plan/decisiones).
7. `pnpm lint` + `pnpm build`.

## Acceptance criteria

- [x] `.env.local` existe con las credenciales de Dev y `git check-ignore` confirma que está ignorado; `.env` conserva las de Producción.
- [x] `.env.example` describe el layout por entornos sin secretos.
- [x] `supabase migration list --linked` contra Dev muestra las 22 migraciones del repo alineadas (historial reparado) y `20261008175546` pendiente.
- [x] `pnpm dev` levanta la app apuntando a Dev (se comprueba con datos que difieren de Prod) y un login de humo funciona sin errores de consola.
- [x] Los usuarios de prueba de `references/datos-prueba.md` existen en Dev (restaurados solo los faltantes).
- [x] `AGENTS.md` documenta el flujo dev → prod y la regla de aprobación explícita para Producción.
- [ ] `specs/11-alta-miembros-equipo.md` refleja el flujo dev → prod en su plan y decisiones.
- [x] `pnpm lint` y `pnpm build` sin errores.

## Decisions

- **Sí:** usar el proyecto existente `OpenDayCare-Dev` (`rfunicjeleyzttwtlbyg`) como entorno de desarrollo (decisión del usuario) — ya está activo, con esquema al día y datos de prueba, y no requiere infraestructura nueva.
- **Sí:** `.env.local` para Dev y `.env` para Producción (decisión del usuario) — Next.js prioriza `.env.local` en local y Vercel no lo recibe porque está gitignored.
- **Sí:** flujo dev → prod para migraciones — reduce el riesgo de aplicar DDL sin probar; Producción conserva la regla de aprobación explícita.
- **Sí:** la CLI se linkea a Dev durante el desarrollo y se relinkea a Prod al cerrar el spec — `supabase/config.toml` es gitignored (estado local).
- **Sí:** reparar el historial de migraciones de Dev (solo metadatos) — el proyecto se construyó con `apply_migration`, que registra la hora de aplicación como version; Prod quedó alineado con `db push`. La equivalencia de contenido está respaldada por SPEC SUPABASE 05 (Prod se pobló desde Dev con esas 22 migraciones y los conteos quedaron idénticos).
- **No:** Supabase branches ni stack local con Docker — Dev cubre la necesidad sin costo ni setup adicional.
- **No:** tocar Producción en esta spec — solo verificación y seeds en Dev.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Aplicar una migración a Prod por error durante el desarrollo | CLI linkeada a Dev; el pase a Prod es un comando explícito con aprobación del usuario al final. |
| `.env.old` con credenciales rotadas o desactualizadas | Verificación del paso 4 (login y consultas reales); si falla, se regeneran las claves en el dashboard de Dev. |
| Reparar el historial oculte drift real entre Dev y el repo | Solo se reetiquetan versions de migraciones con el mismo nombre lógico; Prod se pobló desde Dev con esas 22 migraciones y se verificaron esquema y conteos (SPEC SUPABASE 05). |
| `.env.local` también aplica en `next build` local | Documentado: la producción real es Vercel con sus env vars; el build local contra Dev es el comportamiento esperado. |
| MCP sin autorizar (`Unauthorized`) | Dev se opera con la CLI; antes de tocar Prod se re-autentica el MCP o se usa `supabase db push` con aprobación. |

## What is **not** in this spec

- Supabase branches, Supabase local con Docker, CI/CD y rotación de claves.
- Cambios de esquema (van en sus propias migraciones/specs).
- Seeds en Producción (solo se crean los datos de prueba con aprobación explícita, como en SPEC 11).

Cada uno de esos, si aterriza, va en su propio spec.
