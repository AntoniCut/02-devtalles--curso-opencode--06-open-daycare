# SPEC 02 — Pantallas `/kids` y `/kids/[slug]`

> **Estado:** Approved
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-04
> **Objetivo:** Portar las maquetas `references/pantallas/ninos.dc.html` y `references/pantallas/perfil-nino.dc.html` a las rutas `/kids` y `/kids/[slug]` con estilo idéntico, Tailwind y datos mock.

## Scope

**In:**

- Ruta `/kids` (`app/kids/page.tsx`): cabecera GESTIÓN/Niños, botón "Agregar niño", buscador y grid de 8 tarjetas de niños.
- Buscador funcional: filtra por nombre (case-insensitive) en cliente y actualiza el contador "N niños".
- Ruta dinámica `/kids/[slug]` (`app/kids/[slug]/page.tsx`): perfil con avatar, botón Editar, tarjeta de alergias (condicional), tabla nacimiento/sala/ingreso, botón "Resumen del día" y tarjeta PADRES VINCULADOS con badges ACTIVA/PENDIENTE.
- `notFound()` (404 por defecto) para slugs que no existen.
- Componentes `components/kid-card.tsx` (tarjeta con hover y badge/chevron) y `components/kids-browser.tsx` (client component con búsqueda + grid).
- Datos mock tipados en `lib/kids.ts`: los 8 niños del mockup con datos de perfil completos.
- Actualización de `components/sidebar.tsx`: link "Niños" → `/kids` y estado activo por prefijo (activo también en el perfil).
- `generateMetadata` en el perfil con el nombre del niño.

**Out of scope (para specs futuros):**

- Páginas destino de los links: `/agregar-nino`, `/resumen-dia`, `/vincular-padre` (y `/avisos`, `/mi-cuenta`, `/crear-publicacion`, `/login`).
- Autenticación, base de datos y API.
- Alta/edición real de niños, vinculación real de padres.
- Responsive móvil/tablet — la maqueta es desktop.
- Modo oscuro.

## Data model

```ts
// lib/kids.ts
export type ParentStatus = "active" | "pending";

export interface LinkedParent {
  name: string;         // "Lucía Fernández"
  relation: string;     // "Mamá" | "Papá"
  status: ParentStatus; // badge ACTIVA | PENDIENTE
  initial: string;
  background: string;
  color: string;
}

export interface KidTag {
  label: string;              // "MANÍ" | "LACTOSA" | "VINCULAR"
  variant: "alert" | "invite"; // mapa de colores dentro de kid-card.tsx
}

export interface Kid {
  slug: string;          // "mateo-fernandez" (explícito, sin slugify en runtime)
  name: string;
  age: string;           // "3 años"
  initial: string;
  background: string;    // colores del avatar circular
  color: string;
  tag?: KidTag;          // si no existe, se muestra el chevron ">"
  allergyNote?: string;  // si existe, se muestra la tarjeta roja de alergias
  birthDate: string;     // "12 mar 2022"
  classroom: string;     // "Soles"
  entry: string;         // "feb 2025"
  parents: LinkedParent[];
}

export const kids: Kid[] = [/* los 8 niños del mockup */];
```

Los datos de Mateo salen de `perfil-nino.dc.html` (alergia al maní, 12 mar 2022, feb 2025, Lucía ACTIVA + Diego PENDIENTE); el resto de los niños se completa con datos mock coherentes con su tarjeta (Tomás con nota de lactosa, Valentina con `parents: []`, etc.).

Identificadores en inglés; strings de UI en español (provienen del mockup), igual que en SPEC 01.

## Implementation plan

1. `lib/kids.ts`: tipos + mock de los 8 niños con `slug` explícito.
2. `components/kid-card.tsx`: `next/link` a `/kids/{slug}`, avatar, badge condicional o chevron, hover (borde `#F2A78E` + `translateY(-2px)`, transición 150ms).
3. `components/kids-browser.tsx` ("use client"): input de búsqueda, filtrado case-insensitive por nombre, contador con resultados y grid de 2 columnas.
4. `app/kids/page.tsx`: cabecera + "Agregar niño" + `KidsBrowser`; metadata. Test manual con `pnpm dev`.
5. `components/sidebar.tsx`: `href` "Niños" → `/kids`; activo = `href === "/" ? pathname === "/" : pathname.startsWith(href)`.
6. `app/kids/[slug]/page.tsx`: `const { slug } = await params` (Next 16: params es Promise, revisar docs locales antes), `notFound()` si no matchea, `generateMetadata`, layout del perfil completo.
7. Verificación visual con Playwright (`/kids` vs `references/screenshots/ninos.png`; perfil vs maqueta HTML renderizada, pues no existe screenshot PNG del perfil) + `pnpm lint` + `pnpm build`.

## Acceptance criteria

- [x] `/kids` renderiza sidebar (248px, sticky) y contenido centrado (max-width 880px); captura visualmente idéntica a `references/screenshots/ninos.png`.
- [x] Grid de 2 columnas con las 8 tarjetas; badges MANÍ y LACTOSA (`#FBD8CC`/`#D9684A`), VINCULAR (`#F9D2DE`/`#C56486`), resto con chevron `#CBB89F`.
- [x] Hover en tarjeta: borde `#F2A78E` y desplazamiento -2px.
- [x] Escribir en "Buscar niño…" filtra por nombre y actualiza el contador; al vaciar vuelven los 8.
- [x] Cada tarjeta navega con `next/link` a `/kids/{slug}` (ej. `/kids/mateo-fernandez`); `/kids/inexistente` da 404.
- [x] `/kids/[slug]` es visualmente idéntico a `perfil-nino.dc.html`: avatar 84px, Editar, tarjeta de alergias, tabla de datos, columna 300px con "Resumen del día", PADRES VINCULADOS (ACTIVA `#CFEBD8`/`#3E9B6C`, PENDIENTE `#F7E7A6`/`#9A7B1E`), "Vincular otro padre".
- [x] La tarjeta roja de alergias solo se muestra si `allergyNote` existe; la lista de padres refleja el mock de cada niño.
- [x] "Volver a Niños" navega a `/kids`; el ítem Niños del sidebar queda activo en `/kids` y en `/kids/[slug]`.
- [x] Links internos con `next/link` a rutas futuras: `/agregar-nino`, `/resumen-dia`, `/vincular-padre`.
- [x] `pnpm lint` y `pnpm build` sin errores; consola sin errores ni warnings de hidratación.

## Decisions

- **Sí:** `/kids/[slug]` con slug = nombre en kebab-case sin acentos, campo explícito en el mock (sin slugify en runtime).
- **Sí:** actualizar el sidebar en este spec (link `/kids` + activo por prefijo); sin ello el flujo de navegación quedaría roto.
- **Sí:** buscador con filtrado en cliente (`KidsBrowser` como client component); el contador refleja los resultados filtrados.
- **Sí:** datos mock completos para los 8 niños — cualquier tarjeta funciona.
- **Sí:** `notFound()` para slugs inválidos (404 por defecto de Next).
- **No:** `/kids/[id]` — menos legible y el usuario definió slug = nombre.
- **No:** derivar el badge VINCULAR de `parents.length === 0` — explícito en el mock, fiel al mockup y sin lógica extra.
- **No:** generar `references/screenshots/perfil-nino.png` — la comparación del perfil se hace contra la maqueta HTML renderizada.
- **No:** páginas agregar-nino / resumen-dia / vincular-padre — out of scope.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Next 16 difiere de los datos de entrenamiento (`params` como Promise) | Leer `node_modules/next/dist/docs/` antes de escribir código (exigido por AGENTS.md). |
| Primer client component con estado del proyecto | Filtrado determinístico (sin `Date` ni `Math.random`) para evitar mismatches de hidratación. |
| Perfil sin screenshot PNG de referencia | Comparar contra `perfil-nino.dc.html` renderizado con Playwright. |

## What is **not** in this spec

- Implementar agregar-nino, resumen-dia, vincular-padre, avisos, mi-cuenta, crear-publicacion, login.
- Autenticación, base de datos, persistencia.
- Alta/edición real de niños y vinculación de padres.
