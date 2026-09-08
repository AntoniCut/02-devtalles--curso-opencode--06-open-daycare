# SPEC 03 — Login `/login` y activación `/activate`

> **Estado:** Aprovado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-08
> **Objetivo:** Portar las maquetas `references/pantallas/login.dc.html` y `references/pantallas/activar-cuenta.dc.html` a las rutas `/login` y `/activate` (route group `(auth)`) con estilo idéntico, sin el selector Personal/Familia del login.

## Scope

**In:**

- Ruta `/login` (`app/(auth)/login/page.tsx`): layout de dos columnas (1.05fr/1fr), panel izquierdo con gradiente `#F6A98E→#EC7E62`, círculos decorativos, logo OpenDayCare, titular y footer "🌿 Guardería Sala Soles"; formulario a la derecha con email prellenado, contraseña, link "¿Olvidaste tu contraseña?" (estático) y CTA "Iniciar sesión".
- **Sin** selector "INGRESO COMO" (Personal/Familia) — eliminado por decisión del usuario; el CTA lleva directo a `/`.
- Ruta `/activate` (`app/(auth)/activate/page.tsx`): logo con gradiente, tarjeta de invitación (Mateo · Sala Soles), inputs prellenados (código 7K4P9, email, contraseña), checkbox de autorización estático marcado y CTA "Activar mi cuenta".
- Ambas páginas standalone (sin sidebar), server components, con `metadata` propia.
- Enlaces internos con `next/link`: `/login` → `/` y `/activate`; `/activate` → `/parent-feed` (404 temporal) y `/login`.

**Out of scope (para specs futuros):**

- La pantalla `/parent-feed` (familia-feed) y el resto de pantallas pendientes.
- Autenticación, base de datos, API, validación de formularios y estados de error.
- "¿Olvidaste tu contraseña?" funcional (en la maqueta es un span sin href).
- Responsive móvil/tablet — la maqueta es desktop.
- Modo oscuro.

## Data model

Esta feature no introduce nuevas estructuras de datos. No se crea archivo en `lib/`: los valores mock son triviales y estáticos, inline en cada página (`defaultValue` email `caro@opendaycare.com`; código `7K4P9`; email `lucia.fernandez@gmail.com`; contraseña con placeholder).

Identificadores en inglés; strings de UI en español (provienen del mockup), igual que en SPEC 01/02.

## Implementation plan

1. `app/(auth)/login/page.tsx`: layout de dos columnas, panel gradiente con logo/titular/footer y formulario (email prellenado, contraseña, "¿Olvidaste tu contraseña?", CTA `next/link` a `/`, "Activá tu cuenta" → `/activate`). Sin el bloque INGRESO COMO. Metadata. Test manual con `pnpm dev`.
2. `app/(auth)/activate/page.tsx`: logo 58px con gradiente y sombra, titular, tarjeta de invitación, inputs prellenados, checkbox estático marcado, CTA `next/link` a `/parent-feed`, "Iniciar sesión" → `/login`. Metadata.
3. Verificación visual con Playwright contra las maquetas renderizadas (`login.dc.html` y `activar-cuenta.dc.html`; no existen screenshots PNG) + `pnpm lint` + `pnpm build`.

## Acceptance criteria

- [ ] `/login` renderiza sin sidebar: dos columnas, panel gradiente con círculos decorativos, logo 46px, titular Fredoka 42px y footer "Guardería Sala Soles".
- [ ] `/login` NO muestra el selector "INGRESO COMO" (Personal/Familia).
- [ ] Email prellenado con `caro@opendaycare.com`; contraseña vacía con placeholder "••••••••".
- [ ] "Iniciar sesión" navega a `/` y "Activá tu cuenta" a `/activate`, ambos con `next/link`.
- [ ] `/activate` renderiza logo 58px con gradiente y sombra, tarjeta de invitación con avatar "M" (`#A9D9E8`/`#1F7A93`) y "Mateo · Sala Soles".
- [ ] Código de invitación prellenado `7K4P9` (Fredoka, letter-spacing 3px), email `lucia.fernandez@gmail.com`, contraseña con borde `#F2A78E`.
- [ ] Checkbox de autorización estático y marcado: caja `#5FB97E`, fondo `#FBF1D6`, texto `#8A7234`.
- [ ] "Activar mi cuenta" navega a `/parent-feed` (404 temporal) e "Iniciar sesión" a `/login`, con `next/link`.
- [ ] Ambas páginas son visualmente idénticas a sus maquetas HTML renderizadas.
- [ ] `pnpm lint` y `pnpm build` sin errores; consola sin errores ni warnings de hidratación.

## Decisions

- **Sí:** route group `app/(auth)/` para agrupar pantallas de autenticación; rutas `/login` y `/activate` (decisión explícita del usuario). Sin layout propio del grupo: no comparten nada más allá de las fuentes globales.
- **Sí:** eliminar el selector Personal/Familia del login (decisión del usuario); el CTA va directo a `/`.
- **Sí:** CTA "Activar mi cuenta" → `/parent-feed`, ruta futura con 404 temporal (mismo patrón que SPEC 01).
- **Sí:** inputs con `defaultValue` del mockup, sin validación ni estados de error (mock estático).
- **Sí:** checkbox estático marcado (server component); la interactividad de formularios llega con auth.
- **No:** archivo en `lib/` — los datos son estáticos y triviales, inline en cada página.
- **No:** portar el selector INGRESO COMO "por si acaso" — el usuario lo excluyó explícitamente.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Convenciones de route groups en Next 16 difieren de datos de entrenamiento | Leer `node_modules/next/dist/docs/` antes de escribir código (exigido por AGENTS.md). |
| No hay screenshots PNG de estas pantallas | Comparar contra las maquetas `.dc.html` renderizadas con Playwright (mismo enfoque que SPEC 02 con el perfil). |
| El body del root layout es `flex flex-col` | Envolver cada página en un wrapper `min-h-screen` y verificar en la comparación visual. |

## What is **not** in this spec

- Implementar `/parent-feed` o cualquier otra pantalla pendiente.
- Autenticación, persistencia, validación de formularios.
- "¿Olvidaste tu contraseña?" funcional.

Cada uno de esos, si aterriza, va en su propio spec.
