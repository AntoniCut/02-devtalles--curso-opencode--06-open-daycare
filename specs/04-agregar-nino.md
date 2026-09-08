# SPEC 04 — Pantalla `/agregar-nino`

> **Estado:** Aprovado
> **Depende de:** SPEC 02
> **Fecha:** 2026-09-08
> **Objetivo:** Portar la maqueta `references/pantallas/agregar-nino.dc.html` a la ruta `/agregar-nino` como formulario funcional con validación de requeridos, máscara de fecha dd/mm/aaaa y salas hardcodeadas, con estilo idéntico.

## Scope

**In:**

- Ruta `/agregar-nino` (`app/agregar-nino/page.tsx`): página standalone (sin sidebar), tarjeta centrada (max-width 520px, `#FBF4EC`, borde `#ECE0D0`, radius 24px) sobre fondo `#F6ECDF`, con `metadata` propia.
- Header de la tarjeta: "Cancelar" (link a `/kids`, `#94887B`), título "Agregar niño" (Fredoka 600 18px) y "Guardar" (`#D9583C`), separados por border-bottom `#ECE0D0`.
- Formulario (client component `components/add-kid-form.tsx`): Nombre completo, Fecha de nacimiento, Sala, Alergias (etiquetas) y Notas médicas, con labels 12px extrabold tracking `.7px` `#94887B` e inputs blancos radius 14px borde 1.5px `#EADFD0`.
- **Máscara dd/mm/aaaa** en la fecha: input controlado que solo acepta dígitos, inserta `/` automáticamente tras dd y mm, máximo 10 caracteres, placeholder "dd/mm/aaaa".
- **Validación al guardar**: Nombre y Sala requeridos; Fecha requerida y con formato `\d{2}/\d{2}/\d{4}` (solo formato). Errores: borde `#D9583C` + mensaje pequeño `#D9583C` bajo el campo ("Campo requerido" / "Formato inválido (dd/mm/aaaa)"). El error del campo se limpia al corregirlo.
- Formulario válido → `Guardar` navega a `/kids` (sin persistir el niño).
- Sala: `<select>` nativo estilizado con `appearance-none` y chevron `#B0A290` (igual al mockup), arranca vacío con placeholder "Seleccionar sala…" y opciones **Soles**, **Estrellas**, **Lunas** hardcodeadas en `lib/kids.ts`.
- Alergias y Notas médicas sin validación (opcionales).

**Out of scope (para specs futuros):**

- Persistir el niño nuevo — la lista de `/kids` sigue siendo el mock de 8 (sin base de datos).
- Validación de fecha real del calendario o "no futura" — solo formato (decisión del usuario).
- Autenticación, API y estados de envío/loading.
- Dropdown custom accesible — select nativo estilizado.
- Responsive móvil/tablet y modo oscuro.

## Data model

```ts
// lib/kids.ts (agregado)
export const classrooms: string[] = ["Soles", "Estrellas", "Lunas"];

// components/add-kid-form.tsx (estado interno del form)
interface FormState {
  name: string;       // ""
  birthDate: string;  // "" → máscara "dd/mm/aaaa"
  classroom: string;  // "" hasta seleccionar
  allergies: string;  // ""
  notes: string;      // ""
}
```

Identificadores en inglés; strings de UI en español (provienen del mockup), igual que en SPEC 01/02/03.

## Implementation plan

1. `lib/kids.ts`: exportar `classrooms` con las 3 salas.
2. `components/add-kid-form.tsx` ("use client"): tarjeta completa — header (Cancelar `next/link` a `/kids`, título, Guardar), inputs Nombre/Fecha/Alergias, select de Sala estilizado con chevron, textarea Notas. Test manual: `pnpm dev` → `/agregar-nino` idéntica a la maqueta.
3. Máscara de fecha: valor derivado de dígitos (strip no-dígitos, máx 8, `/` tras posiciones 2 y 4), `inputMode="numeric"`, `maxLength={10}`. Test: escribir `08092026` muestra `08/09/2026`.
4. Validación en submit: requeridos nombre/fecha/sala + regex de formato de fecha; estado de errores con borde `#D9583C` y mensaje bajo el campo; limpiar error al editar el campo; válido → `router.push("/kids")`.
5. `app/agregar-nino/page.tsx`: wrapper centrado (`min-h-screen`, padding 40px 24px) + `metadata`. Verificar riesgo del body `flex flex-col` del root layout (patrón SPEC 03).
6. Verificación visual con Playwright contra `agregar-nino.dc.html` renderizado (no existe screenshot PNG) + prueba manual de los 3 errores y del flujo válido → `/kids` + `pnpm lint` + `pnpm build`.

## Acceptance criteria

- [ ] `/agregar-nino` renderiza la tarjeta centrada (max-w 520px, `#FBF4EC`, borde `#ECE0D0`, radius 24px, sombra) visualmente idéntica a `agregar-nino.dc.html`.
- [ ] Header con "Cancelar" (`#94887B`, bold 15px), "Agregar niño" (Fredoka 600 18px) y "Guardar" (`#D9583C`, extrabold 15px), border-bottom `#ECE0D0`.
- [ ] Labels 12px extrabold tracking `.7px` `#94887B`; inputs padding 13px/16px, radius 14px, borde 1.5px `#EADFD0`, fondo blanco, texto 15px.
- [ ] Fecha y Sala comparten fila (flex, gap 14px, cada una `flex:1`).
- [ ] Placeholder gris `#B6A99B` en todos los campos vacíos ("Ej. Martina López", "dd/mm/aaaa", "Ej. Maní, Lactosa", "Indicaciones, medicación, contactos…").
- [ ] Escribir `08092026` en la fecha muestra `08/09/2026`; solo acepta dígitos y máximo 10 caracteres.
- [ ] Submit con campos vacíos muestra 3 errores (borde `#D9583C` + "Campo requerido") en Nombre, Fecha y Sala; **no** navega.
- [ ] Fecha `12/13/2022` muestra "Formato inválido (dd/mm/aaaa)"; `12/11/2022` pasa (solo formato, sin validar calendario).
- [ ] Al corregir un campo con error, su error desaparece.
- [ ] Sala: select nativo estilizado con chevron `#B0A290`, placeholder "Seleccionar sala…" en gris, opciones Soles, Estrellas y Lunas.
- [ ] Formulario válido → "Guardar" navega a `/kids`; "Cancelar" navega a `/kids` con `next/link`.
- [ ] Alergias y Notas médicas se envían sin validación.
- [ ] `metadata` propia ("Agregar niño · OpenDayCare"); consola sin errores ni warnings de hidratación.
- [ ] `pnpm lint` y `pnpm build` sin errores.

## Decisions

- **Sí:** ruta `/agregar-nino` — el botón "Agregar niño" de `/kids` (SPEC 02) ya apunta ahí.
- **Sí:** formulario client component; "Guardar" valida y navega a `/kids` sin persistir (mock estático, patrón SPEC 02/03).
- **Sí:** errores con borde `#D9583C` + mensaje bajo el campo — paleta existente, feedback claro sin romper el estilo.
- **Sí:** validación de fecha **solo formato** `\d{2}/\d{2}/\d{4}` (decisión explícita del usuario: no valida calendario ni fecha futura).
- **Sí:** salas Soles/Estrellas/Lunas en `lib/kids.ts` (dominio kids, reutilizable); Soles ya existe en el mock de los 8 niños.
- **Sí:** select nativo estilizado (`appearance-none` + chevron absoluto) — accesible y se ve idéntico al mockup.
- **Sí:** select arranca vacío "Seleccionar sala…" (decisión del usuario) — hace real la validación de requerido; única divergencia visual menor vs mockup.
- **No:** `<input type="date">` nativo — impone el calendario/UI del navegador y rompe la fidelidad visual.
- **No:** librería de máscaras externa — dependencia innecesaria para 8 dígitos y 2 slashes.
- **No:** dropdown custom — accesibilidad manual y más código sin beneficio visual.
- **No:** agregar el niño a la lista de `/kids` — sin persistencia; requiere convertir la lista a estado de cliente.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| No hay screenshot PNG de esta pantalla | Comparar contra `agregar-nino.dc.html` renderizado con Playwright (mismo enfoque que SPEC 02/03). |
| Next 16 + React 19 difieren de los datos de entrenamiento | Leer `node_modules/next/dist/docs/` antes de escribir código (exigido por AGENTS.md). |
| `<select>` nativo no soporta `::placeholder` | Clase condicional según `value === ""` para pintar el placeholder `#B6A99B`. |
| Body del root layout es `flex flex-col` | Wrapper `min-h-screen` propio de la página y verificar en la comparación visual. |

## What is **not** in this spec

- Persistir el niño nuevo (la lista de `/kids` sigue siendo mock).
- Autenticación, base de datos, API.
- Resumen del día, vincular padre, avisos, mi cuenta, crear publicación, parent-feed.
- Responsive móvil/tablet y modo oscuro.

Cada uno de esos, si aterriza, va en su propio spec.
