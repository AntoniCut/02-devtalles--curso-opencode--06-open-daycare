# Tasks

## 1. Mover las rutas de staff al prefijo `/staff`

- [ ] 1.1 Mover `app/page.tsx` a `app/staff/page.tsx` y las carpetas `kids/`, `agregar-nino/`, `vincular-padre/`, `crear-publicacion/`, `pokemon/` a `app/staff/`; verificar con `pnpm dev` que `/staff` y `/staff/kids` renderizan
- [ ] 1.2 Actualizar todos los `href`/`redirect(...)` internos de staff al prefijo `/staff` (sidebar, lista y perfil de niños, formularios, actions y `next` por defecto) y verificar con grep que no queden referencias sin prefijo a `/kids`, `/agregar-nino`, `/vincular-padre`, `/crear-publicacion` ni `/pokemon`
- [ ] 1.3 Apuntar el botón "Resumen del día" del perfil de niño a `/staff/resumen-dia` (sigue 404, sin cruzar secciones) y verificar que ningún enlace de las pantallas de staff sale de `/staff` (grep + navegación)

## 2. Shell de staff

- [ ] 2.1 Crear `components/staff-sidebar.tsx` a partir de `components/sidebar.tsx`, con enlaces `/staff/*` e iconos compartidos en un módulo común; verificar que la barra muestra "Sala Soles", "Nueva publicación" y el nav de guardería
- [ ] 2.2 Crear `app/staff/layout.tsx` que renderiza el staff sidebar y quitar el sidebar de cada página de staff; verificar en `/staff`, `/staff/kids` y `/staff/kids/[slug]` que el shell aparece una sola vez y el nav resuelve

## 3. Rol confiable, guards y redirects

- [ ] 3.1 `lib/auth.ts`: resolver el rol desde `app_metadata` (con respaldo en `public.users.role`) y exponer el rol crudo además de la etiqueta en `getAuthenticatedProfile`; verificar con staff y con un padre que la etiqueta y el rol mostrados son los correctos
- [ ] 3.2 `proxy.ts`: dispatcher de `/` por rol y guards de sección (`/staff/*` solo staff/admin; `/familia/*` solo padres) leyendo `claims.app_metadata.role`, manteniendo `PUBLIC_PATHS` y la regla de no redirigir Server Actions; verificar con navegación cruzada que cada rol termina en su sección
- [ ] 3.3 `app/page.tsx` como fallback server que redirige por rol, y login/activación que resuelven el home del rol respetando `?next=` solo dentro de la sección; verificar: login staff → `/staff`, login padre → `/familia`, activación padre → `/familia`, y padre con `?next=/staff/kids` → `/familia`
- [ ] 3.4 Crear un usuario padre de prueba (invitación + activación o service role), confirmar que su `public.users.role` es `parent` y verificar que `/staff/*` lo redirige a `/familia`

## 4. Feed de familia

- [ ] 4.1 `lib/posts.ts`: agregar el separador de día de familia ("HOY · MARTES 17 JUN") y el agrupado parametrizado; verificar en el feed renderizado que el separador usa la zona horaria de la guardería y el formato del mockup
- [ ] 4.2 Crear `app/familia/layout.tsx` y `components/family-sidebar.tsx` (subtítulo "Familia", nav Feed / Resumen del día / Mi cuenta, sin botón) con el parentesco del padre ("Mamá de Mateo") desde `parent_children`; verificar con el padre de prueba contra `familia-feed.dc.html`
- [ ] 4.3 Crear `app/familia/page.tsx`: publicaciones visibles por RLS (con autor, niños y URLs firmadas), hijos del padre vía `parent_children` y saludo "TU FAMILIA / Hola, {nombre} / Así va el día de hoy"; verificar que el padre ve las publicaciones de su hijo y los anuncios de su sala, y no las de niños ajenos
- [ ] 4.4 Agregar los pills de hijo + "Todos" (client, estado local) con la regla de filtro (hijo seleccionado → publicaciones etiquetadas + anuncios de su sala); verificar que al seleccionar un hijo se ocultan las publicaciones de los demás hijos y los anuncios siguen visibles
- [ ] 4.5 Crear `components/family-post-card.tsx` (nombre del niño o "Anuncio general", hora, "Maestra {autor} · Sala {sala}", badge de tipo en español, cuerpo y fotos; sin contadores); verificar con un logro, una actividad con foto y un anuncio contra la maqueta
- [ ] 4.6 Auditar accesibilidad (WCAG 2.2 AA) de las pantallas de familia y los shells nuevos con el agente `accessibility-checker` (foco, contraste, target size, pills operables por teclado) y corregir los hallazgos

## 5. Verificación de integración

- [ ] 5.1 Recorrido Playwright completo: staff por todas las rutas `/staff/*` (incluidos los 404 esperados de avisos y mi cuenta), padre por `/familia`, cruces de sección redirigen y consola sin errores
- [ ] 5.2 Comparación visual del feed de familia contra `references/pantallas/familia-feed.dc.html` (screenshots en `.playwright-mcp/`) y de las pantallas de staff movidas contra los PNG de `references/screenshots/`
- [ ] 5.3 `pnpm lint` y `pnpm build` sin errores
