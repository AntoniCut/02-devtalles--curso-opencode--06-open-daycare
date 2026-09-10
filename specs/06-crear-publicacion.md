# SPEC 06 — Pantalla `/crear-publicacion`

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-09-10
> **Objetivo:** Portar la maqueta `references/pantallas/crear-publicacion.dc.html` a la ruta `/crear-publicacion` como formulario funcional con chips de destinatarios y tipo, validación de requeridos y estilo idéntico.

## Scope

**In:**

- Ruta `/crear-publicacion` (`app/crear-publicacion/page.tsx`): página standalone (sin sidebar), tarjeta centrada (max-width 580px, `#FBF4EC`, borde `#ECE0D0`, radius 24px, sombra `0 20px 50px -24px rgba(63,54,46,.35)`) sobre fondo `#F6ECDF` (padding 40px 24px), con `metadata` propia. El sidebar ya enlaza acá (`components/sidebar.tsx:114`), igual que "Editar" del feed (`components/post-card.tsx:124`).
- Header de la tarjeta (padding 20px 26px, border-bottom `#ECE0D0`): "Cancelar" (`#94887B` bold 15px) a `/`, título "Nueva publicación" (Fredoka 600 18px `#3F362E`) y "Publicar" (`#D9583C` extrabold 15px) que envía el form.
- **PARA**: chips pill multi-select (radius 999px, avatar 26px, bold 14px) con los 3 primeros niños de `lib/kids.ts` — Mateo (`#A9D9E8`/`#1F7A93`), Sofía (`#F4B8CC`/`#C44A7A`), Benjamín (`#B9DEC4`/`#3E8B62`, primer nombre) — + "Toda la sala" sin avatar. Seleccionado: borde/fondo `#3F362E`, texto blanco; no seleccionado: `#ECE0D0`/`#FFFDF9`/`#6E6359`. **Mateo preseleccionado** (mockup). "Toda la sala" es excluyente: al activarlo deselecciona niños y viceversa.
- **TIPO**: 7 chips single-select (padding 8px 16px, extrabold 13.5px, colores fijos): Comida `#9A7B1E`/blanco, Siesta `#E7DCF6`/`#7B5FC0`, Actividad `#2E89A6`/blanco, Logro `#CFEBD8`/`#3E9B6C`, Ánimo `#F9D2DE`/`#C56486`, Foto `#FBD8CC`/`#D9684A`, Anuncio `#CCD8F4`/`#4E72C8`. Sin preselección (render inicial idéntico al mockup, que no muestra estado seleccionado); al clic queda seleccionado con anillo (borde `#3F362E`), uno a la vez.
- **DESCRIPCIÓN**: textarea precargada con el texto del mockup, min-height 120px, resize vertical, padding 14px 16px, radius 14px, borde 1.5px `#EADFD0`, 15px/1.5, placeholder `#B6A99B` "Contá cómo le fue hoy…".
- **FOTOS**: 2 tiles estáticos 96×96px radius 14px (gap 12px): tile con icono cámara `#CBB89F` (bg `#F4ECE1`, borde `#ECE0D0`) y tile "Agregar" dashed `#DBCDBA` con ícono + `#C5503A` y texto 12px `#B0A290`. Sin input file.
- **Validación al publicar**: descripción requerida (borde `#D9583C` + "Campo requerido" bajo el textarea) y tipo requerido (mensaje "Elegí un tipo" `#D9583C` bajo la sección TIPO); los errores se limpian al corregir. Válido → navega a `/`. "Cancelar" navega a `/` con `next/link`. PARA nunca falla (Mateo precargado).
- Labels de sección: 12px extrabold tracking `.7px` `#94887B`; grupos con gap 9px y margin-bottom 22px.

**Out of scope (para specs futuros):**

- Agregar la publicación al feed (requiere estado global de cliente).
- Subir fotos reales (input file, preview, persistencia) y API/auth.
- Cargar datos reales al entrar en modo "Editar" desde el feed.
- Responsive móvil/tablet y modo oscuro.

## Data model

```ts
// lib/feed.ts (agregado)
export type CreatePostTypeId = "meal" | "nap" | "activity" | "achievement" | "mood" | "photo" | "announcement";

export interface CreatePostTypeOption {
  id: CreatePostTypeId;
  label: string;      // "Comida", "Siesta"…
  background: string; // color fijo del chip
  color: string;      // color de texto
}
export const postTypeOptions: CreatePostTypeOption[] = [/* los 7 del mockup */];

// components/create-post-form.tsx (estado interno del form)
interface FormState {
  recipients: string[];            // slugs de kids, [] = "Toda la sala"; precarga ["mateo-fernandez"]
  wholeClass: boolean;             // false; true ↔ recipients vacío (excluyentes)
  typeId: CreatePostTypeId | null; // null hasta elegir
  description: string;             // texto precargado del mockup
}
interface FormErrors {
  typeId?: string;      // "Elegí un tipo"
  description?: string; // "Campo requerido"
}
```

Identificadores en inglés; strings de UI en español (mockup). No se modifica `PostType` ni el feed existente.

## Implementation plan

1. `lib/feed.ts`: exportar `postTypeOptions` con los 7 tipos (id en inglés, label/color del mockup). Test: `pnpm dev` compila sin errores.
2. `components/create-post-form.tsx` ("use client"): tarjeta completa — header (Cancelar `next/link` a `/`, título, Publicar submit), sección PARA (chips de `kids.slice(0, 3)` + "Toda la sala"), TIPO (7 chips), textarea precargada, tiles FOTOS estáticos. Test manual: `/crear-publicacion` idéntica a la maqueta.
3. Selección: PARA multi-select con exclusión mutua con "Toda la sala"; TIPO single-select con anillo `#3F362E` (sin preselección, sin toggle-off).
4. Validación en submit: descripción requerida (borde `#D9583C` + mensaje) y tipo requerido (mensaje bajo la sección); limpiar cada error al corregir; válido → `router.push("/")`.
5. `app/crear-publicacion/page.tsx`: wrapper centrado (`min-h-screen`, padding 40px 24px) + `metadata` "Nueva publicación · OpenDayCare" (patrón SPEC 03–05).
6. Verificación visual con Playwright contra `crear-publicacion.dc.html` renderizado (no existe screenshot PNG) + prueba manual de los 2 errores y del flujo válido → feed + `pnpm lint` + `pnpm build`.

## Acceptance criteria

- [x] `/crear-publicacion` renderiza la tarjeta centrada (max-w 580px, `#FBF4EC`, borde `#ECE0D0`, radius 24px, sombra) visualmente idéntica a `crear-publicacion.dc.html`.
- [x] Header: "Cancelar" (`#94887B` bold 15px) a la izquierda, "Nueva publicación" (Fredoka 600 18px) al centro y "Publicar" (`#D9583C` extrabold 15px) a la derecha, con border-bottom `#ECE0D0`.
- [x] PARA: 4 chips — Mateo preseleccionado (borde/fondo `#3F362E`, texto blanco, avatar 26px `#A9D9E8`/`#1F7A93`); Sofía, Benjamín y "Toda la sala" sin seleccionar (`#FFFDF9`/`#ECE0D0`/`#6E6359`).
- [x] Clic en un niño lo agrega a la selección (multi) y deselecciona "Toda la sala"; clic en un niño seleccionado lo quita.
- [x] Clic en "Toda la sala" lo selecciona y deselecciona a todos los niños.
- [x] TIPO: 7 chips con colores exactos (Comida `#9A7B1E`/blanco, Siesta `#E7DCF6`/`#7B5FC0`, Actividad `#2E89A6`/blanco, Logro `#CFEBD8`/`#3E9B6C`, Ánimo `#F9D2DE`/`#C56486`, Foto `#FBD8CC`/`#D9684A`, Anuncio `#CCD8F4`/`#4E72C8`).
- [x] Ningún TIPO preseleccionado; al clic queda seleccionado con anillo `#3F362E` y solo uno a la vez.
- [x] Textarea precargada con el texto del mockup; editable; placeholder `#B6A99B` "Contá cómo le fue hoy…" al vaciarla; min-height 120px, resize vertical.
- [x] FOTOS: tile de cámara `#CBB89F` y tile "Agregar" dashed `#DBCDBA` con ícono + `#C5503A` — estáticos, sin input file.
- [x] Submit con descripción vacía muestra borde `#D9583C` + "Campo requerido" bajo el textarea; **no** navega.
- [x] Submit sin tipo muestra "Elegí un tipo" `#D9583C` bajo la sección TIPO; **no** navega.
- [x] Al escribir en la descripción o elegir un tipo, desaparece su error.
- [x] Formulario válido → "Publicar" navega a `/`; "Cancelar" navega a `/` con `next/link`.
- [x] `metadata` propia ("Nueva publicación · OpenDayCare"); consola sin errores ni warnings de hidratación.
- [x] `pnpm lint` y `pnpm build` sin errores.

## Decisions

- **Sí:** ruta `/crear-publicacion` — el botón "Nueva publicación" del sidebar y "Editar" del feed ya apuntan ahí (decisión cerrada, sin spec nuevo de rutas).
- **Sí:** formulario client component con validación (decisión del usuario; patrón SPEC 04/05).
- **Sí:** chips PARA derivados de `lib/kids.ts` (primeros 3, primer nombre + colores de avatar — coinciden con el mockup) en vez de hardcodear.
- **Sí:** multi-select de niños con "Toda la sala" excluyente (decisión del usuario).
- **Sí:** TIPO single-select con anillo al clic y **sin preselección** — el mockup no muestra estado seleccionado; el render inicial queda idéntico.
- **Sí:** descripción precargada con el texto del mockup (fiel a la maqueta; el flujo válido exige vaciarla primero).
- **Sí:** FOTOS estáticos sin subida (decisión del usuario — sin persistencia no aporta valor).
- **No:** input file con preview — se aplaza junto con la persistencia.
- **No:** agregar el post al feed — requiere estado global de cliente que hoy no existe; su propio spec si aterriza.
- **No:** extender `PostType` — los ids de creación (`meal`, `nap`…) viven aparte para no tocar el modelo del feed.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| No hay screenshot PNG de esta pantalla | Comparar contra `crear-publicacion.dc.html` renderizado con Playwright (patrón SPEC 02–05). |
| Next 16 + React 19 difieren de los datos de entrenamiento | Leer `node_modules/next/dist/docs/` antes de escribir código (exigido por AGENTS.md). |
| "Publicar" es un `<a>` en el mockup | Usar `<button type="submit">` con el mismo estilo; el anillo de TIPO solo aparece tras interacción. |
| Body del root layout es `flex flex-col` | Wrapper `min-h-screen` propio de la página (patrón SPEC 03–05). |

## What is **not** in this spec

- Persistir la publicación y agregarla al feed.
- Subida de fotos real (input file, preview).
- API, autenticación.
- Carga de datos en modo edición desde el feed.
- Responsive móvil/tablet y modo oscuro.

Cada uno de esos, si aterriza, va en su propio spec.
