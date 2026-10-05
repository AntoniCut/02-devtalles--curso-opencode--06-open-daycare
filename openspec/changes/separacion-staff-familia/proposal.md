# Proposal

## Why

Hoy la app solo tiene el shell de staff: cualquier usuario autenticado (incluido un padre) aterriza en `/` y ve la barra lateral de la guardería, con enlaces a rutas de staff. La parte de familia de las maquetas no existe. Separar ambas audiencias da a cada rol su propio espacio (URLs, layout y acceso) y prepara el port del feed de familia.

## What Changes

- Nuevo namespace `/staff/*` para las pantallas de guardería (feed, niños, alta de niño, vincular padres, crear publicación, pokémon). Las URLs actuales (`/`, `/kids`, …) cambian. **BREAKING** para los enlaces internos.
- Nuevo namespace `/familia` con el feed de familia real (publicaciones visibles por RLS, pills por hijo, card propia), fiel a `familia-feed.dc.html`.
- `/` pasa a ser dispatcher por rol; tras login y activación se redirige al home del rol.
- Guards de rol: padre en `/staff/*` → `/familia`; staff/admin en `/familia/*` → `/staff` (proxy con `app_metadata.role` + layouts con `public.users.role` como defensa en profundidad).
- Layouts por audiencia: `app/staff/layout.tsx` (sidebar "Sala Soles" con botón "Nueva publicación") y `app/familia/layout.tsx` (sidebar "Familia", sin botón; usuario con parentesco, ej. "Mamá de Mateo").
- Fuera de alcance: contadores de reacciones/comentarios (no existen las tablas), resumen del día, mi cuenta y detalle de publicación.

## Capabilities

### New Capabilities

- `role-based-routing`: rutas por audiencia (`/staff/*` y `/familia/*`), dispatcher en `/`, guards de rol, redirects por rol tras login/activación y resolución confiable del rol (`app_metadata` en proxy, `public.users` en páginas).
- `family-feed`: feed de familia (saludo, filtro por hijo, publicaciones visibles por RLS con card de familia y sidebar propia).

### Modified Capabilities

- Ninguna: el proyecto todavía no tiene specs de OpenSpec (solo specs propias en `specs/`, fuera del sistema).

## Impact

- `app/`: `page.tsx` pasa a dispatcher; carpetas nuevas `staff/` y `familia/`; páginas de staff movidas; `(auth)` con redirects por rol.
- `components/`: `sidebar.tsx` se divide en sidebar de staff y de familia; nuevo card de familia; `post-card.tsx` de staff intacto.
- `lib/`: `auth.ts` (rol confiable) y `posts.ts` (helpers del feed de familia).
- `proxy.ts`: guards de rol.
- Enlaces internos (~25 referencias en 15 archivos) actualizados al prefijo `/staff`.
- Sin cambios de base de datos: la RLS ya filtra la visibilidad del padre.
