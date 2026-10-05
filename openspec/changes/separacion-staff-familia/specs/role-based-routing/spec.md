# Spec Delta

## Purpose

Define las rutas, los shells y las reglas de acceso por rol (staff/admin vs. familia) para que cada audiencia use únicamente su sección de la aplicación.

## ADDED Requirements

### Requirement: Rutas por audiencia

El sistema SHALL exponer las pantallas de guardería bajo `/staff/*` y las de familia bajo `/familia/*`. Cada sección SHALL tener su ruta raíz (`/staff`, `/familia`) como home.

#### Scenario: Home de staff

- **WHEN** un usuario con rol `staff` o `admin` abre `/staff`
- **THEN** ve el feed de la guardería con el shell de staff

#### Scenario: Pantallas operativas de staff

- **WHEN** un usuario staff abre `/staff/kids`, `/staff/kids/[slug]`, `/staff/agregar-nino`, `/staff/vincular-padre`, `/staff/crear-publicacion` o `/staff/pokemon`
- **THEN** cada pantalla resuelve la ruta y funciona como lo hacía antes del cambio

#### Scenario: Home de familia

- **WHEN** un padre abre `/familia`
- **THEN** ve el feed de familia con el shell de familia

### Requirement: Dispatcher de la raíz por rol

La ruta `/` SHALL redirigir a cada usuario autenticado al home de su sección: `/staff` para staff/admin y `/familia` para padres. Sin sesión, SHALL redirigir a `/login`.

#### Scenario: Staff abre la raíz

- **WHEN** un usuario staff abre `/`
- **THEN** el sistema lo redirige a `/staff`

#### Scenario: Padre abre la raíz

- **WHEN** un padre abre `/`
- **THEN** el sistema lo redirige a `/familia`

#### Scenario: Visitante sin sesión abre la raíz

- **WHEN** un visitante sin sesión abre `/`
- **THEN** el sistema lo redirige a `/login`

### Requirement: Redirect por rol tras autenticarse

Tras iniciar sesión o activar una cuenta, el sistema SHALL llevar al usuario al home de su rol, ignorando un `next` que apunte a la sección del otro rol.

#### Scenario: Login de staff

- **WHEN** un usuario staff inicia sesión con credenciales válidas
- **THEN** aterriza en `/staff`

#### Scenario: Activación de padre

- **WHEN** un padre activa su cuenta con un código válido
- **THEN** aterriza en `/familia`

#### Scenario: next de la otra sección

- **WHEN** un padre inicia sesión con `?next=/staff/kids`
- **THEN** el sistema lo redirige a `/familia`

### Requirement: Guard de la sección de staff

El sistema SHALL impedir que un padre acceda a `/staff/*` y SHALL redirigirlo a `/familia`. La verificación SHALL aplicar tanto en el proxy como en las páginas server.

#### Scenario: Padre intenta abrir la sección de staff

- **WHEN** un padre navega a `/staff/kids`
- **THEN** el sistema lo redirige a `/familia`

### Requirement: Guard de la sección de familia

El sistema SHALL impedir que usuarios staff o admin accedan a `/familia/*` y SHALL redirigirlos a `/staff`.

#### Scenario: Staff intenta abrir la sección de familia

- **WHEN** un usuario staff navega a `/familia`
- **THEN** el sistema lo redirige a `/staff`

### Requirement: Rol confiable

La resolución del rol SHALL basarse en `app_metadata.role` del token y, como respaldo, en `public.users.role`. Datos editables por el usuario (`user_metadata`) SHALL NOT otorgar acceso a una sección.

#### Scenario: Metadata editable no cambia de sección

- **WHEN** un padre modifica su `user_metadata.role` a `staff` e intenta abrir `/staff`
- **THEN** el sistema lo mantiene en `/familia`

#### Scenario: Rol ausente en el token

- **WHEN** el token no trae `app_metadata.role`
- **THEN** el sistema resuelve el rol desde `public.users`

### Requirement: Shell por audiencia

Cada sección SHALL renderizar su propia barra lateral. El shell de staff SHALL mostrar el subtítulo "Sala Soles", el botón "Nueva publicación" y la navegación de guardería; el shell de familia SHALL mostrar el subtítulo "Familia" y la navegación Feed / Resumen del día / Mi cuenta, sin botón de nueva publicación.

#### Scenario: Shell de staff

- **WHEN** un usuario staff navega a cualquier ruta `/staff/*`
- **THEN** la barra lateral muestra "Sala Soles", "Nueva publicación" y la navegación de guardería

#### Scenario: Shell de familia

- **WHEN** un padre navega a cualquier ruta `/familia/*`
- **THEN** la barra lateral muestra "Familia" y la navegación Feed / Resumen del día / Mi cuenta, sin botón de nueva publicación

### Requirement: Navegación interna por sección

Los enlaces de cada shell y de sus pantallas SHALL apuntar a rutas de la misma sección (`/staff/*` o `/familia/*`); ningún enlace interno SHALL apuntar a una sección ajena.

#### Scenario: Enlaces del shell de staff

- **WHEN** un usuario staff usa la navegación del shell (Feed, Niños, Pokémon, Avisos, Mi cuenta)
- **THEN** cada enlace apunta a su ruta bajo `/staff`

#### Scenario: Enlaces del shell de familia

- **WHEN** un padre usa la navegación del shell (Feed, Resumen del día, Mi cuenta)
- **THEN** cada enlace apunta a su ruta bajo `/familia`

### Requirement: Sin redirects de URLs anteriores

Las rutas de staff previas al cambio (`/kids`, `/crear-publicacion`, etc.) SHALL NOT resolver ni redirigir; el sistema SHALL actualizar todos los enlaces internos al prefijo `/staff`.

#### Scenario: URL anterior

- **WHEN** un usuario abre una ruta antigua de staff, como `/kids`
- **THEN** el sistema responde 404 y no lo redirige
