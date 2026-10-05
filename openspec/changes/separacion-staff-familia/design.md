# Design

## Context

Ver `proposal.md` para la motivación. Estado actual relevante:

- Todas las pantallas viven en la raíz (`/`, `/kids`, `/agregar-nino`, `/vincular-padre`, `/crear-publicacion`, `/pokemon`) y renderizan `components/sidebar.tsx` (staff) página por página.
- `proxy.ts` solo valida sesión; `app/(auth)/login/actions.ts` y `app/(auth)/activate/actions.ts` redirigen a `/`.
- `lib/auth.ts` arma la etiqueta de rol desde `user_metadata.role` (editable por el usuario, no confiable).
- `handle_new_user` escribe `public.users.role` desde `raw_app_meta_data.role` (solo service role) con default `parent`.
- La RLS ya limita lo que ve un padre: posts etiquetados a sus hijos + anuncios de su sala, sus niños y sus vínculos en `parent_children`.

## Goals / Non-Goals

**Goals:**

- Separar rutas, shells y acceso por audiencia (staff/admin vs. familia) sin tocar la base de datos.
- Portar el feed de familia con datos reales, fiel a `familia-feed.dc.html` salvo los contadores.

**Non-Goals:**

- Contadores de reacciones/comentarios, resumen del día, mi cuenta, detalle de publicación y visor de foto (changes futuros).
- Distinguir un panel de admin aparte: admin usa la sección de staff.
- Redirects de URLs anteriores.
- Cambios de esquema: no hay migraciones.

## Decisions

### 1. Prefijos `/staff/*` y `/familia/*` con layouts propios

Cada audiencia tiene su carpeta (`app/staff/`, `app/familia/`) y su `layout.tsx` con la barra lateral. Se descartaron los route groups sin prefijo (no permiten dos raíces `/` distintas) y el shell condicional por rol (sin separación real de URLs ni layouts). Los slugs existentes se conservan; los de familia siguen los nombres de las maquetas (`/familia`, futuro `/familia/resumen-dia`, `/familia/mi-cuenta`).

```
/                      -> redirect por rol
/staff                 -> feed staff        (app/staff/layout.tsx)
/staff/kids, /staff/kids/[slug], /staff/agregar-nino,
/staff/vincular-padre, /staff/crear-publicacion, /staff/pokemon,
/staff/avisos*, /staff/mi-cuenta*            (* 404 por ahora)
/familia               -> feed de familia    (app/familia/layout.tsx)
/familia/resumen-dia*, /familia/mi-cuenta*   (* 404 por ahora)
```

### 2. Guards de rol en dos capas con fuentes confiables

- Proxy: lee `claims.app_metadata.role` (solo service role lo escribe) y redirige cruces sin query a la DB.
- Layouts/páginas server: verifican con `public.users.role` (la RLS permite el self-select) como defensa en profundidad, mismo patrón del spec 07.
- `user_metadata` no autoriza nada. Si el token no trae `app_metadata.role`, el proxy no bloquea y la capa de DB resuelve el rol.
- El proxy mantiene las reglas actuales: `PUBLIC_PATHS` y no redirigir requests de Server Actions (`next-action`).

### 3. Dispatcher de `/` y redirects de autenticación

`/` redirige en el proxy según rol y además `app/page.tsx` queda como fallback server que hace el mismo redirect. Login y activación resuelven el rol y redirigen al home del rol; un `?next=` se respeta solo si apunta a la sección del usuario (si no, home del rol). `getAuthenticatedProfile` pasa a leer el rol de `app_metadata` y expone el rol crudo además de la etiqueta.

### 4. Split del sidebar y shells

- `components/staff-sidebar.tsx`: el sidebar actual (Sala Soles, botón "Nueva publicación", nav Feed/Niños/Pokémon/Avisos/Mi cuenta) con enlaces bajo `/staff`.
- `components/family-sidebar.tsx`: nuevo (subtítulo "Familia", nav Feed/Resumen del día/Mi cuenta, sin botón, usuario con parentesco).
- Iconos compartidos en un módulo común para no duplicarlos.
- Cada `layout.tsx` renderiza su sidebar; las páginas dejan de importarlo.

### 5. Feed de familia con datos reales

- Página server `/familia`: consulta los posts visibles por RLS (mismo select que el feed staff con autor, niños y fotos; URLs firmadas del bucket privado) y los hijos del padre vía `parent_children` join `children` (con `relationship`).
- Pills de hijo + "Todos" como componente client con estado local: el servidor entrega todo lo visible y el filtro no vuelve al servidor (más simple y sin round trips; el volumen por familia es acotado).
- Regla del filtro: hijo seleccionado → posts etiquetados a ese hijo + anuncios de su sala; "Todos" → todo lo visible (incluye anuncios).
- Card nuevo (`components/family-post-card.tsx`): nombre del niño o "Anuncio general", hora, "Maestra {autor} · Sala {sala}", badge de tipo en español, cuerpo y fotos (reutilizando el carrusel existente). Sin contadores.
- Separador de día en formato "HOY · MARTES 17 JUN": se agrega un formateador de familia en `lib/posts.ts` y el agrupado existente se parametriza o se agrega su variante; misma zona horaria de la guardería.
- Sidebar de familia con parentesco: "{parentesco} de {hijo}" (`mother` → Mamá, `father` → Papá, `guardian` → Tutor/a). Con varios hijos se muestran hasta dos nombres y "+N".

### 6. Sin redirects legacy

Las rutas viejas no redirigen: 404. Todos los enlaces internos (~25 referencias en 15 archivos, incluidos actions con `redirect(...)`) se actualizan al prefijo `/staff`; los destinos futuros quedan dentro de su sección (`/staff/resumen-dia`, `/staff/avisos`, `/staff/mi-cuenta`, `/familia/resumen-dia`, `/familia/mi-cuenta`).

## Risks / Trade-offs

- [Claims desactualizados si cambia el rol en DB] → los layouts/páginas verifican contra `public.users`; el rol casi no cambia en la práctica.
- [Tokens sin `app_metadata.role`] → el proxy no bloquea; la capa DB resuelve y redirige igual.
- [Redirects en requests de Server Actions] → se mantiene la regla existente de no redirigir cuando hay `next-action`.
- [Enlaces internos olvidados tras el cambio de URLs] → grep de `href`/`redirect` + recorrido con Playwright por ambas secciones.
- [Desvío visual por contadores omitidos] → documentado en los specs; el resto del feed es fiel a la maqueta.
- [Duplicación entre sidebars] → shells chicos; iconos y piezas compartidas en módulos comunes.
- [Filtro client-side carga todos los posts visibles] → mismo límite (50) que el feed staff; el volumen familiar es bajo.
- [Cambio de URLs sin redirects] → decisión explícita; no hay usuarios externos y todos los enlaces internos se actualizan.

## Migration Plan

Cambio solo de código, sin migraciones de datos:

1. Mover las páginas de staff a `app/staff/*` y actualizar enlaces y redirects.
2. Crear `app/staff/layout.tsx`, `app/familia/layout.tsx` y los dos sidebars.
3. Guards de rol en proxy + layouts, dispatcher de `/` y redirects de login/activación.
4. Portar el feed de familia y la barra lateral con parentesco.
5. Verificar: Playwright con usuarios staff y padre (cada rol solo su sección, redirects, feed real) + comparación visual contra `familia-feed.dc.html` y screenshots existentes + `pnpm lint` y `pnpm build`.

Rollback: revertir la rama del change; no hay datos ni esquema involucrados.

## Open Questions

- El resumen del día futuro: este cambio deja el botón "Resumen del día" del perfil de niño en `/staff/resumen-dia` (hoy 404) para no cruzar secciones. El change de resumen decidirá si además existe una vista de familia (`/familia/resumen-dia`) o si es una única pantalla compartida.
