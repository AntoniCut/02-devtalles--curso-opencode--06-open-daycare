# family-feed Specification

## Purpose

Muestra a la familia el día de sus hijos: las publicaciones visibles para el padre (las etiquetadas a sus hijos y los anuncios de la sala), con filtro por hijo y la presentación del mockup `familia-feed.dc.html`.

## Requirements

### Requirement: Feed de familia

La página `/familia` SHALL mostrar las publicaciones visibles para el padre según la RLS (las que etiquetan a sus hijos y los anuncios de la sala de sus hijos), ordenadas de la más reciente a la más antigua.

#### Scenario: Publicaciones de los hijos

- **WHEN** un padre abre `/familia`
- **THEN** ve las publicaciones que etiquetan a sus hijos y los anuncios de su sala, de la más reciente a la más antigua

#### Scenario: Publicación de un niño ajeno

- **WHEN** existe una publicación que solo etiqueta a un niño sin vínculo con el padre
- **THEN** esa publicación no aparece en su feed

### Requirement: Agrupación y separador por día

El feed SHALL agrupar las publicaciones por día y SHALL mostrar un separador con el formato "HOY · {FECHA}" (por ejemplo, "HOY · MARTES 17 JUN") en la zona horaria de la guardería.

#### Scenario: Publicaciones de hoy

- **WHEN** el feed tiene publicaciones de hoy
- **THEN** el separador muestra "HOY · " seguido de la fecha en mayúsculas

### Requirement: Saludo de familia

El encabezado SHALL mostrar la etiqueta "TU FAMILIA", el saludo "Hola, {primer nombre del padre}" y la línea "Así va el día de hoy".

#### Scenario: Encabezado con el nombre real

- **WHEN** Lucía abre `/familia`
- **THEN** el encabezado muestra "TU FAMILIA", "Hola, Lucía" y "Así va el día de hoy"

### Requirement: Filtro por hijo

El feed SHALL mostrar un pill por cada hijo vinculado al padre más una opción "Todos". Al seleccionar un hijo, SHALL mostrar solo las publicaciones que lo etiquetan más los anuncios de su sala; al seleccionar "Todos", SHALL mostrar todo lo visible.

#### Scenario: Filtro por un hijo

- **WHEN** el padre selecciona el pill de Mateo
- **THEN** el feed muestra las publicaciones etiquetadas a Mateo y los anuncios de su sala, y oculta las de sus otros hijos

#### Scenario: Ver todo

- **WHEN** el padre selecciona "Todos"
- **THEN** el feed muestra las publicaciones de todos sus hijos y los anuncios

### Requirement: Card de publicación de familia

Cada publicación SHALL renderizarse en un card con el nombre del niño (o "Anuncio general" si es un anuncio de sala), la hora, el autor como "Maestra {nombre}", el nombre de la sala, un badge con el tipo en español (Logro, Actividad, Anuncio, …), el cuerpo y las fotos cuando existan. En esta iteración el card SHALL NOT mostrar contadores de reacciones ni de comentarios.

#### Scenario: Logro de un hijo

- **WHEN** el feed muestra una publicación de tipo `achievement` etiquetada a Mateo
- **THEN** el card muestra "Mateo", la hora, "Maestra Caro · Sala Soles", el badge "LOGRO" y el cuerpo

#### Scenario: Publicación con foto

- **WHEN** el feed muestra una publicación con fotos
- **THEN** el card muestra las fotos del bucket privado mediante URLs firmadas

#### Scenario: Anuncio de sala

- **WHEN** el feed muestra una publicación de tipo `announcement`
- **THEN** el card muestra "Anuncio general" y el badge "ANUNCIO"

#### Scenario: Sin contadores

- **WHEN** el feed muestra cualquier publicación
- **THEN** el card no muestra corazones ni contadores de comentarios

### Requirement: Barra lateral de familia con parentesco

La barra lateral de familia SHALL mostrar el nombre del padre y su parentesco con el hijo en el formato "{parentesco} de {nombre del hijo}" (por ejemplo, "Mamá de Mateo"), usando las etiquetas `mother` → "Mamá", `father` → "Papá", `guardian` → "Tutor/a".

#### Scenario: Madre con un hijo vinculado

- **WHEN** Lucía, madre de Mateo, ve la barra lateral de familia
- **THEN** su línea muestra "Lucía Fernández" y "Mamá de Mateo"
