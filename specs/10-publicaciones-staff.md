
# SPEC 10 — Publicaciones del staff: crear con fotos y feed real

> **Estado:** Implemented
> **Depende de:** SPEC 01, SPEC 06, SPEC 07, SPEC 08, SPEC SUPABASE 02, SPEC SUPABASE 03, SPEC SUPABASE 04
> **Fecha:** 2026-10-03
> **Objetivo:** Persistir en Supabase las publicaciones creadas en `/crear-publicacion` (con 0–4 fotos en Storage) y que `/` muestre el feed real de la sala.

## Scope

**In:**

- Migración con: enum `post_type` (`meal`/`nap`/`activity`/`achievement`/`mood`/`photo`/`announcement`); columna `users.room_id` nullable → `rooms`; tablas `posts` (tablas 8–10 del esquema de referencia, con `daycare_id`), `post_children` y `post_photos` (con `path` y `alt` en vez de `url`); índices de FKs, trigger `updated_at` reutilizando `set_updated_at()` y RLS con policies.
- Policies RLS de lectura: staff/admin ven las publicaciones de su sala (niños de su sala + anuncios de su sala); `admin` ve todas las de su guardería; padres ven las etiquetadas a sus hijos + los anuncios de la sala de sus hijos (la UI del padre llega en otra spec). INSERT solo staff/admin, con `author_id = auth.uid()` y `daycare_id` propio.
- Policy adicional en `users`: staff/admin de la guardería pueden leer los perfiles `staff`/`admin` de su propia guardería (para mostrar el nombre del autor del feed); se mantienen self y admin.
- Bucket privado `post-photos` en Supabase Storage (`file_size_limit` 5 MB, `allowed_mime_types` JPEG/PNG/WebP) con policies: INSERT para staff/admin bajo su propio `{daycare_id}/`; SELECT para miembros de la guardería. Path de cada archivo: `{daycare_id}/{uuid}.{ext}`.
- Asignación del staff de prueba (Antonio Cutillas) a la sala Soles (`users.room_id`).
- `/crear-publicacion` real: chips PARA con todos los niños activos de la sala del staff (admin sin sala: todos los de la guardería), sin preselección y "Toda la sala" excluyente; TIPO con los 7 chips del mockup; descripción requerida (máx. 2000 caracteres); sin campo título (`posts.title` queda nullable y siempre null).
- Fotos en el formulario: input file oculto, hasta 4 por publicación, 5 MB c/u, JPEG/PNG/WebP (sin HEIC), preview, campo opcional "Descripción de la foto" (alt) por foto, quitar y reordenar; validación en cliente y en el Server Action.
- Subida directa navegador→Storage con el cliente browser de Supabase al pulsar "Publicar" (no al seleccionar); después el Server Action inserta `posts` + `post_children`/`post_photos` y redirige a `/` sin toast.
- Validación de servidor: tipo y descripción requeridos; al menos un destinatario (niño o "Toda la sala"); tipo `photo` exige ≥1 imagen; con fotos, `children.photo_consent = false` en algún niño etiquetado o en la sala (cuando es "Toda la sala") rechaza la publicación con error inline.
- Guard de rol: un usuario `parent` que entre a `/crear-publicacion` es redirigido a `/` (además de RLS).
- Feed real en `/`: `app/page.tsx` lee publicaciones visibles desde Supabase (posts + autor + niños + fotos) con URLs firmadas generadas server-side; orden `published_at` desc, agrupado por día ("PUBLICADO HOY"/"AYER"/fecha) en zona America/Argentina/Buenos_Aires, límite 50; header con nombre de la sala, conteo real de niños activos y fecha real.
- Tarjeta del feed: "publicado por vos" en lo propio y nombre del autor en lo ajeno; multi-niño "Mateo +2" con avatar del primer niño (color determinístico por hash) y "Para: familia de Mateo y Sofía (+1 más)"; anuncio de sala "Anuncio general" / "Para: toda la sala"; carrusel de fotos con scroll horizontal + snap + puntos, sin auto-avance, navegable con teclado y swipe, fotos no clickeables; contadores de likes/comentarios en 0 y "Me encanta"/"Comentar" como elementos no interactivos (sin links a `/foto` ni `/detalle-publicacion`); se oculta el botón "Editar".
- Empty state del feed: tarjeta "Todavía no hay publicaciones" + CTA "Nueva publicación" al composer.
- Eliminación del mock `lib/feed.ts` (los 3 posts hardcodeados) y unificación de los 7 tipos en `lib/posts.ts`, compartido por composer y feed.
- Verificación: `supabase_list_migrations`/`supabase_list_tables`/`supabase_get_advisors`; tests de impersonación RLS con rollback; flujo end-to-end con Playwright (crear publicaciones con y sin fotos → verlas en el feed); `pnpm lint` + `pnpm build`.

**Out of scope (para specs futuros):**

- Editar/eliminar publicaciones (el botón "Editar" queda oculto), detalle `/detalle-publicacion`, visor `/foto`, reacciones y comentarios (las tablas `reactions`/`comments` no se crean).
- Feed del padre `/parent-feed` (solo se deja la RLS de lectura lista).
- Notificaciones y avisos: `users.notify_on_post`, tabla de notificaciones, emails vía Resend.
- Limpieza de fotos huérfanas si el insert falla después de subir.
- UI para asignar salas al staff (la asignación del staff de prueba es un dato).
- Seeds de publicaciones de demo; `/avisos` y `/mi-cuenta`; responsive móvil/tablet y modo oscuro.

## Data model

```sql
do $$ begin
  create type public.post_type as enum ('meal', 'nap', 'activity', 'achievement', 'mood', 'photo', 'announcement');
exception when duplicate_object then null; end $$;

alter table public.users add column room_id uuid references public.rooms(id);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id),
  author_id uuid not null references public.users(id),
  room_id uuid references public.rooms(id),
  type public.post_type not null,
  title text,
  body text not null,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.post_children (
  post_id uuid not null references public.posts(id) on delete cascade,
  child_id uuid not null references public.children(id),
  primary key (post_id, child_id)
);

create table public.post_photos (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  path text not null,
  alt text,
  width int,
  height int,
  position int not null default 0,
  created_at timestamptz not null default now()
);
```

Más: índices `posts_daycare_id_idx`, `posts_author_id_idx`, `posts_room_id_idx`, `posts_published_at_idx`, `post_children_child_id_idx`, `post_photos_post_id_idx`; trigger `set_posts_updated_at`; RLS habilitado en las tres tablas nuevas.

Semántica: publicación a niños → filas en `post_children` y `posts.room_id` null; "Toda la sala" → `posts.room_id` = sala del staff y sin `post_children`.

```ts
// lib/posts.ts (compartido por composer y feed)
export type PostType = "meal" | "nap" | "activity" | "achievement" | "mood" | "photo" | "announcement";

export interface PostTypeOption {
  id: PostType;
  label: string; // "Comida", "Siesta"… (los 7 del mockup)
  background: string; // colores fijos del mockup
  color: string;
}

export interface FeedPostPhoto {
  path: string;
  url: string; // URL firmada generada server-side
  alt: string; // alt del usuario o "Foto de la publicación"
  width: number | null;
  height: number | null;
}

export interface FeedPost {
  id: string;
  type: PostType;
  isMine: boolean;
  authorName: string;
  roomAnnouncement: boolean; // true = "Toda la sala"
  children: { id: string; name: string; initial: string; background: string; color: string }[];
  body: string;
  publishedAt: string; // ISO
  photos: FeedPostPhoto[];
}
```

Convenciones: path de Storage `{daycare_id}/{uuid}.{ext}`; bucket `post-photos` privado; fechas/horas formateadas en `America/Argentina/Buenos_Aires`; avatar de niño con paleta determinística por hash del nombre (misma familia de colores que `lib/kids.ts`).

## Implementation plan

1. Cargar skills `supabase` + `supabase-postgres-best-practices`; crear migración (patrón CLI `supabase migration new`) con enum, `users.room_id`, tablas, índices, trigger, RLS y policies; aplicar con `supabase_apply_migration`; verificar con `supabase_list_migrations`, `supabase_list_tables` y `supabase_get_advisors`.
2. Migración/SQL del bucket `post-photos` (privado, límites de tamaño y mime types) y sus policies de Storage; asignar el staff de prueba a Soles (dato vía SQL directo). Verificar con tests de impersonación (`set local role` + claims, con rollback).
3. `lib/posts.ts`: tipos, `postTypeOptions` (7 tipos con labels/colores del mockup), helpers de formato de fecha/hora (TZ Argentina), paleta determinística de avatares y helpers de encabezado multi-niño ("Mateo +2", "Para: familia de …").
4. `app/crear-publicacion/page.tsx` (server): leer el perfil real (`users.role`, `room_id`, `daycare_id`), redirigir a `/` si no es staff/admin, y cargar los niños activos de la sala (admin sin sala: todos los de la guardería); pasar todo al form.
5. `components/create-post-form.tsx`: reescribir con chips reales (sin preselección, "Toda la sala" excluyente), descripción vacía, input file oculto + previews con alt, quitar/reordenar, validaciones de fotos; al publicar sube las fotos al bucket con el cliente browser y llama al Server Action con los paths; errores inline; éxito → `router.push("/")`.
6. `app/crear-publicacion/actions.ts`: Server Action que valida todo de nuevo, verifica `photo_consent`, inserta `posts` + `post_children`/`post_photos` (con rollback del post si algo falla) y devuelve error o redirige a `/`.
7. Feed real: `app/page.tsx` consulta las publicaciones visibles (joins con `users`, `post_children`/`children`, `post_photos`), agrupa por día y genera URLs firmadas; actualizar `components/post-card.tsx` (multi-niño, carrusel accesible, contadores no interactivos, sin "Editar" ni links a rutas 404), agregar empty state y header con datos reales; eliminar `lib/feed.ts` mock.
8. Verificación end-to-end con Playwright: publicar con y sin fotos, ver el feed agrupado y el carrusel, probar errores de validación y consentimiento, comprobar que un padre no publica y no ve publicaciones ajenas; `pnpm lint` + `pnpm build`.

## Acceptance criteria

- [x] `supabase_list_migrations` incluye la migración y `supabase_list_tables` muestra `posts`, `post_children`, `post_photos` con `users.room_id`; `supabase_get_advisors` no reporta avisos nuevos.
- [x] Un staff puede insertar una publicación solo con `author_id = auth.uid()` y su propio `daycare_id`; un padre no puede insertar (test de impersonación con rollback).
- [x] Un padre solo ve publicaciones etiquetadas a sus hijos y anuncios de la sala de sus hijos; un staff de otra sala no ve publicaciones ajenas (test de impersonación con rollback).
- [x] El bucket `post-photos` es privado; un staff puede subir solo bajo su `{daycare_id}/` y un usuario de otra guardería no puede leer el objeto.
- [x] `users.room_id` del staff de prueba apunta a Soles.
- [x] `/crear-publicacion` lista los niños activos de Soles sin preselección; "Toda la sala" deselecciona niños y viceversa.
- [x] Tipo y descripción requeridos (máx. 2000) muestran error inline; sin destinatario → error; tipo "Foto" sin imagen → error.
- [x] Fotos: se aceptan hasta 4 (5 MB, JPEG/PNG/WebP); un archivo inválido muestra error inline; se puede quitar, reordenar y agregar alt por foto.
- [x] Publicar sube las fotos recién al pulsar "Publicar", inserta `posts` + `post_photos`/`post_children` y redirige a `/` sin toast.
- [x] Publicación a niños guarda `post_children` con `room_id` null; "Toda la sala" guarda `room_id` de Soles sin `post_children`.
- [x] Con fotos y un niño etiquetado (o la sala) con `photo_consent = false`, la publicación se rechaza con error y no queda ninguna fila ni archivo.
- [x] Un usuario `parent` autenticado que entra a `/crear-publicacion` es redirigido a `/`.
- [x] `/` muestra las publicaciones reales ordenadas desc y agrupadas por día ("PUBLICADO HOY"/"AYER"/fecha) en TZ Argentina, con límite 50.
- [x] Lo publicado por el usuario dice "publicado por vos"; lo de otro staff muestra su nombre.
- [x] Multi-niño: título "Mateo +2", "Para: familia de Mateo y Sofía (+1 más)" y avatar del primer niño con color determinístico.
- [x] Anuncio de sala: "Anuncio general" y "Para: toda la sala".
- [x] El carrusel funciona con scroll + snap + puntos, sin auto-avance, navegable con teclado y swipe; las fotos no son clickeables.
- [x] Los contadores de likes/comentarios muestran 0 y "Me encanta"/"Comentar" no son interactivos; no hay links a `/foto` ni `/detalle-publicacion` ni botón "Editar".
- [x] Sin publicaciones, el feed muestra "Todavía no hay publicaciones" + CTA "Nueva publicación".
- [x] El header muestra el nombre real de la sala, el conteo real de niños activos y la fecha real.
- [x] El feed mantiene el estilo del mockup (`references/screenshots/feed.png`); las diferencias de fotos (carrusel), contadores (0) y empty state quedan documentadas como desviaciones intencionales.
- [x] `pnpm lint` y `pnpm build` sin errores; consola sin errores ni warnings de hidratación.

## Decisions

- **Sí:** alcance creación + feed real (decisión del usuario) — sin feed real, publicar no tiene efecto visible ni verificable.
- **No:** edición, detalle, reacciones y comentarios en este spec — `reactions`/`comments` no existen en la DB y son su propio subsistema.
- **Sí:** esquema de referencia + 3 ajustes: `posts.daycare_id` (aislamiento multi-tenant), `post_photos.alt` (WCAG 2.2 AA) y `mood` en `post_type` (el chip "Ánimo" del mockup no está en el enum de referencia).
- **Sí:** `users.room_id` nullable (4.º ajuste) — sin sala no se puede saber "la sala del staff" para los chips PARA ni `posts.room_id`.
- **Sí:** `title` nullable y sin UI — el mockup no tiene campo título; en el feed el encabezado sale del niño o del tipo.
- **Sí:** solo staff/admin publican; padres redirigidos de `/crear-publicacion`; `/` no cambia su gating en esta spec (el shell del padre es otra spec).
- **Sí:** bucket privado + subida directa navegador→Storage + guardar `path` (decisión del usuario) — fotos de niños no accesibles por URL pública; URLs firmadas al renderizar.
- **Sí:** hasta 4 fotos, 5 MB, JPEG/PNG/WebP, sin HEIC (decisión del usuario).
- **Sí:** destinatarios = niños activos de la sala del staff; "Toda la sala" = `room_id`, sin `post_children`; ≥1 destinatario.
- **Sí:** admin sin sala publica a niños sueltos (PARA con todos los niños de la guardería, "Toda la sala" deshabilitado, `room_id` null).
- **Sí:** validación replicada en cliente y Server Action; sin preselección de destinatarios (el mockup precargaba Mateo; con datos reales no aplica).
- **Sí:** publicación inmediata (`published_at = now()`); sin borradores ni programación (la referencia no tiene columna de estado).
- **No:** notificaciones/avisos/emails al publicar — spec futura; `users.notify_on_post` queda sin uso.
- **Sí:** carrusel con scroll + snap + puntos para las fotos del feed (decisión del usuario, en vez de grilla).
- **Sí:** contadores en 0 y acciones visuales no interactivas — la estética del mockup se conserva sin UI muerta que navegue a rutas inexistentes.
- **Sí:** alt opcional por foto (campo extra en el composer) con fallback "Foto de la publicación" — WCAG; desviación visual aceptada.
- **Sí:** subida al pulsar "Publicar" (no al seleccionar) — evita archivos subidos si se cancela.
- **Sí:** feed agrupado por día, sin paginación (límite 50), TZ America/Argentina/Buenos_Aires.
- **Sí:** empty state sin seeds — la verificación E2E crea las publicaciones con el formulario real.
- **Sí:** `photo_consent` bloquea fotos cuando algún niño etiquetado (o la sala completa, si es "Toda la sala") no dio consentimiento.
- **Sí:** tipo "Foto" exige ≥1 imagen.
- **Sí:** multi-niño "primer niño + N", "Para: familia de X y Y (+N más)" y color de avatar determinístico por hash.
- **Sí:** sin toast de éxito ni confirmación al cancelar (fiel al mockup).
- **Sí:** ocultar el botón "Editar" del card hasta la spec de edición.
- **No:** limpieza de fotos huérfanas si el insert falla — se documenta como riesgo y va en spec futura.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Fotos huérfanas en Storage si el insert falla después de subir | Aceptado; path namespaced por `daycare_id`; limpieza en spec futura. |
| Policy de Storage basada en path (`{daycare_id}/…`) mal escrita podría filtrar fotos entre guarderías | Tests de impersonación con rollback (staff de otra guardería no lee) + revisión del agente `db-security-auditor`. |
| Cambio de policy en `users` expone perfiles staff a más usuarios | Solo perfiles `staff`/`admin` de la misma guardería; sin campos sensibles. |
| URLs firmadas con expiración corta y caché del feed | Expiración de 1 h generada en cada request server-side; sin caché persistente. |
| `photo_consent` hoy todo en true: la regla no se ejercita con datos reales | Test con `update` temporal + rollback durante la verificación. |
| Publicación sin `room_id` y sin niños queda invisible para padres | Es el caso admin sin sala, aceptado por diseño; no se ofrece "Toda la guardería" en esta spec. |
| Zona horaria fija Argentina podría no coincidir con la guardería | Aceptado para el demo; si aterriza multi-zona, columna en `daycares` en spec futura. |
| Next 16 / React 19 difieren de los datos de entrenamiento | Leer `node_modules/next/dist/docs/` antes de escribir código (AGENTS.md). |
| Sesión vencida a mitad de la subida directa | Error inline "No se pudieron subir las fotos" y el post no se inserta. |
| Carrusel sin accesibilidad de teclado | Contenedor focusable con flechas, puntos ≥24 px (2.5.8) y sin auto-avance (2.2.2). |

## What is **not** in this spec

- Editar/eliminar publicaciones, detalle `/detalle-publicacion`, visor `/foto`, reacciones y comentarios.
- Feed del padre `/parent-feed` (solo RLS lista).
- Notificaciones, avisos y emails al publicar.
- Limpieza de fotos huérfanas.
- UI de asignación de salas al staff, seeds de publicaciones de demo.
- `/avisos`, `/mi-cuenta`, responsive móvil/tablet y modo oscuro.

Cada uno de esos, si aterriza, va en su propio spec.
