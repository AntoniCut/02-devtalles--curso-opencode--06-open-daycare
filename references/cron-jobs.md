# Opciones para ejecutar CRON Jobs

Job de referencia: ejecutar la auditoría de seguridad de la base de datos **todos los viernes a las 22:00 (Europe/Madrid)**, sin supervisión.

1. Cron del sistema (macOS/Linux)

1.1 Task Scheduler (recomendado - GUI)

1.2 PowerShell (script + scheduled task)

1.3 launchd (nativo macOS - recomendado)

2. Supabase Cron (pg_cron) - si el agente hace tareas de base de datos

3. GitHub Actions - si el repo está en GitHub

---

## 0. Comando base (aplica a todas las opciones)

La invocación correcta en modo no interactivo es:

```bash
opencode run --command db-security-auditor
```

No uses `opencode run /db-security-auditor`: en modo `run` el texto se envía como prompt y los slash-commands solo se resuelven en la TUI. Tampoco uses `--agent db-security-auditor`: el CLI detecta que es un subagente y cae al agente por defecto. El comando `.opencode/command/db-security-auditor.md` ya apunta al agente correcto.

| Flag | Para qué sirve |
| --- | --- |
| `--dir <ruta>` | Ejecuta con ese directorio de trabajo (carga `opencode.json`, `.opencode/command/` y los archivos del proyecto). Alternativa a `cd` en el wrapper. |
| `--format json` | Salida como eventos JSON, útil si quieres parsear el resultado. Por defecto la salida es texto legible. |
| `--model provider/model` | Fuerza un modelo distinto al del agente (por ejemplo `opencode-go/deepseek-v4-flash-vision-exp`). |
| `--auto` | Auto-aprueba los permisos `ask`. **No se usa en este job**: como es solo auditoría, los permisos que no están permitidos explícitamente se auto-rechazan y el agente no puede escribir. |

Comportamiento en headless: los permisos `ask` se auto-rechazan (no se queda colgado), y el proceso termina con código 1 si hubo error.

Requisitos comunes:

- `opencode` instalado (en este equipo: `$HOME/.opencode/bin/opencode`) y accesible en el `PATH` del scheduler.
- Auth del proveedor: `~/.local/share/opencode/auth.json` (o la variable `OPENCODE_API_KEY` en CI).
- MCP de Supabase autenticado: `~/.local/share/opencode/mcp-auth.json` (local) o un PAT por header (CI).
- `OPENCODE_DISABLE_AUTOUPDATE=true` para que las ejecuciones programadas no se actualicen solas a mitad de camino.
- Probar el comando a mano una vez antes de programarlo.

---

## 1. Cron del sistema (Linux/macOS)

Crea un wrapper que fije el entorno (cron arranca con un `PATH` mínimo y sin perfil de shell), se mueva al proyecto y registre la salida:

```bash
#!/usr/bin/env bash
# ~/.local/bin/db-security-audit.sh
set -euo pipefail

export HOME="/home/antonydev"
export PATH="$HOME/.opencode/bin:/usr/local/bin:/usr/bin:/bin"
export OPENCODE_DISABLE_AUTOUPDATE="true"

PROJECT_DIR="/home/antonydev/antonydev-desarrollos/02-devtalles-desarrollos/devtalles.antonydev.tech/opencode/06-open-daycare"
LOG_DIR="$HOME/.local/share/opencode-cron"

mkdir -p "$LOG_DIR"
exec >> "$LOG_DIR/db-security-audit.log" 2>&1

echo "=== start $(date -Is) ==="
cd "$PROJECT_DIR"
if opencode run --command db-security-auditor; then
  echo "=== end $(date -Is) status=ok ==="
else
  echo "=== end $(date -Is) status=error exit=$? ==="
fi
```

Entrada en el crontab (`crontab -e`):

```cron
# m  h  dom mon dow   comando
0  22  *   *   5     /usr/bin/flock -n /tmp/db-security-audit.lock /home/antonydev/.local/bin/db-security-audit.sh
```

- `0 22 * * 5` = viernes 22:00 hora local.
- `flock -n` evita solapar dos ejecuciones si una se alarga.
- Log: `~/.local/share/opencode-cron/db-security-audit.log`.
- En macOS `cron` sigue funcionando, pero requiere darle Full Disk Access; se recomienda launchd (1.3).

---

## 1.1 Task Scheduler (Windows - GUI)

1. Abrir **Task Scheduler** → **Create Task...** (no "Basic Task").
2. **General**: nombre `OpenCode DB Security Audit`; marcar "Run whether user is logged on or not"; opcional "Run with highest privileges".
3. **Triggers** → **New...** → `Weekly` → día `Friday` → hora `22:00` → OK.
4. **Actions** → **New...** → `Start a program`:
   - Program/script: `pwsh.exe` (o `powershell.exe`).
   - Add arguments: `-NoProfile -ExecutionPolicy Bypass -File "C:\dev\06-open-daycare\db-security-audit.ps1"`.
   - Start in: `C:\dev\06-open-daycare`.
5. **Conditions**: desmarcar "Start the task only if the computer is on AC power" (portátiles).
6. **Settings**: marcar "Run task as soon as possible after a scheduled start is missed".

El script `.ps1` es el de la sección 1.2.

---

## 1.2 PowerShell (script + scheduled task)

```powershell
# C:\dev\06-open-daycare\db-security-audit.ps1
$ErrorActionPreference = "Stop"

$ProjectDir = "C:\dev\06-open-daycare"
$LogDir     = Join-Path $env:LOCALAPPDATA "opencode-cron"
$LogFile    = Join-Path $LogDir "db-security-audit.log"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$env:Path = "$env:USERPROFILE\.opencode\bin;$env:Path"
$env:OPENCODE_DISABLE_AUTOUPDATE = "true"

Set-Location $ProjectDir
Add-Content $LogFile "=== start $(Get-Date -Format o) ==="
& opencode run --command db-security-auditor *>> $LogFile
Add-Content $LogFile "=== end $(Get-Date -Format o) exit=$LASTEXITCODE ==="
```

Registrar la tarea (una sola vez), con `schtasks`:

```powershell
schtasks /Create /F `
  /TN "OpenCode DB Security Audit" `
  /SC WEEKLY /D FRI /ST 22:00 `
  /TR "pwsh.exe -NoProfile -ExecutionPolicy Bypass -File \"C:\dev\06-open-daycare\db-security-audit.ps1\""
```

O con `Register-ScheduledTask`:

```powershell
$action = New-ScheduledTaskAction -Execute "pwsh.exe" `
  -Argument '-NoProfile -ExecutionPolicy Bypass -File "C:\dev\06-open-daycare\db-security-audit.ps1"' `
  -WorkingDirectory "C:\dev\06-open-daycare"
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Friday -At "22:00"
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable
Register-ScheduledTask -TaskName "OpenCode DB Security Audit" -Action $action -Trigger $trigger -Settings $settings
```

Comprobar la última ejecución:

```powershell
Get-ScheduledTaskInfo -TaskName "OpenCode DB Security Audit"
```

---

## 1.3 launchd (macOS - nativo)

`~/Library/LaunchAgents/tech.antonydev.opencode.db-security-audit.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>tech.antonydev.opencode.db-security-audit</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-lc</string>
    <string>exec "$HOME/.local/bin/db-security-audit.sh"</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Weekday</key><integer>5</integer>
    <key>Hour</key><integer>22</integer>
    <key>Minute</key><integer>0</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>/Users/antonydev/Library/Logs/opencode/db-security-audit.log</string>
  <key>StandardErrorPath</key>
  <string>/Users/antonydev/Library/Logs/opencode/db-security-audit.error.log</string>
  <key>RunAtLoad</key>
  <false/>
</dict>
</plist>
```

Cargar / probar / descargar:

```bash
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/tech.antonydev.opencode.db-security-audit.plist
launchctl kickstart -k gui/$(id -u)/tech.antonydev.opencode.db-security-audit   # prueba manual
launchctl bootout gui/$(id -u)/tech.antonydev.opencode.db-security-audit        # descargar
```

- `Weekday` 5 = viernes (0 y 7 = domingo).
- Reutiliza el wrapper de la sección 1 (PATH, HOME, `cd` y log).
- Si el Mac está dormido a las 22:00, launchd ejecuta la tarea al despertar; no se ejecuta durante el sueño.

---

## 2. Supabase Cron (pg_cron)

pg_cron ejecuta SQL **dentro de Postgres**: no tiene shell ni el repo, así que no puede correr `opencode` directamente. El patrón viable es usarlo como disparador remoto: `pg_cron` → `pg_net` (HTTP) → `repository_dispatch` de GitHub → workflow de la sección 3, que sí ejecuta al agente en un runner.

```sql
-- 1) Extensiones (ya disponibles en Supabase)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2) Guardar el PAT de GitHub en Vault (una sola vez)
--    Scope necesario: repo (PAT clásico) o Contents read/write (fine-grained).
select vault.create_secret('<github_pat>', 'github_dispatch_token');

-- 3) Job semanal: viernes 22:00 Europe/Madrid = 20:00 UTC en verano (21:00 UTC en invierno)
select cron.schedule(
  'db-security-audit-friday',
  '0 20 * * 5',
  $$
  select net.http_post(
    url     := 'https://api.github.com/repos/AntoniCut/02-devtalles--curso-opencode--06-open-daycare/dispatches',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'github_dispatch_token'),
      'Accept',        'application/vnd.github+json',
      'Content-Type',  'application/json'
    ),
    body    := jsonb_build_object('event_type', 'db-security-audit')
  );
  $$
);
```

Verificación y mantenimiento:

```sql
select jobid, jobname, schedule, active from cron.job;

select jobid, status, return_message, start_time, end_time
from cron.job_run_details
order by start_time desc
limit 5;

select id, status_code, content, created
from net._http_response
order by created desc
limit 5;

select cron.unschedule('db-security-audit-friday');
```

- pg_cron interpreta los horarios en **UTC** en Supabase; de ahí la conversión (con el mismo problema de DST que GitHub Actions).
- Alternativa sin `pg_net`: una Edge Function invocada por pg_cron que llame a la API de GitHub. Requiere desplegar y mantener la función.
- Este método solo tiene sentido si además existe el workflow de la sección 3.

---

## 3. GitHub Actions

Workflow programado que instala opencode y ejecuta el comando. La autenticación del MCP de Supabase se resuelve con un PAT por header (en CI no hay flujo OAuth de navegador), sobreescribiendo la config del repo con `OPENCODE_CONFIG_CONTENT`.

`.github/workflows/db-security-audit.yml`:

```yaml
name: DB Security Audit

on:
  schedule:
    - cron: "0 20 * * 5" # viernes 22:00 Europe/Madrid en verano (UTC+2); en invierno son las 21:00
  workflow_dispatch: {}
  repository_dispatch:
    types: [db-security-audit] # disparado por pg_cron (sección 2)

jobs:
  audit:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      issues: write # opcional: publicar el informe como issue
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6

      - name: Install opencode
        run: |
          curl -fsSL https://opencode.ai/install | bash
          echo "$HOME/.opencode/bin" >> "$GITHUB_PATH"

      - name: Run db-security-auditor
        env:
          OPENCODE_API_KEY: ${{ secrets.OPENCODE_API_KEY }}
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          OPENCODE_DISABLE_AUTOUPDATE: "true"
          OPENCODE_CONFIG_CONTENT: |
            {
              "mcp": {
                "supabase": {
                  "type": "remote",
                  "url": "https://mcp.supabase.com/mcp?project_ref=mdoftqngmqmijmowqqak&read_only=true&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching",
                  "oauth": false,
                  "enabled": true,
                  "headers": {
                    "Authorization": "Bearer {env:SUPABASE_ACCESS_TOKEN}"
                  }
                }
              }
            }
        run: opencode run --command db-security-auditor
```

Secrets necesarios en el repo (Settings → Secrets and variables → Actions):

- `OPENCODE_API_KEY`: ya existe (lo usa el workflow del GitHub agent).
- `SUPABASE_ACCESS_TOKEN`: PAT de Supabase (`sbp_...`).

Notas:

- `read_only=true` en el override del MCP es defensa en profundidad: aunque el job es solo auditoría, el agente no puede escribir en la base.
- El agente define el modelo `opencode-go/gpt-6-luna`; si la key no tiene acceso, fija otro con `--model opencode-go/deepseek-v4-flash-vision-exp` (el que ya usa el workflow existente).
- Cron de GitHub es **UTC** y no ajusta DST: `0 20 * * 5` son las 22:00 en verano y las 21:00 en invierno. Si prefieres clavarlo en invierno, usa `0 21 * * 5` (23:00 en verano).
- Los workflows programados se pausan tras 60 días sin actividad en el repo; `workflow_dispatch` permite relanzarlo a mano desde la pestaña Actions.
- El informe queda en el log del run. Opcional, publicarlo como issue:

```yaml
      - name: Run db-security-auditor
        run: opencode run --command db-security-auditor 2>&1 | tee report.md

      - name: Publish report as issue
        if: always()
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh issue create \
            --title "DB security audit $(date -I)" \
            --body-file report.md
```

- La acción oficial `anomalyco/opencode/github@latest` también soporta eventos `schedule` con un `prompt` obligatorio, pero su input `agent` debe ser un agente primario y `db-security-auditor` es un subagente; por eso aquí se usa el CLI directamente.

---

## 4. Resumen

| Opción | Hora | Dónde corre | Requisitos | Elegirla si... |
| --- | --- | --- | --- | --- |
| Cron del sistema | 22:00 local exacta | Tu máquina Linux/macOS | opencode + auth + MCP OAuth | El equipo está encendido a esa hora |
| Task Scheduler | 22:00 local exacta | Tu PC Windows | opencode + auth + MCP OAuth | Prefieres GUI en Windows |
| PowerShell + task | 22:00 local exacta | Tu PC Windows | opencode + auth + MCP OAuth | Quieres versionar el script |
| launchd | 22:00 local (o al despertar) | Tu Mac | opencode + auth + MCP OAuth | Es tu equipo principal |
| pg_cron | 20:00 UTC | Postgres → GitHub | pg_net + Vault + PAT GitHub + workflow | Quieres el disparo desde Supabase |
| GitHub Actions | 20:00 UTC | Runner de GitHub | `OPENCODE_API_KEY` + `SUPABASE_ACCESS_TOKEN` | No quieres depender de tu equipo |

Mantenimiento:

- Si caduca el OAuth del MCP local: `opencode mcp auth supabase`.
- Revisar los logs tras cada ejecución; el informe no se envía por correo ni se publica solo (salvo el paso opcional de issue).
- Actualizar opencode cuando haga falta con `opencode upgrade`.
