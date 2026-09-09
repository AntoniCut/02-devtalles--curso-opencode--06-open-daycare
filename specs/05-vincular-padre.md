# SPEC 05 — Pantalla `/vincular-padre`

> **Estado:** Aprovado
> **Depende de:** SPEC 02
> **Fecha:** 2026-09-09
> **Objetivo:** Portar la maqueta `references/pantallas/vincular-padre.dc.html` a la ruta `/vincular-padre` como formulario funcional con validación de requeridos y estilo idéntico.

## Scope

**In:**

- Ruta `/vincular-padre` (`app/vincular-padre/page.tsx`): página standalone (sin sidebar), tarjeta centrada (max-width 480px, `#FBF4EC`, borde `#ECE0D0`, radius 24px, sombra) sobre fondo `#F6ECDF`, con `metadata` propia.
- Header de la tarjeta: "Vincular padre" (Fredoka 600 18px) con subtítulo "a Mateo Fernández" (13px `#A89A8B`, **estático**) a la izquierda, y botón X (34×34px, radius 10px, `#F0E6D8`, icono `#94887B`) que navega a `/kids/mateo-fernandez` con `next/link`; separados por border-bottom `#ECE0D0`.
- Banner informativo azul (`#E3ECFB`, radius 14px): icono info `#4E72C8` + texto "Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de Mateo." en `#3F5694`.
- Formulario (client component `components/link-parent-form.tsx`): Nombre del padre/madre (placeholder "Ej. Diego Fernández") y Email (placeholder "correo@ejemplo.com"), con labels 12px extrabold tracking `.7px` `#94887B` e inputs blancos radius 14px borde 1.5px `#EADFD0` (texto 15px, placeholders `#B6A99B`).
- **Parentesco**: 3 pills flex (Mamá / Papá / Tutor/a) radius 999px; seleccionada → fondo `#CCD8F4`, borde `#9FB8EC`, texto `#4E72C8`; no seleccionada → `#FFFDF9` / `#ECE0D0` / `#6E6359`; **Mamá preseleccionada** (mockup) y clic cambia la selección.
- **Tarjeta de código de invitación**: fondo `#FBF1D6`, borde dashed `#E6D08A`, radius 16px; label "CÓDIGO DE INVITACIÓN" `#A88526`, código **7K4P9** (Fredoka 600 34px, letter-spacing 7px, `#8A7234`), "Vence en 7 días" — todo estático.
- CTA "Enviar invitación": gradiente `#F4977E→#EE8164`, radius 14px, sombra `rgba(238,129,100,.7)`, icono send; **valida** y navega a `/kids/mateo-fernandez` con `next/link`.
- **Validación al enviar**: Nombre requerido; Email requerido y con formato de email. Errores: borde `#D9583C` + mensaje `#D9583C` bajo el campo ("Campo requerido" / "Email inválido"); el error se limpia al corregir el campo.

**Out of scope (para specs futuros):**

- Persistir la invitación, enviar correo real, API y autenticación.
- Header dinámico por niño vía searchParams (decisión del usuario: estático).
- Generar el código aleatoriamente (decisión del usuario: 7K4P9 estático).
- Estados de envío/loading o toast de éxito tras enviar.
- Responsive móvil/tablet y modo oscuro.

## Data model

```ts
// components/link-parent-form.tsx (estado interno del form)
interface FormState {
  name: string;                          // ""
  email: string;                         // ""
  relation: "Mamá" | "Papá" | "Tutor/a"; // "Mamá" (mockup, nunca falla validación)
}

interface FormErrors {
  name?: string;   // "Campo requerido"
  email?: string;  // "Campo requerido" | "Email inválido"
}
```

No se crea ni modifica `lib/`: el código es estático y `lib/kids.ts` (SPEC 02) ya tiene a Mateo Fernández. Identificadores en inglés; strings de UI en español (mockup), igual que en SPEC 01–04.

## Implementation plan

1. `components/link-parent-form.tsx` ("use client"): tarjeta completa — header (X `next/link` a `/kids/mateo-fernandez`, título + subtítulo), banner azul, inputs Nombre/Email, pills de Parentesco seleccionables, tarjeta de código 7K4P9 y CTA "Enviar invitación". Test manual: `pnpm dev` → `/vincular-padre` idéntica a la maqueta.
2. Validación en submit: Nombre requerido; Email requerido + formato; estado de errores con borde `#D9583C` y mensaje bajo el campo; limpiar error al editar el campo; válido → `router.push("/kids/mateo-fernandez")`.
3. `app/vincular-padre/page.tsx`: wrapper centrado (`min-h-screen`, padding 40px 24px, `bg-[#F6ECDF]`) + `metadata` "Vincular padre · OpenDayCare" (patrón SPEC 04).
4. Verificación visual con Playwright contra `vincular-padre.dc.html` renderizado (no existe screenshot PNG) + prueba manual de los 3 errores y del flujo válido → perfil + `pnpm lint` + `pnpm build`.

## Acceptance criteria

- [ ] `/vincular-padre` renderiza la tarjeta centrada (max-w 480px, `#FBF4EC`, borde `#ECE0D0`, radius 24px, sombra) visualmente idéntica a `vincular-padre.dc.html`.
- [ ] Header con "Vincular padre" (Fredoka 600 18px) + "a Mateo Fernández" (13px `#A89A8B`) y botón X (34×34, radius 10px, `#F0E6D8`, icono `#94887B`) que navega a `/kids/mateo-fernandez` con `next/link`.
- [ ] Banner azul `#E3ECFB` radius 14px con icono info `#4E72C8` y el texto del mockup en `#3F5694`.
- [ ] Labels 12px extrabold tracking `.7px` `#94887B`; inputs padding 13px/16px, radius 14px, borde 1.5px `#EADFD0`, fondo blanco, texto 15px; placeholders `#B6A99B`.
- [ ] Parentesco: 3 pills (Mamá, Papá, Tutor/a); Mamá preseleccionada (`#CCD8F4`/`#9FB8EC`/`#4E72C8`); al hacer clic en otra pill cambia la selección.
- [ ] Tarjeta de código: fondo `#FBF1D6`, borde dashed `#E6D08A`, radius 16px; "CÓDIGO DE INVITACIÓN" `#A88526`; código `7K4P9` Fredoka 600 34px tracking 7px `#8A7234`; "Vence en 7 días" `#A88526`.
- [ ] CTA "Enviar invitación" con gradiente `#F4977E→#EE8164`, radius 14px, sombra e icono send, a ancho completo.
- [ ] Submit vacío muestra 2 errores (borde `#D9583C` + "Campo requerido") en Nombre y Email; **no** navega.
- [ ] Email con formato inválido (ej. `hola@`) muestra "Email inválido"; un email válido lo pasa.
- [ ] Al corregir un campo con error, su error desaparece.
- [ ] Formulario válido → navega a `/kids/mateo-fernandez`.
- [ ] `metadata` propia ("Vincular padre · OpenDayCare"); consola sin errores ni warnings de hidratación.
- [ ] `pnpm lint` y `pnpm build` sin errores.

## Decisions

- **Sí:** ruta `/vincular-padre` — el link "Vincular otro padre" del perfil (`app/kids/[slug]/page.tsx:205`) ya apunta ahí.
- **Sí:** formulario client component con parentesco seleccionable y validación de requeridos (decisión del usuario; patrón SPEC 04, a diferencia del mock estático de SPEC 03).
- **Sí:** header estático "a Mateo Fernández" (decisión del usuario) — fiel al mockup y sin modificar la pantalla del SPEC 02.
- **Sí:** código 7K4P9 y "Vence en 7 días" estáticos (decisión del usuario) — fidelidad al mockup.
- **Sí:** Mamá preseleccionada (mockup) — por eso Parentesco no participa en la validación.
- **No:** `?kid=<slug>` dinámico — modifica SPEC 02 sin beneficio inmediato en un mock sin persistencia.
- **No:** código de invitación generado aleatorio — rompería la comparación visual y no hay backend que lo consuma.
- **No:** persistencia o envío real de correo — sin base de datos ni API (mock estático).

## Risks

| Riesgo | Mitigación |
| --- | --- |
| No hay screenshot PNG de esta pantalla | Comparar contra `vincular-padre.dc.html` renderizado con Playwright (mismo enfoque que SPEC 02/03/04). |
| Next 16 + React 19 difieren de los datos de entrenamiento | Leer `node_modules/next/dist/docs/` antes de escribir código (exigido por AGENTS.md). |
| Body del root layout es `flex flex-col` | Wrapper `min-h-screen` propio de la página (patrón SPEC 03/04) y verificar en la comparación visual. |
| Gradiente y sombra del CTA no salen igual en Tailwind | Arbitrary values (`bg-[linear-gradient(...)]`, `shadow-[...]`) y verificación visual pixel a pixel. |

## What is **not** in this spec

- Persistir la invitación, envío real de correo, API, autenticación.
- Header dinámico por niño y código de invitación generado.
- Estados loading/éxito o toast.
- Responsive móvil/tablet y modo oscuro.

Cada uno de esos, si aterriza, va en su propio spec.
