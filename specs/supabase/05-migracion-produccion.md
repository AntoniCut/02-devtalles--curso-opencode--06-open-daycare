# SPEC SUPABASE 05 — Migración a un nuevo proyecto Supabase en producción

> **Estado:** Pendiente de ejecución
> **Depende de:** —
> **Fecha:** 2026-10-06
> **Objetivo:** Migrar el proyecto origen `rfunicjeleyzttwtlbyg` (open-daycare) a un proyecto Supabase nuevo de producción: esquema por replay de migraciones, datos `public`, usuarios de Auth (preservando contraseñas) y objetos del bucket `post-photos`, y actualizar la configuración del repo/app/tooling.

## Decisiones acordadas

- **Esquema:** replay de migraciones con `supabase db push` (el repo es la fuente de verdad; el historial del proyecto nuevo queda limpio).
- **Usuarios Auth:** restaurar `auth.users` + `auth.identities` (hashes bcrypt ⇒ mismas contraseñas). Las sesiones activas quedan invalidadas por el nuevo JWT secret (esperado).
- **Storage:** bucket y policies llegan por migración; los objetos se copian vía API/CLI (no se restaura `storage.objects` por SQL).
- **Configuración:** se actualizan `.env`, `.env.example`, `README.md`, `opencode.json` (MCP) y se re-autentica el MCP.
- **Corte:** congelando escrituras; el proyecto viejo queda intacto como rollback.
- `SUPABASE_SERVICE_ROLE_KEY` **no se usa** en la app ni en la migración — se elimina de `.env.example`.

## Inventario origen

| Recurso | Detalle |
| --- | --- |
| Migraciones | 22 archivos en `supabase/migrations/` (fuente de verdad) |
| Tablas `public` | 9 (`daycares`, `users`, `rooms`, `children`, `invitations`, `parent_children`, `posts`, `post_children`, `post_photos`), ~25 filas |
| Esquema extra | `private` (helpers RLS), enums, triggers, RPCs (`accept_invitation`, `get_invitation_preview`, `get_child_parents`, RPC de posts) |
| Auth | 3 usuarios email+password |
| Storage | bucket privado `post-photos` (5 MB, jpeg/png/webp), 13 objetos (~1.8 MB) |
| Otros | sin edge functions, sin cron jobs, sin secretos en Vault |

## Fase 0 — Prerrequisitos (usuario)

1. `supabase login` (o `export SUPABASE_ACCESS_TOKEN=sbp_...`).
2. Crear el proyecto en el dashboard (org, región y plan a elección del usuario). Recomendado: misma región que el origen.
3. Guardar del proyecto nuevo: project ref, DB password, URL, publishable key.
4. Actualizar `.env` con las credenciales del nuevo proyecto (conservar la DB password del viejo como `OLD_DB_PASSWORD` temporal en el shell, no en el repo).
5. Anotar el project ref nuevo para link y config.

## Fase 1 — Esquema (replay de migraciones)

```bash
supabase link --project-ref "$NEW_PROJECT_REF"
supabase db push --dry-run   # revisar: 22 migraciones, en orden
supabase db push
supabase migration list      # local == remoto
supabase db diff --linked    # sin drift
```

## Fase 2 — Datos `public`

```bash
supabase db dump --project-ref "$OLD_PROJECT_REF" --password "$OLD_DB_PASSWORD" \
  --data-only --use-copy --schema public -f "supabase/.backups/$(date +%Y%m%d)/public_data.sql"

psql "$NEW_DB_URL" --single-transaction --variable ON_ERROR_STOP=1 \
  --command 'SET session_replication_role = replica;' \
  --file "supabase/.backups/$(date +%Y%m%d)/public_data.sql"
```

## Fase 3 — Auth (preservando contraseñas)

```bash
supabase db dump --project-ref "$OLD_PROJECT_REF" --password "$OLD_DB_PASSWORD" \
  --data-only --use-copy --schema auth \
  -x auth.schema_migrations -x auth.instances -x auth.sessions -x auth.refresh_tokens \
  -x auth.flow_state -x auth.one_time_tokens -x auth.audit_log_entries \
  -x auth.mfa_challenges -x auth.webauthn_challenges \
  -f "supabase/.backups/$(date +%Y%m%d)/auth_data.sql"

psql "$NEW_DB_URL" --single-transaction --variable ON_ERROR_STOP=1 \
  --command 'SET session_replication_role = replica;' \
  --file "supabase/.backups/$(date +%Y%m%d)/auth_data.sql"
```

Dashboard del proyecto nuevo (replicar del origen): Site URL, Redirect URLs, plantillas de email, leaked password protection, password policy, proveedor Email/password.

## Fase 4 — Storage

```bash
# descargar del origen
supabase storage cp -r "ss:///post-photos" "supabase/.backups/$(date +%Y%m%d)/post-photos" \
  --project-ref "$OLD_PROJECT_REF"
# subir al destino (bucket ya creado por la migración)
supabase storage cp -r "supabase/.backups/$(date +%Y%m%d)/post-photos" "ss:///post-photos" \
  --project-ref "$NEW_PROJECT_REF"
```

Verificar 13/13 objetos y rutas `{daycare_id}/{uuid}.{ext}`. No insertar filas en `storage.objects` por SQL.

## Fase 5 — Configuración repo/tooling

- `.env` (nuevo proyecto): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_DB_PASSWORD`.
- `.env.example`: actualizar refs/URLs y quitar `SUPABASE_SERVICE_ROLE_KEY`.
- `README.md`: project ref, URL y dashboard.
- `opencode.json`: `project_ref` del MCP + `opencode mcp auth supabase`.
- `.gitignore`: `supabase/config.toml`, `supabase/.temp/`, `supabase/.backups/`; destrackear `supabase/.temp/cli-latest`.
- `agent/skills/` y `references/cron-jobs.md` (docs con el ref viejo): actualizar por consistencia.

## Fase 6 — Verificación

- `supabase db advisors` (security/performance) en el nuevo proyecto.
- Conteos por tabla origen vs destino; storage 13/13.
- App local contra el nuevo proyecto: login staff y madre, feed, detalle de niño, invitación (misma API key de Resend), subir foto y signed URL.
- Playwright contra `references/screenshots/`; `pnpm lint` y `pnpm build`.

## Fase 7 — Corte a producción (escrituras congeladas)

1. Aviso de mantenimiento.
2. Re-dump delta de `public` + `auth` e importar; reconfirmar conteos.
3. Actualizar env vars en el hosting y redeploy.
4. Smoke test en producción (login, feed, foto).
5. Rollback: repuntar env al proyecto viejo (intacto); el nuevo se descarta.

## Criterios de aceptación

- [ ] `supabase migration list` muestra las 22 migraciones alineadas en el proyecto nuevo.
- [ ] `supabase db diff --linked` sin cambios.
- [ ] Conteos de filas origen == destino en las 9 tablas `public`.
- [ ] Los 3 usuarios de Auth inician sesión con su contraseña original.
- [ ] 13 objetos en `post-photos` con las mismas rutas; signed URLs funcionan desde la app.
- [ ] App en producción apunta al proyecto nuevo y pasa smoke test.
- [ ] MCP y documentación del repo apuntan al proyecto nuevo.
