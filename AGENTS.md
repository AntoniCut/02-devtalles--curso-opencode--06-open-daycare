

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.



## Stack y comandos

- **Next.js 16.3.3 (Turbopack) + React 19**, App Router en `app/` en la raíz (no hay `src/`).
- Gestor de paquetes: **pnpm 11**. Comandos: `pnpm dev` (puerto 3000), `pnpm build`, `pnpm lint` (ESLint flat config con `eslint-config-next`). No hay tests ni formatter configurados.
- `pnpm-workspace.yaml` bloquea los build scripts de `sharp` y `unrs-resolver` (`allowBuilds: false`) — no los rehabilites sin motivo.
- Alias de imports: `@/*` → raíz del proyecto (definido en `tsconfig.json`).



## Objetivo del proyecto

Portar las maquetas HTML de `references/pantallas/*.dc.html` a rutas del App Router, manteniendo el estilo **idéntico**. `references/screenshots/*.png` son los objetivos de comparación visual. `CLAUDE.md` solo re-exporta este archivo (`@AGENTS.md`).

- Base de datos: **Supabase** (configurado vía MCP). El esquema de referencia vive en el proyecto externo `07-db-Schema` — se implementa tabla por tabla vía specs (la raíz `daycares` ya está implementada); los enlaces y datos de las pantallas siguen siendo mock. Credenciales en `.env` (`SUPABASE_DB_PASSWORD`, ver `.env.example`; `.env` no se commitea).
- **Acceso a la base de datos desde la app**: SIEMPRE con los paquetes oficiales de Supabase para Next.js — `@supabase/supabase-js` + `@supabase/ssr` (instalados con pnpm). Nunca con drivers SQL directos (`pg`, `postgres`) ni ORMs desde la aplicación.
  - Cliente server: `createClient` de `utils/supabase/server.ts` (Server Components, Route Handlers, Server Actions).
  - Cliente browser: `createClient` de `utils/supabase/client.ts` (Client Components).
  - Proxy (antes middleware): el helper de `utils/supabase/proxy.ts` se usa desde `proxy.ts` en la raíz — **`middleware.ts` está deprecado en Next 16**, usar siempre `proxy.ts` con export `proxy`.
  - Variables de entorno: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (ver `.env.example`).
- Navegación interna **siempre con** `next/link`, no con `<a>`.
- Comunicación con el usuario en **español**.



## MCPs

- **Playwright**: screenshots, snapshots de accesibilidad y logs de consola tienen que guardarse en la carpeta `.playwright-mcp/` (está gitignored, excepto su contenido). El MCP está habilitado vía `opencode.json`.
- **Context7**: usarlo para traer documentación actualizada de Next.js/React antes de escribir código — esta versión de Next 16 difiere de los datos de entrenamiento.
- **Supabase**: acceso al proyecto (SQL, logs, advisors, tipos TypeScript, migraciones). Usar sus herramientas para inspeccionar tablas antes de cambios de esquema; las migraciones van directas al proyecto remoto, aplicarlas con cuidado.



## Spec Driven Development - Skills

- **/spec**: Usaremos esta habilidad para crear las especificaciones.
- **/spec-imp**: Usaremos esta skill para hacer las implementaciones.
- Leer las skill globales sobre comentarios de código y de typescript.

## Reglas de código

- Usar código limpio, nombres, variables, funciones, etc, en inglés.


## Workflow de specs

Las skills del proyecto viven en `.agents/skills/` (`spec`, `spec-impl`, `supabase`, `supabase-postgres-best-practices`), instaladas con `skills-lock.json` desde `klerith/fernando-skills` y `supabase/agent-skills`.

- `/spec <descripción>`: crea `specs/NN-slug.md` en estado `Draft` (carpeta `specs/`, numeración secuencial de 2 dígitos).
- El usuario cambia el estado a `Approved` manualmente; `/spec-impl NN-slug` crea la rama `spec-NN-slug` (según `AutoCreateBranch` en `specs/.spec-config.yml`) e implementa paso a paso con pausas para revisar diffs.
- `spec-impl` **nunca** commitea automáticamente — el commit es decisión del usuario.
- Verificación visual de criterios de aceptación: usar el MCP de Playwright contra `references/screenshots/`.
- **Agente verificador** (`.opencode/agent/spec-verifier.md`): subagente que verifica los criterios de aceptación de un spec, corrige el código de los criterios que fallan y marca los checkboxes del spec. Usa modelo con visión + Playwright (comparación contra `references/screenshots/`) + Context7. Nunca commitea ni toca la línea de Estado del spec — solo el checklist de "Acceptance criteria".



## Accesibilidad (WCAG 2.2 AA)

- Estándar de referencia: **WCAG 2.2 nivel AA**, incluidos los criterios nuevos de 2.2 (2.4.11 Focus Not Obscured, 2.5.7 Dragging Movements, 2.5.8 Target Size, 3.2.6 Consistent Help, 3.3.7 Redundant Entry, 3.3.8 Accessible Authentication).
- **Agente accessibility-checker** (`.opencode/agent/accessibility-checker.md`): subagente que audita los archivos que se le indiquen (revisión estática + verificación en runtime con Playwright: snapshot de accesibilidad, teclado, contraste con estilos computados, target size, reflow, reduced motion), corrige todos los hallazgos —incluidos los cambios de contraste/color— y reporta en español con el criterio WCAG de cada hallazgo. No usa axe-core y nunca commitea.
- Invocación: `/accessibility-checker <archivo>` o pidiendo al subagente `accessibility-checker` que revise los archivos indicados.
- Si una corrección altera el aspecto respecto al mockup, el agente lo marca explícitamente en el informe (la accesibilidad tiene prioridad sobre el pixel-perfect).



## Skills de Supabase

- **supabase**: cargar SIEMPRE ante cualquier tarea con Supabase (DB, Auth, Edge Functions, Realtime, Storage, cliente `supabase-js`/`@supabase/ssr` en Next.js, RLS, migraciones, debugging, logs).
- **supabase-postgres-best-practices**: cargar ANTES de tocar la base de datos (crear/alterar tablas y columnas, elegir tipos, RLS, índices, triggers, funciones, migraciones, optimización de queries). Aplica incluso a cambios de una columna.



## Base de datos — patrón de migraciones (siempre)

Cada vez que se manipule la base de datos (crear/alterar/dropear tablas, columnas, índices, triggers, funciones, RLS, seeds) se usa SIEMPRE el patrón de migraciones — nunca SQL ad-hoc de cambios contra el remoto:

1. Cargar las skills `supabase` y `supabase-postgres-best-practices`.
2. Crear el archivo con `supabase migration new <slug>` → `supabase/migrations/YYYYMMDDHHMMSS_<slug>.sql`, versionado en el repo (el repo es la fuente de verdad del esquema).
3. Aplicar la migración al remoto con `supabase_apply_migration` (mismo SQL del archivo).
4. Verificar con `supabase_list_migrations`, `supabase_list_tables` y `supabase_get_advisors`.
5. `supabase_execute_sql` solo para lecturas, pruebas o verificación — no para cambios de esquema.

**Agente db-migrator** (`.opencode/agent/db-migrator.md`): subagente que asegura que todo cambio de esquema exista como migración versionada en `supabase/migrations/` y la aplica al remoto con `supabase_apply_migration`; audita drift repo↔remoto y verifica con `supabase_list_migrations`/`supabase_list_tables`/`supabase_get_advisors`. Carga siempre las skills `supabase` y `supabase-postgres-best-practices`. Nunca commitea ni aplica DDL ad-hoc.

Las specs de base de datos viven en `specs/supabase/`.


