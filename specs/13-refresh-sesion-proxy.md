# SPEC 13 — Refresco de sesión del proxy: propagar las cookies nuevas al navegador

> **Estado:** Implementado
> **Depende de:** SPEC 07, SPEC 12
> **Fecha:** 2026-10-10
> **Objetivo:** Hacer que `proxy.ts` devuelva siempre la respuesta vigente del refresco de sesión de Supabase (hoy devuelve una copia previa) y que sus cookies y cache headers lleguen al navegador.

## Why this spec exists

Bug detectado durante la SPEC 12 (`specs/12-rendimiento-pantallas.md`, sección Risks) al medir el refresco de sesión del proxy:

- `proxy.ts:27` destructura `{ supabase, response: supabaseResponse }` **antes** del refresh.
- Cuando `getClaims()` refresca el token, `setAll` (`utils/supabase/proxy.ts:35-43`) reasigna `supabaseResponse` a un `NextResponse` nuevo y setea ahí las cookies.
- `utils/supabase/proxy.ts:48` devuelve `{ supabase, response: supabaseResponse }`: la propiedad se evalúa al construir el objeto, así que queda apuntando al response viejo.
- `proxy.ts:81` retorna esa copia vieja y el `Set-Cookie` del refresh nunca llega al navegador.

El patrón oficial de `@supabase/ssr` mantiene `supabaseResponse` como variable `let` en el mismo scope donde se llama `getClaims()` y devuelve esa variable al final; al extraerlo a `utils/supabase/proxy.ts` se perdió esa lectura tardía.

Síntoma medido: cada request con token vencido paga un refresh de red y el navegador conserva el token viejo, así que el ciclo se repite en cada request (proxy 90–294 ms vs 4–6 ms con sesión fresca).

En el mismo camino de código hay dos fugas hermanas:

- `setAll(cookiesToSet)` ignora el segundo argumento `headers` que `@supabase/ssr` 0.12.7 entrega para aplicar a la respuesta (`Cache-Control: private, no-cache, no-store...`, `Expires: 0`, `Pragma: no-cache`); sin ellos una CDN podría cachear una respuesta con cookies de sesión.
- Los redirects de `proxy.ts` (login, dispatcher de `/`, guards de sección) crean `NextResponse.redirect(url)` nuevos y descartan las cookies del refresh ya aplicadas a `supabaseResponse`.

## Scope

**In:**

- `utils/supabase/proxy.ts`: `ProxyClient.response` pasa a ser un getter que devuelve siempre la respuesta vigente; `setAll(cookiesToSet, headers)` aplica el segundo argumento a la respuesta.
- `proxy.ts`: dejar de destructurar `response` antes del refresh (guardar el cliente y leer `client.response` después de `getClaims()` y de los guards); en los tres redirects, copiar las cookies vigentes y los cache headers antes de retornar.
- Verificación: E2E con Playwright por cookie surgery (quitar `access_token` del cookie de sesión conservando `refresh_token`), medir antes/después, regresión de login/logout/guards y Server Actions POST, `pnpm lint` + `pnpm build`.

**Out of scope (para specs futuros):**

- `utils/supabase/server.ts` y consumo de sesión en páginas/Server Actions (los Server Components no escriben cookies; el proxy es el único writer del refresh).
- Cambios de Auth settings, JWT expiry o rotación de tokens.
- Caché de sesión (JWKS/claims) e instrumentación permanente de refresh.
- Cambios de base de datos, RLS o migraciones.
- Tests automatizados (el proyecto no tiene framework).

## Data model

No introduce estructuras de datos ni toca la base de datos. Cambia el contrato interno de `utils/supabase/proxy.ts`:

```ts
interface ProxyClient {
  supabase: ReturnType<typeof createServerClient>;
  /** - getter: siempre la respuesta vigente (la reasigna setAll durante el refresh) */
  readonly response: NextResponse;
}
```

Convención de consumo en `proxy.ts`:

```ts
const client = createClient(request);
// ... getClaims() y guards (pueden disparar un refresh) ...
return client.response; // se lee DESPUÉS, nunca se destructura antes
```

## Implementation plan

1. `utils/supabase/proxy.ts`: devolver `{ supabase, get response() { return supabaseResponse; } }` manteniendo la reasignación de `setAll`. Test manual: `/staff` y `/familia` con sesión válida renderizan igual.
2. `utils/supabase/proxy.ts`: `setAll(cookiesToSet, headers)` aplica los headers de la librería a la respuesta vigente. Test manual: con un refresh disparado, la respuesta incluye `Cache-Control: private, no-cache, no-store, must-revalidate, max-age=0`.
3. `proxy.ts`: `const client = createClient(request)` sin destructurar; reemplazar el retorno por `client.response`. Test manual: sin sesión, ruta protegida → `/login?next=`; con sesión, guards igual que hoy.
4. `proxy.ts`: helper interno que copia a la respuesta de redirect las cookies (`getAll()` + `set(name, value, options)`) y los cache headers de `client.response`; aplicarlo en los tres redirects (login, dispatcher `/`, guards). Test manual: con refresh pendiente, `/` responde 307 con `Set-Cookie` de auth.
5. Verificación: cookie surgery en Playwright (soporte de chunks `sb-<ref>-auth-token`), asserts de `Set-Cookie`/headers/medición, regresión E2E, `pnpm lint` + `pnpm build`.

## Acceptance criteria

- [x] Con `access_token` removido del cookie de sesión y `refresh_token` válido, la respuesta a `/staff` incluye `Set-Cookie` con la sesión nueva; hoy no incluye ninguno.
- [x] La respuesta con el refresco incluye `Cache-Control: private, no-cache, no-store, must-revalidate, max-age=0`, `Expires: 0` y `Pragma: no-cache`.
- [x] Después del refresco, una segunda request a `/staff` en la misma sesión no emite `Set-Cookie` de auth y el tiempo del proxy vuelve al rango fresco (~4–6 ms; baseline medido con token vencido: 90–294 ms).
- [x] Un redirect del proxy con refresco pendiente (`/` → home, guard de sección, `/login?next=` sin sesión) incluye en el 307 las cookies refrescadas y los cache headers.
- [x] Con sesión fresca, login, logout y guards sin cambios de comportamiento (staff → `/staff`, padre → `/familia`, no autenticado → `/login?next=`).
- [x] Un Server Action POST no es redirigido por el proxy (comportamiento actual) y, si refresca, su respuesta conserva las cookies nuevas.
- [x] No hay cambios en `utils/supabase/server.ts` ni en páginas/Server Actions.
- [x] `pnpm lint` y `pnpm build` sin errores; consola sin errores ni warnings nuevos.
- [x] No hay cambios en `supabase/migrations/`, RLS ni base de datos.

## Decisions

- **Sí:** getter `get response()` en `ProxyClient` (decisión del usuario) — diff mínimo; `proxy.ts` no gana conocimiento del manejo de cookies y el helper sigue siendo el dueño de la respuesta, pero la lee tarde.
- **Sí:** aplicar los `headers` de `setAll` (decisión del usuario) — la librería 0.12.7 los entrega para que las respuestas con cookies de auth no se cacheen (riesgo de servir la sesión de un usuario a otro); hoy se descartan.
- **Sí:** copiar cookies y cache headers a los redirects del proxy (decisión del usuario) — sin esto, todo request que refresca y además redirige pierde el refresh y repite el ciclo.
- **Sí:** verificación por cookie surgery (decisión del usuario) — determinista, sin tocar Auth settings de Dev ni esperar 1 h de expiración.
- **No:** reescribir el patrón oficial inline en `proxy.ts` — contradice AGENTS.md (`utils/supabase/proxy.ts` se usa desde `proxy.ts`) y agranda el diff sin beneficio.
- **No:** tocar `utils/supabase/server.ts` — los Server Components no pueden escribir cookies; el proxy es el único writer del refresh.
- **No:** instrumentación permanente o tests automatizados — no hay framework de tests.
- **No:** cambios de base de datos/RLS/migraciones.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Leer `client.response` por accidente antes del refresh (destructuring temprano) | El call site guarda el cliente completo y lee la propiedad al final; el criterio E2E de `Set-Cookie` detecta la regresión. |
| `NextResponse.redirect` no expone `cookies.setAll` en Next 16.3.3 (no está en los tipos) | Copiar cookie por cookie con `getAll()` + `set(name, value, options)` y los headers con `headers.set()`. |
| El cookie de sesión viene chunked y la cirugía lo reconstruye mal | Iterar `sb-<ref>-auth-token` y sus chunks `.N`; usar contexto de Playwright desechable y limpiar al terminar. |
| Los cache headers `no-store` afectan algo legítimamente cacheable | Solo se aplican a respuestas que setean cookies de auth (así lo define la librería); el resto no cambia. |
| El refresh sin `access_token` depende del comportamiento de `@supabase/ssr` 0.12.7 | El flujo ya ocurre hoy (90–294 ms medidos); el E2E lo confirma contra la versión instalada. |
| Next 16 / React 19 difieren de los datos de entrenamiento | Leer `node_modules/next/dist/docs/` y Context7 antes de escribir código (AGENTS.md). |

## What is **not** in this spec

- `utils/supabase/server.ts`, páginas y Server Actions.
- Cambios de Auth settings, JWT expiry o rotación de tokens.
- Caché de sesión (JWKS/claims) e instrumentación permanente.
- Base de datos, RLS y migraciones.
- Tests automatizados.

Cada uno de esos, si aterriza, va en su propio spec.
