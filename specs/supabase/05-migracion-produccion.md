# SPEC SUPABASE 05 — Migración a un nuevo proyecto Supabase en producción

> **Estado:** Implementado — migración y corte en producción completados (2026-10-07); pendiente re-autenticar el MCP y mergear la rama a `master`
> **Depende de:** —
> **Fecha:** 2026-10-06 (ejecutado 2026-10-07)
> **Objetivo:** Migrar el proyecto origen `rfunicjeleyzttwtlbyg` (open-daycare) al proyecto Supabase de producción `OpenDayCare-Prod` (`mdoftqngmqmijmowqqak`): esquema por replay de migraciones, datos `public`, usuarios de Auth (preservando contraseñas) y objetos del bucket `post-photos`, y actualizar la configuración del repo/app/tooling.

## Resultado de la ejecución (2026-10-07)

- **Proyecto destino:** `OpenDayCare-Prod` — ref `mdoftqngmqmijmowqqak`, West EU (Ireland), misma org que el origen.
- **Esquema:** 22/22 migraciones aplicadas con `db push`; historial local == remoto; sin drift propio (solo ruido de plataforma: `pg_net`, `rls_auto_enable`).
- **Datos:** conteos idénticos al origen en las 9 tablas `public` y en `auth.users`/`auth.identities`; hashes bcrypt idénticos por email (login con las contraseñas originales).
- **Storage:** 13/13 objetos en las rutas correctas `{daycare_id}/{uuid}.{ext}`; signed URLs responden 200 desde la app.
- **Advisors:** misma lista que el origen (3 avisos `SECURITY DEFINER` intencionales + leaked password protection + `multiple_permissive_policies`).
- **E2E local:** login real `staff@opendaycare.com` → `/staff`, feed con datos y fotos del proyecto nuevo, 0 errores de consola; `pnpm lint` y `pnpm build` OK.
- **Corte en producción:** completado 2026-10-07 — env vars de Vercel apuntando al proyecto nuevo, redeploy hecho; smoke test en `https://02-devtalles-curso-opencode-06-open.vercel.app` (login staff → `/staff`, feed con datos y fotos servidas desde `mdoftqngmqmijmowqqak`).
- **Pendiente (usuario):** `opencode mcp auth supabase` y mergear `spec-05-migracion-produccion` a `master`.

## Decisiones acordadas

- **Esquema:** replay de migraciones con `supabase db push` (el repo es la fuente de verdad; el historial del proyecto nuevo queda limpio).
- **Usuarios Auth:** restaurar `auth.users` + `auth.identities` (hashes bcrypt ⇒ mismas contraseñas). Las sesiones activas quedan invalidadas por el nuevo JWT secret (esperado).
- **Storage:** bucket y policies llegan por migración; los objetos se copian vía CLI (no se restaura `storage.objects` por SQL).
- **Configuración:** se actualizan `.env`, `.env.example`, `README.md`, `opencode.json` (MCP) y se re-autentica el MCP.
- **Corte:** congelando escrituras; el proyecto viejo queda intacto como rollback.
- `SUPABASE_SERVICE_ROLE_KEY` **no se usa** en la app ni en la migración — se eliminó de `.env.example`.

## Inventario origen

| Recurso | Detalle |
| --- | --- |
| Migraciones | 22 archivos en `supabase/migrations/` (fuente de verdad) |
| Tablas `public` | 9 (`daycares` 4, `rooms` 3, `children` 13, `users` 3, `invitations` 3, `parent_children` 3, `posts` 6, `post_children` 6, `post_photos` 8) |
| Esquema extra | `private` (helpers RLS), enums, triggers, RPCs (`accept_invitation`, `get_invitation_preview`, `get_child_parents`, RPC de posts) |
| Auth | 3 usuarios email+password |
| Storage | bucket privado `post-photos` (5 MB, jpeg/png/webp), 13 objetos (~1.8 MB) |
| Otros | sin edge functions, sin cron jobs, sin secretos en Vault |
| Hosting producción | Vercel — proyecto `02-devtalles-curso-opencode-06-open-daycare`, branch `master`, dominio `02-devtalles-curso-opencode-06-open.vercel.app`; env vars en Vercel → Settings → Environment Variables |

## Lecciones aprendidas (gotchas de la ejecución)

- La conexión directa `db.<ref>.supabase.co` es **IPv6-only**: usar el *session pooler* (`aws-0-eu-west-1.pooler.supabase.com`) o la CLI con `--project-ref`.
- `supabase db dump` y `supabase storage cp/rm` requieren **Docker**; con Docker Desktop hay que exportar `DOCKER_HOST=unix://$HOME/.docker/desktop/docker.sock` (no existe `/var/run/docker.sock`).
- `supabase/.temp/pooler-url` **no incluye la password**: restaurar con `PGPASSWORD` en lugar de una URL con credenciales.
- Las migraciones traen **seeds** (`daycares` 4, `rooms` 3): antes de restaurar el dump hay que **truncar todo `public`** o se duplican esas filas.
- `supabase storage cp -r <dir> ss:///bucket` **agrega el nombre del directorio** a la ruta remota: subir archivo por archivo (o el subdirectorio correcto) para preservar rutas.
- `/auth/v1/admin/settings` responde 404 en hosted; `mailer_autoconfirm` se verifica con `GET /auth/v1/settings` o `supabase config diff`.
- `supabase config diff/push` con un `config.toml` mínimo (solo lo declarado) permite auditar/aplicar settings de Auth sin tocar el resto.

## Fase 0 — Prerrequisitos (ejecutado)

1. `supabase login` (usuario `antonicut@gmail.com`; token en el keyring del sistema).
2. Proyecto nuevo creado en el dashboard: `OpenDayCare-Prod` / `mdoftqngmqmijmowqqak` (West EU Ireland).
3. `.env` actualizado: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_DB_PASSWORD` (nuevos). Respaldo del `.env` viejo en `supabase/.backups/20261006/.env.old` (gitignored).

## Fase 1 — Esquema (replay de migraciones) — ejecutado

```bash
supabase link --project-ref mdoftqngmqmijmowqqak --password "$DB_PW" --yes
supabase db push --dry-run
supabase db push --yes
supabase migration list       # 22/22 alineadas
supabase db diff --linked     # sin drift propio
```

## Fase 2 — Datos `public` — ejecutado

```bash
# dump (proyecto viejo)
supabase db dump --project-ref rfunicjeleyzttwtlbyg --password "$OLD_DB_PASSWORD" \
  --data-only --use-copy --schema public -f supabase/.backups/20261006/public_data.sql

# truncar el público del destino (los seeds de las migraciones duplican daycares/rooms)
docker run --rm -e PGPASSWORD="$NEW_DB_PASSWORD" <img> psql "$NEW_DB_URL" \
  -c "truncate table public.post_photos, public.post_children, public.posts, public.parent_children, public.invitations, public.children, public.rooms, public.daycares, public.users cascade;"

# restore
docker run --rm -i -e PGPASSWORD="$NEW_DB_PASSWORD" <img> psql "$NEW_DB_URL" \
  --single-transaction --variable ON_ERROR_STOP=1 \
  --command 'SET session_replication_role = replica;' --file - < supabase/.backups/20261006/public_data.sql
```

## Fase 3 — Auth (preservando contraseñas) — ejecutado

```bash
supabase db dump --project-ref rfunicjeleyzttwtlbyg --password "$OLD_DB_PASSWORD" \
  --data-only --use-copy --schema auth \
  -x auth.schema_migrations -x auth.instances -x auth.sessions -x auth.refresh_tokens \
  -x auth.flow_state -x auth.one_time_tokens -x auth.audit_log_entries \
  -x auth.mfa_challenges -x auth.webauthn_challenges \
  -f supabase/.backups/20261006/auth_data.sql

docker run --rm -i -e PGPASSWORD="$NEW_DB_PASSWORD" <img> psql "$NEW_DB_URL" \
  --single-transaction --variable ON_ERROR_STOP=1 \
  --command 'SET session_replication_role = replica;' --file - < supabase/.backups/20261006/auth_data.sql
```

Verificado: 3 usuarios / 3 identidades, hashes por email idénticos, `mailer_autoconfirm` alineado con el origen (login inmediato para el flujo de `/activate`). Site URL del destino = `http://localhost:3000` (igual que el origen; sin flujos de email implementados).

## Fase 4 — Storage — ejecutado

```bash
# descarga (una vez)
supabase storage cp -r --experimental "ss:///post-photos" supabase/.backups/20261006/post-photos \
  --project-ref rfunicjeleyzttwtlbyg

# subida archivo por archivo (evita el nesting del directorio)
cd supabase/.backups/20261006/post-photos && find . -type f | sed 's|^\./||' | while read -r f; do
  supabase storage cp --experimental "$f" "ss:///post-photos/$f" --project-ref mdoftqngmqmijmowqqak
done
```

Verificado 13/13 con `supabase storage ls -r --experimental "ss:///post-photos"`.

## Fase 5 — Configuración repo/tooling — ejecutado

- `.env`, `.env.example` (URLs/publishable key del nuevo; `SUPABASE_SERVICE_ROLE_KEY` eliminada).
- `README.md`, `opencode.json`, `.github/workflows/db-security-audit.yml` y `references/cron-jobs.md`: ref actualizado a `mdoftqngmqmijmowqqak`.
- `.gitignore`: `supabase/config.toml`, `supabase/.temp/`, `supabase/.backups/`; `cli-latest` destrackeado.
- **Pendiente:** `opencode mcp auth supabase` (OAuth interactivo) para re-autenticar el MCP contra el proyecto nuevo.

## Fase 6 — Verificación — ejecutado

- `supabase db advisors --linked --type all`: idéntico al origen.
- Conteos origen (dumps) vs destino: idénticos.
- E2E: login staff en localhost contra el proyecto nuevo, feed con datos, imágenes firmadas 200, 0 errores de consola; screenshot en `.playwright-mcp/migracion-staff-feed.png`.
- `pnpm lint` y `pnpm build` OK.

## Fase 7 — Corte a producción (pendiente)

1. Aviso de mantenimiento.
2. Re-dump delta de `public` + `auth` (desde `rfunicjeleyzttwtlbyg`) e importar en el nuevo; reconfirmar conteos.
3. Actualizar env vars en Vercel (Settings → Environment Variables): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_BASE_URL` (dominio de producción); redeploy de `master`.
4. Smoke test en producción (login, feed, foto).
5. Rollback: repuntar env vars al proyecto viejo (intacto) y redeploy.

## Criterios de aceptación

- [x] `supabase migration list` muestra las 22 migraciones alineadas en el proyecto nuevo.
- [x] `supabase db diff --linked` sin cambios propios (solo objetos de plataforma).
- [x] Conteos de filas origen == destino en las 9 tablas `public` (verificado contra los dumps).
- [x] Los 3 usuarios de Auth inician sesión con su contraseña original (hash idéntico + login API/E2E del staff).
- [x] 13 objetos en `post-photos` con las mismas rutas; signed URLs funcionan desde la app.
- [x] App en producción apunta al proyecto nuevo y pasa smoke test (login staff, feed y fotos verificados el 2026-10-07).
- [x] MCP (URL) y documentación del repo apuntan al proyecto nuevo (re-auth OAuth del MCP pendiente).
