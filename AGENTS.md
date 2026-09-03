

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

- No hay autenticación ni base de datos todavía — los enlaces y datos son mock.
- Navegación interna **siempre con** `next/link`, no con `<a>`.
- Comunicación con el usuario en **español**.



## MCPs

- **Playwright**: screenshots, snapshots de accesibilidad y logs de consola tienen que guardarse en la carpeta `.playwright-mcp/` (está gitignored, excepto su contenido). El MCP está habilitado vía `opencode.json`.
- **Context7**: usarlo para traer documentación actualizada de Next.js/React antes de escribir código — esta versión de Next 16 difiere de los datos de entrenamiento.



## Spec Driven Development - Skills

- **/spec**: Usaremos esta habilidad para crear las especificaciones.
- **/spec-imp**: Usaremos esta skill para hacer las implementaciones.
- Leer las skill globales sobre comentarios de código y de typescript.

## Reglas de código

- Usar código limpio, nombres, variables, funciones, etc, en inglés.


## Workflow de specs

Las skills del proyecto viven en `.agents/skills/` (`spec`, `spec-impl`), instaladas desde `klerith/fernando-skills` (`skills-lock.json`).

- `/spec <descripción>`: crea `specs/NN-slug.md` en estado `Draft` (carpeta `specs/`, numeración secuencial de 2 dígitos).
- El usuario cambia el estado a `Approved` manualmente; `/spec-impl NN-slug` crea la rama `spec-NN-slug` (según `AutoCreateBranch` en `specs/.spec-config.yml`) e implementa paso a paso con pausas para revisar diffs.
- `spec-impl` **nunca** commitea automáticamente — el commit es decisión del usuario.
- Verificación visual de criterios de aceptación: usar el MCP de Playwright contra `references/screenshots/`.

