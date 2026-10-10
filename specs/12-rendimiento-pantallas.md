# SPEC 12 — Rendimiento de carga de /staff y /familia

> **Estado:** Implementado
> **Depende de:** SPEC 07, SPEC 10, SPEC 11
> **Fecha:** 2026-10-10
> **Objetivo:** Bajar la carga server-side en caliente de `/staff` de ~800 ms a <450 ms y la de `/familia` de ~420 ms a <350 ms eliminando la verificación de sesión duplicada y las consultas secuenciales a Supabase.

## Why this spec exists

Medición del 2026-10-10 con `pnpm dev` y la CLI de Playwright (staff@opendaycare.com y madre.prueba@opendaycare.com, log del server):

- `GET /staff`: 1770 ms en frío y 781–808 ms **en caliente**, con `next.js: 3ms` — todo el tiempo es `application-code`.
- `GET /familia`: 919 ms en frío y 378–464 ms en caliente.
- `GET /staff/kids` (1–2 queries): ~270 ms en caliente.
- Roundtrip medido a Supabase Dev desde esta máquina: 110–370 ms por llamada.

Conclusión: el tiempo escala linealmente con el número de roundtrips remotos. `/staff` hace ~9 llamadas secuenciales por request (layout y página llaman `getAuthenticatedProfile()` cada uno; la página encadena `users` → `rooms` → `daycares` → `children count` → `posts` → `createSignedUrls`, esperando cada respuesta antes de la siguiente). El framework y la compilación no son el problema; el cliente de dev tampoco (eso es solo en desarrollo).

## Scope

**In:**

- `lib/auth.ts`: `getSessionProfile()` interna envuelta en `React.cache()` — una sola resolución por request aunque el layout y la página la llamen. Verificación de sesión con `supabase.auth.getClaims()` (verificación local de JWT, igual que `proxy.ts`) en vez de `supabase.auth.getUser()` (roundtrip al servidor Auth). `getAuthenticatedUser` y `getAuthenticatedProfile` pasan a ser wrappers finos sobre la cache.
- `lib/auth.ts`: perfil enriquecido en una sola query `users` con embeds (`role`, `room_id`, `daycare_id`, `rooms(name)`, `daycares(name)`); el rol sale del token y, solo si no viene, de esa misma fila. `AuthenticatedProfile` se extiende (aditivo) con `roomId`, `daycareId`, `roomName`, `daycareName`.
- `app/staff/page.tsx`: el header usa el perfil cacheado (sin query propia de `users`/`rooms`/`daycares`); `children count` y `posts` en `Promise.all`; URLs firmadas después de `posts`.
- `app/familia/layout.tsx` + `app/familia/page.tsx`: helper cacheado `getFamilyLinks(parentId)` para que `parent_children` se consulte una sola vez por request (hoy se consulta dos veces, una en cada archivo); `parent_children` y `posts` en `Promise.all`; URLs firmadas después.
- `proxy.ts`: eliminar el redirect `/login` → home (redundante: `app/(auth)/login/page.tsx` ya valida con `getUser()` y redirige). Rompe el bucle `/login ↔ /` observado con cookies de sesión rancias.
- Verificación: mediciones antes/después con Playwright y el log de dev, contador temporal de fetch para validar el número de operaciones remotas (se retira al terminar), regresión E2E de login/logout y de los dos feeds, `pnpm lint` + `pnpm build`.

**Out of scope (para specs futuros):**

- Pantallas staff secundarias (`/staff/kids`, `/staff/kids/[slug]`, `/staff/equipo`, `/staff/crear-publicacion`, `/staff/agregar-nino`, `/staff/vincular-padre`) — están en ~270 ms y quedan como están.
- Caché persistente (`unstable_cache`, `use cache`) y caché de URLs firmadas.
- Cambios de base de datos, RLS, migraciones o backfill de `app_metadata.role`.
- Optimización de hidratación/cliente (el costo observado de ~500–900 ms es del modo dev y no viaja a producción).
- Tests automatizados (el proyecto no tiene framework de tests).

## Data model

Esta spec no introduce estructuras de datos nuevas ni toca la base de datos. Reutiliza `AuthenticatedProfile` de `lib/auth.ts`, extendido de forma aditiva:

```ts
// lib/auth.ts — solo se agregan campos; los existentes no cambian
export interface AuthenticatedProfile extends AuthenticatedUser {
  name: string;
  initials: string;
  role: UserRole;
  roleLabel: string;
  roomId: string | null;      // nuevo: sala del staff (null para admin/padres)
  daycareId: string | null;   // nuevo: guardería del perfil
  roomName: string | null;    // nuevo: nombre de la sala (para el header)
  daycareName: string | null; // nuevo: nombre de la guardería (para el header)
}
```

```ts
// lib/auth.ts — cache sin argumentos para compartir entre layout y página
const getSessionProfile = cache(async (): Promise<SessionProfile | null> => { /* getClaims + 1 query enriquecida */ });

export const getAuthenticatedUser = async (nextPath?: string): Promise<AuthenticatedUser> => { /* wrapper con redirect */ };
export const getAuthenticatedProfile = async (nextPath?: string): Promise<AuthenticatedProfile> => { /* wrapper con redirect */ };
```

```ts
// helper cacheado para los vínculos del padre (layout y página comparten resultado)
const getFamilyLinks = cache(async (parentId: string) => { /* parent_children + children + rooms */ });
```

Convenciones: los wrappers conservan la firma actual (`nextPath?`) y el comportamiento de redirect a `/login?next=`; `resolveUserRole` queda exportada sin cambios para `login` y `activate`.

## Implementation plan

1. `lib/auth.ts`: crear `getSessionProfile()` cacheada (claims vía `getClaims`, mapeo `sub`/`email`/`user_metadata`/`app_metadata`, una query `users` con embeds, rol token → fila → `parent`) y reescribir `getAuthenticatedUser`/`getAuthenticatedProfile` como wrappers sobre ella. Test manual: login → `/staff` y `/familia` renderizan igual; logout.
2. `app/staff/page.tsx`: eliminar las queries propias de perfil/sala/guardería y consumir el perfil enriquecido; `Promise.all([count, posts])`; URLs firmadas después. Test manual: el feed se ve idéntico (header, conteo, tarjetas, fotos).
3. `app/familia/layout.tsx` + `app/familia/page.tsx`: extraer `getFamilyLinks(parentId)` cacheado y usarlo en ambos; `Promise.all([links, posts])`; URLs firmadas después. Test manual: pills de hijos, sidebar con parentesco y feed idénticos.
4. `proxy.ts`: quitar el bloque del redirect `/login` → home (líneas 48–54 actuales). Test manual: usuario válido en `/login` → redirige a su home (lo hace la página); cookie rancia de usuario eliminado → `/login` muestra el formulario sin bucle.
5. Verificación: medir `/staff` y `/familia` en caliente (Playwright + log de dev) contra los baselines de esta spec; contador temporal de fetch en `utils/supabase/server.ts` para contar operaciones remotas por request (se retira después); regresión E2E de ambos feeds + login/logout + smoke de `/staff/kids`; `pnpm lint` + `pnpm build`.

## Acceptance criteria

- [x] `GET /staff` en caliente (log de dev, campo `application-code`) ≤ 450 ms; baseline medido el 2026-10-10: 781–808 ms.
- [x] `GET /familia` en caliente (log de dev, campo `application-code`) ≤ 350 ms; baseline medido el 2026-10-10: 378–464 ms.
- [x] `/staff` emite como máximo 4 operaciones remotas a Supabase por request: perfil enriquecido (1), conteo de niños + publicaciones en paralelo (2) y URLs firmadas (1); hoy son ~9. Verificado con contador temporal de fetch, retirado del código final.
- [x] `/familia` emite como máximo 4 operaciones remotas por request y `parent_children` se consulta exactamente una vez aunque lo usen layout y página.
- [x] `getAuthenticatedProfile()` se resuelve una sola vez por request aunque la llamen layout y página (contador temporal: la verificación de sesión no se repite por componente).
- [x] La verificación de sesión no agrega roundtrips de red por request con `getClaims`; si el proyecto cae al fallback de red por secreto simétrico, queda documentado en la sección de riesgos con la medición.
- [x] El feed de `/staff` (staff@opendaycare.com) se ve y funciona idéntico: header con sala/conteo/fecha, publicaciones agrupadas, fotos firmadas, composer.
- [x] El feed de `/familia` (madre.prueba@opendaycare.com) se ve y funciona idéntico: pills de hijos, publicaciones con sala y fotos.
- [x] Publicar una publicación nueva desde `/staff/crear-publicacion` y verla en ambos feeds sigue funcionando (regresión E2E).
- [x] Smoke sin cambios de comportamiento: `/staff/kids`, `/staff/kids/[slug]`, `/staff/equipo` (staff → redirect), `/login`, `/activate`.
- [x] Con una cookie de sesión válida de un usuario eliminado (usuario desechable creado y borrado en Dev), `/login` responde 200 con el formulario — sin `ERR_TOO_MANY_REDIRECTS` — y un login posterior funciona.
- [x] Un usuario autenticado válido que visita `/login` es redirigido a su home (ahora lo resuelve la página, ya no el proxy).
- [x] `pnpm lint` y `pnpm build` sin errores; consola sin errores ni warnings nuevos.
- [x] No hay cambios en `supabase/migrations/` ni en policies/RLS.

## Decisions

- **Sí:** alcance `/staff` + `/familia` + `lib/auth.ts` (decisión del usuario) — son lo sistémico (perfil duplicado y cascada); las pantallas secundarias en ~270 ms no lo justifican.
- **Sí:** `getClaims()` en páginas + `React.cache()` (decisión del usuario) — `getClaims` verifica la firma localmente (con JWKS) y el proxy ya lo usa; `cache()` garantiza una resolución por request entre layout y página.
- **Sí:** perfil enriquecido en una sola query — la fila `users` que hoy se consulta como fallback de rol se fusiona con los datos del header (`rooms`/`daycares`), eliminando queries secuenciales.
- **Sí:** fix del bucle quitando el redirect del proxy (decisión del usuario) — la página de login ya valida con `getUser()` y redirige; el redirect del proxy es lo único que puede ciclar cuando los claims son localmente válidos pero el usuario ya no existe.
- **Sí:** `Promise.all` para consultas independientes — `count`/`posts` y `links`/`posts` no dependen entre sí; las URLs firmadas sí dependen de `posts`.
- **Sí:** dedupe de `parent_children` con helper cacheado — layout y página piden lo mismo con distinto nivel de detalle; un solo resultado por request.
- **No:** caché persistente (`unstable_cache`/`use cache`) — agrega invalidación y staleness para un feed que debe verse en vivo; el problema era la cascada, no el cómputo.
- **No:** caché de URLs firmadas — expiran en 1 h y hay que regenerarlas por request de todos modos.
- **No:** tocar `resolveUserRole` — `login` y `activate` lo usan en flujos con `signIn`/`signUp` donde no aplica la cache.
- **No:** cambios de DB/RLS ni backfill de `app_metadata.role` — el fallback por fila sigue siendo la red de seguridad.
- **No:** instrumentación permanente de fetch — solo durante la verificación de esta spec.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `getClaims` con secreto simétrico cae a una llamada de red (igual que `getUser`) | Medir con el contador temporal; si ocurre, la mejora por dedupe/paralelismo se mantiene y la medición queda documentada. |
| `React.cache()` no comparta resultado entre layout y página en Next 16 | Verificar con contador de operaciones por request; leer `node_modules/next/dist/docs/` y Context7 antes de implementar. |
| Cambiar `getUser` → `getClaims` altera la semántica de la sesión (claims vs usuario existente) | El proxy ya confía en `getClaims`; criterios E2E de login/logout/guards; los guards por `public.users` siguen resolviendo con la fila. |
| Quitar el redirect de `/login` en el proxy cambia la UX de un usuario logueado | Criterio de aceptación: la página redirige igual con `getUser()` validado. |
| Medición en dev ruidosa (compilación, HMR) | Medir en caliente tras 2 visitas y comparar con el mismo método del baseline. |
| Usuarios con rol en el token ganan una query de perfil en `/` (dispatcher) | Es un redirect: ~110 ms una vez; aceptado a cambio de eliminar el fallback duplicado en `/staff` y `/familia`. |
| Next 16 / React 19 difieren de los datos de entrenamiento | Leer docs locales + Context7 antes de escribir código (AGENTS.md). |

## What is **not** in this spec

- Pantallas staff secundarias (`/staff/kids`, `/staff/kids/[slug]`, `/staff/equipo`, `/staff/crear-publicacion`, `/staff/agregar-nino`, `/staff/vincular-padre`).
- Caché persistente de datos o de URLs firmadas.
- Cambios de base de datos, RLS, migraciones o backfill de `app_metadata.role`.
- Optimización de hidratación/cliente (solo aplica al modo dev).
- Tests automatizados.

Cada uno de esos, si aterriza, va en su propio spec.
