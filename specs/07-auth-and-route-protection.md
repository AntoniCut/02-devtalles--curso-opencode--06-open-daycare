# SPEC 07 — Autenticación email/password y protección de rutas

> **Estado:** Approved
> **Depende de:** SPEC 03, SPEC SUPABASE 02
> **Fecha:** 2026-09-12
> **Objetivo:** Conectar el login `/login` con Supabase Auth (`signInWithPassword`) y proteger todas las rutas de la app redirigiendo a `/login` cuando no hay sesión, con doble capa (proxy + páginas server).

## Scope

**In:**

- Server Action `app/(auth)/login/actions.ts` con `signInWithPassword` usando el server client (`utils/supabase/server.ts`); al éxito `redirect("/")`.
- Conversión del formulario de `/login` a Client Component con `useActionState`, manteniendo el estilo del mockup idéntico, con mensaje de error visible ("Email o contraseña incorrectos") cuando falla.
- Logout vía Server Action (`signOut` + `redirect("/login")`) con botón en el sidebar.
- Protección de rutas en `proxy.ts` (raíz): matcher que excluye `(auth)`, estáticos y favicon; refresco de sesión (`getClaims`) y redirect a `/login?next=...` si no hay sesión en rutas protegidas.
- Verificación en páginas server (defensa en profundidad): helper `lib/auth.ts` con `getAuthenticatedUser()` que llama `getUser()` y `redirect("/login")` si no hay usuario.
- Redirect de `/login` a `/` si ya hay sesión; si hay `?next=`, volver ahí tras loguear (validado: solo rutas internas).
- Redirección de `/` y sidebar usando el perfil real de `public.users` (nombre/avatar de Antonio Cutillas si entra el usuario de prueba).

**Out of scope (para specs futuros):**

- Activación de cuentas `/activate` (sigue mock estático; se excluye de la protección).
- "¿Olvidaste tu contraseña?" funcional, signup desde la UI, cambio de contraseña.
- Policies de RLS.
- Responsive, modo oscuro.

## Data model

No introduce tablas nuevas. Reutiliza `auth.users` y `public.users` de SPEC SUPABASE 02. Nuevos archivos: `app/(auth)/login/actions.ts`, `app/(auth)/login/login-form.tsx`, `lib/auth.ts`, `proxy.ts` (raíz), y botón de logout en `components/sidebar.tsx`.

## Implementation plan

1. `proxy.ts` en la raíz (export `proxy`, matcher estándar) con protección + redirect a `/login?next=`. Test: visita `/` sin sesión → redirect a `/login`.
2. `lib/auth.ts` con `getAuthenticatedUser()`. Wire en páginas protegidas. Test: acceder directo a `/` sin sesión → `/login`.
3. `app/(auth)/login/actions.ts` (Server Action `signInWithPassword`) + `login-form.tsx` (Client Component, `useActionState`, estado de error). Reemplazar el Link CTA por el formulario, estilo idéntico.
4. Redirect de usuario autenticado que visita `/login` → `/`, y soporte de `?next=`.
5. Logout: Server Action + botón en el sidebar.
6. Verificación con Playwright (login real con `staff@opendaycare.com` / `Test1234!`, acceso sin sesión, logout) + `pnpm lint` + `pnpm build`.

## Acceptance criteria

- [ ] Visitar `/` sin sesión redirige a `/login` (proxy).
- [ ] `staff@opendaycare.com` / `Test1234!` inicia sesión y aterriza en `/`.
- [ ] Credenciales inválidas muestran mensaje de error en el formulario sin perder el estilo del mockup.
- [ ] Usuario autenticado que visita `/login` es redirigido a `/`.
- [ ] Tras logout, volver a `/` redirige a `/login`.
- [ ] `/activate` sigue accesible sin sesión.
- [ ] `pnpm lint` y `pnpm build` sin errores; consola sin errores.

## Decisions

- **Sí:** Server Action para login/logout (patrón oficial de la doc de `@supabase/ssr` para App Router); no Client Component con browser client.
- **Sí:** doble capa de protección: proxy (rápido, refresca sesión) + `getUser()` en páginas server (la doc recomienda no confiar solo en el proxy).
- **Sí:** logout incluido en este spec.
- **No:** tocar `/activate` — es otro spec.

## What is **not** in this spec

- Activación de cuentas funcional (`/activate`).
- Recuperación de contraseña, signup desde la UI, cambio de contraseña.
- Policies de RLS.
- Responsive y modo oscuro.

Cada uno de esos, si aterriza, va en su propio spec.
