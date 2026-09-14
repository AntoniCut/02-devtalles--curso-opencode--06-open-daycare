# OpenDayCare

Aplicación de gestión para guarderías: feed de publicaciones por niño, invitaciones de padres y autenticación. Construida con **Next.js 16 (App Router, Turbopack)**, **React 19**, **Tailwind CSS 4** y **Supabase** (Auth + Postgres), con emails transaccionales vía **Resend**.

Las maquetas de referencia están en `references/pantallas/` (HTML) y los objetivos de comparación visual en `references/screenshots/`.

## Stack

| Tecnología | Versión | Uso |
| --- | --- | --- |
| [Next.js](https://nextjs.org) | 16.3.3 | Framework — App Router en la raíz del proyecto (`app/`), Turbopack, `proxy.ts` en lugar de `middleware.ts` (deprecado en Next 16) |
| [React](https://react.dev) | 19.2.8 | UI, Server Components y Server Actions |
| [TypeScript](https://www.typescriptlang.org) | 5 | Tipado en todo el proyecto, alias de imports `@/*` |
| [Tailwind CSS](https://tailwindcss.com) | 4 | Estilos (plugin `@tailwindcss/postcss`) |
| [Supabase](https://supabase.com) | `@supabase/supabase-js` + `@supabase/ssr` | Auth, Postgres con RLS y acceso desde Server Components / Server Actions / Client Components |
| [Resend](https://resend.com) + [React Email](https://react.email) | `resend` + `@react-email/render` | Envío de emails transaccionales (invitaciones a padres) |
| [ESLint](https://eslint.org) | 9 (flat config) | Lint con `eslint-config-next` |
| [pnpm](https://pnpm.io) | 11 | Gestor de paquetes |

## Requisitos previos

- Node.js 20+
- **pnpm 11** (el gestor de paquetes del proyecto)
- Supabase CLI (opcional, para migraciones): `npm install -g supabase` o [instrucciones oficiales](https://supabase.com/docs/guides/local-development/cli/getting-started)
- Una cuenta de Supabase y una API key de [Resend](https://resend.com/api-keys) para el envío de invitaciones

## Puesta en marcha

1. Instalar dependencias:

   ```bash
   pnpm install
   ```

2. Crear el archivo de entorno a partir del ejemplo y completarlo:

   ```bash
   cp .env.example .env
   ```

   | Variable | Dónde obtenerla | Uso |
   | --- | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Dashboard → Settings → API | Cliente de Supabase (`@supabase/ssr`) |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Dashboard → Settings → API (clave publishable) | Cliente de Supabase (`@supabase/ssr`) |
   | `SUPABASE_DB_PASSWORD` | Dashboard → Settings → Database | Migraciones y acceso directo a Postgres |
   | `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → Settings → API | Tareas de servidor que saltan RLS |
   | `RESEND_API_KEY` | [resend.com/api-keys](https://resend.com/api-keys) | Envío de emails de invitación |
   | `RESEND_FROM_EMAIL` | Remitente del email | En producción usar un dominio verificado; `onboarding@resend.dev` solo envía a tu propio correo |
   | `NEXT_PUBLIC_APP_BASE_URL` | — | URL base de la app (enlaces de activación) |

   > `.env` no se commitea. Los valores del proyecto de Supabase están en la URL de cada variable en `.env.example`.

3. Levantar el servidor de desarrollo:

   ```bash
   pnpm dev
   ```

   Abrir [http://localhost:3000](http://localhost:3000).

## Comandos

| Comando | Descripción |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo en el puerto 3000 (Turbopack) |
| `pnpm build` | Build de producción |
| `pnpm lint` | ESLint (flat config con `eslint-config-next`) |

No hay tests ni formatter configurados.

## Supabase

### Datos del proyecto

- **Project ref:** `rfunicjeleyzttwtlbyg`
- **Project URL:** https://rfunicjeleyzttwtlbyg.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/rfunicjeleyzttwtlbyg

### Autenticar la CLI de Supabase

Cada miembro del equipo se autentica **individualmente** con su propia cuenta de Supabase. Hay dos formas:

**Opción A — Login interactivo (recomendada para desarrollo):**

```bash
supabase login
```

Abre el navegador para autorizar la CLI contra tu cuenta. El token se guarda localmente en `~/.supabase/access-tokens`.

**Opción B — Access token personal (CI o entornos headless):**

1. Generar un Personal Access Token en https://supabase.com/dashboard/account/tokens
2. Exportarlo como variable de entorno:

   ```bash
   export SUPABASE_ACCESS_TOKEN=sbp_...
   ```

   En CI/CD (GitHub Actions, etc.) va como *secret* del repositorio.

> Cada persona debe usar **su propio token** — los tokens son personales y revocables por cuenta. Nunca commitear el token ni la DB password; eso vive en `.env` o en secrets del entorno.

### Vincular el repositorio al proyecto

Una vez autenticado, vincular la carpeta del repo con el proyecto remoto:

```bash
supabase link --project-ref rfunicjeleyzttwtlbyg
```

Pide la `SUPABASE_DB_PASSWORD`. Esto crea `supabase/config.toml` y `supabase/.temp/project_id` (no commitearlos si no quieres compartir el link).

### MCP de Supabase (usado por el asistente IA)

El agente de IA de este repo no usa la CLI: se conecta al **MCP remoto de Supabase** configurado en `opencode.json`:

```
https://mcp.supabase.com/mcp?project_ref=rfunicjeleyzttwtlbyg&read_only=false&features=docs,account,database,debugging,development,functions,branching
```

La autenticación del MCP es **OAuth en el navegador**: la primera vez que el editor conecta el servidor, Supabase pide autorizar tu cuenta. Cada miembro del equipo autoriza su propia sesión — no comparte token con la CLI ni con el access token del paso anterior.

Autenticar (o re-autenticar) el MCP desde la terminal:

```bash
opencode mcp auth supabase
```

Si ya hay credenciales válidas, el comando lo detecta y pregunta si querés re-autenticar; si no las hay, abre el flujo OAuth en el navegador. Verificar el estado de los servidores MCP:

```bash
opencode mcp list        # estado de conexión de todos los MCP
opencode mcp auth list   # estado de OAuth de los servidores que lo requieren
```

### Migraciones

`supabase/migrations/` es la **fuente de verdad del esquema** (versionada en el repo). El patrón de trabajo:

1. Crear el archivo:

   ```bash
   supabase migration new <slug>
   ```

   Genera `supabase/migrations/YYYYMMDDHHMMSS_<slug>.sql`.

2. Editar el SQL y aplicarlo al proyecto remoto, ya sea con la CLI:

   ```bash
   supabase db push
   ```

   o con la herramienta `supabase_apply_migration` del MCP (mismo SQL del archivo).

3. Verificar con `supabase_list_migrations`, `supabase_list_tables` y los advisors de seguridad/performance.

## Estructura del proyecto

```
app/                  Rutas del App Router
  (auth)/login        Login (Supabase Auth)
  (auth)/activate     Activación de padres con código de invitación
  kids/               Perfil y feed por niño
  agregar-nino/       Alta de niños
  vincular-padre/     Invitación de padres (email vía Resend)
  crear-publicacion/  Creación de publicaciones
lib/                  Helpers (auth, códigos de invitación, etc.)
utils/supabase/       Clientes oficiales de Supabase (server / browser / proxy)
supabase/migrations/  Esquema de la base de datos (fuente de verdad)
specs/                Especificaciones del flujo spec-driven
references/           Maquetas HTML y screenshots objetivo
.agents/skills/       Skills de spec, implementación y Supabase
```

## Convenciones

- Acceso a la base de datos **solo** con `@supabase/supabase-js` + `@supabase/ssr` — nunca drivers SQL ni ORMs desde la app.
- Navegación interna con `next/link`, nunca `<a>`.
- El helper de `utils/supabase/proxy.ts` se exporta desde `proxy.ts` en la raíz (en Next 16 `middleware.ts` está deprecado).
- Alias de imports `@/*` apunta a la raíz del proyecto (`tsconfig.json`).
- Esquema de referencia de la base de datos: proyecto externo `07-db-Schema`.
