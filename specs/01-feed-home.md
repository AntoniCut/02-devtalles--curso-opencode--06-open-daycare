# SPEC 01 — Home `/` con feed de maestra

> **Estado:** Approved
> **Depende de:** —
> **Fecha:** 2026-09-03
> **Objetivo:** Portar la maqueta `references/pantallas/feed.dc.html` a la ruta `/` del App Router con estilo idéntico, usando Tailwind y datos mock.

## Scope

**In:**

- Ruta `/` (`app/page.tsx`) con saludo de sala, composer (link a crear publicación), separador "PUBLICADO HOY" y los 3 posts del mockup (logro, actividad con placeholder de foto, anuncio).
- Componente compartido `components/sidebar.tsx` (logo, botón "Nueva publicación", nav con Feed activo, footer de usuario).
- Componente `components/post-card.tsx` que renderiza cada post según su tipo.
- Fuentes Fredoka + Nunito vía `next/font` en `app/layout.tsx`, metadata (title "OpenDayCare", `lang="es"`).
- Limpieza del boilerplate en `app/globals.css` (fondo `#F6ECDF`, texto `#3F362E`, scrollbar del mockup).
- Datos mock tipados en `lib/feed.ts` (usuario, sala, 3 posts).
- Todos los enlaces internos con `next/link` a las rutas futuras (`/crear-publicacion`, `/ninos`, `/avisos`, `/mi-cuenta`, `/detalle-publicacion`, `/foto`, `/login`).

**Out of scope (para specs futuras):**

- Las páginas destino de esos links (crear-publicacion, ninos, avisos, mi-cuenta, detalle-publicacion, foto, login).
- Autenticación, base de datos y API.
- Interactividad real (dar like, comentar, editar).
- Responsive móvil/tablet — la maqueta es desktop.
- Modo oscuro.

## Data model

```ts
// lib/feed.ts
export type PostType = "achievement" | "activity" | "announcement";

export type Post = {
  id: string;
  type: PostType;
  avatar?: { initial: string; background: string; color: string }; // "announcement" uses an icon instead
  title: string;        // "Mateo" | "Anuncio general"
  time: string;         // "14:20"
  authorLabel: string;  // "publicado por vos"
  recipient: string;    // "familia de Mateo" | "toda la sala"
  text: string;
  photoAlt?: string;    // si existe, se muestra el placeholder de foto
  likes: number;
  comments: number;
};

export const posts: Post[] = [/* los 3 posts del mockup */];
```

Identificadores (tipos, variables, funciones, props) en inglés según la regla de código limpio de `AGENTS.md`; los strings de UI se mantienen en español porque provienen del mockup.

El badge (texto y colores LOGRO/ACTIVIDAD/ANUNCIO) se deriva de `type` mediante un mapa dentro de `post-card.tsx`.

## Implementation plan

1. `app/layout.tsx`: cargar Fredoka y Nunito con `next/font`, reemplazar Geist, metadata y `lang="es"`.
2. `app/globals.css`: limpiar boilerplate de create-next-app; fondo, color de texto y scrollbar del mockup.
3. `lib/feed.ts`: tipos + mock data de los 3 posts (`posts`) y datos de usuario/sala, con identificadores en inglés.
4. `components/sidebar.tsx`: sidebar completo (Feed activo). Test manual: visible con `pnpm dev`.
5. `components/post-card.tsx`: tarjeta con badge por tipo, placeholder de foto condicional y footer de acciones.
6. `app/page.tsx`: reemplazar el boilerplate; componer sidebar + contenido (saludo, composer, separador, lista de posts).
7. Verificación visual con Playwright contra `references/screenshots/feed.png` + `pnpm lint` + `pnpm build`.

## Acceptance criteria

- [x] `/` renderiza el feed con sidebar fijo a la izquierda (248px, sticky) y contenido centrado (max-width 760px).
- [x] Títulos en Fredoka y resto en Nunito (verificable en DevTools).
- [x] Badges con colores exactos del mockup: LOGRO `#3E9B6C`, ACTIVIDAD `#2E89A6`, ANUNCIO `#4E72C8`.
- [x] El post ACTIVIDAD muestra el placeholder punteado con el texto "Foto · pintando con témperas".
- [x] Todos los enlaces internos usan `next/link` y apuntan a las rutas futuras indicadas.
- [x] La captura de `/` es visualmente idéntica a `references/screenshots/feed.png` (sin diferencias apreciables de layout o colores).
- [x] `pnpm lint` y `pnpm build` pasan sin errores.
- [x] La consola del navegador no muestra errores ni warnings de hidratación.

## Decisions

- **Sí:** Tailwind con valores arbitrarios (hex exactos del mockup). Ya está en el stack del proyecto.
- **Sí:** identificadores en inglés (tipos, variables, funciones, props) según la regla de código limpio de `AGENTS.md`. Los strings de UI quedan en español porque provienen del mockup.
- **No:** copiar los estilos inline del mockup. Mantenibilidad pobre y choca con la convención.
- **Sí:** `Sidebar` como componente compartido desde el día uno; lo reutilizarán ninos/avisos/mi-cuenta.
- **Sí:** `next/font` para Fredoka y Nunito, reemplazando Geist del boilerplate.
- **Sí:** `next/link` a rutas aún inexistentes (404 temporal hasta que lleguen sus specs).
- **No:** páginas placeholder "en construcción". Fuera de alcance.
- **No:** design tokens/CSS variables para la paleta todavía; primero portar fiel, tokens en un spec posterior.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Next 16 difiere de los datos de entrenamiento (`LayoutProps`, `next/font`) | Leer docs locales en `node_modules/next/dist/docs/` antes de escribir código (exigido por AGENTS.md). |
| Diferencias de rendering Tailwind vs inline (sombras, scrollbar) | Comparación visual con Playwright contra el screenshot; usar valores arbitrarios exactos. |

## What is **not** in this spec

- Implementar crear-publicacion, ninos, avisos, mi-cuenta, detalle-publicacion, foto, login.
- Autenticación, base de datos, persistencia.
- Interacciones (like, comentario, editar).
