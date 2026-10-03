/*
    *  -----------------------------------------------------------  *
    *  -----  login-form.tsx  --  /app/(auth)/login/login-form.tsx  -----  *
    *  -----------------------------------------------------------  *
*/
"use client";

import { useActionState, useId, useState } from "react";
import type { ReactElement } from "react";
import { login, type LoginState } from "@/app/(auth)/login/actions";

/** - `estado inicial del formulario de login` */
const initialLoginState: LoginState = { error: null };

/** - `mensajes siempre accesibles sin motion: anillo de foco comun para inputs` */
const inputFocusClass = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B0462B]";

/**
 * --------------------------------
 * -----  `LoginForm()`  -----
 * --------------------------------
 * - Formulario de inicio de sesión (Client Component) que ejecuta la Server Action
 * - `login` con `useActionState`; mantiene idéntico el estilo del mockup.
 * - Accesibilidad: autocomplete (1.3.5), errores con aria-describedby (3.3.1),
 *   foco visible (2.4.7), estado "pendiente" anunciado con role=status (4.1.3).
 * - `next` llega desde el server component (`?next=` del proxy) como hidden input.
 */
const LoginForm = ({ next }: { next?: string }): ReactElement => {
  const [state, formAction, pending] = useActionState(login, initialLoginState);
  const errorId = useId();
  const [showRecoveryHint, setShowRecoveryHint] = useState(false);

  return (
    <form action={formAction}>
      <input type="hidden" name="next" value={next ?? ""} />

      <label htmlFor="login-email" className="mb-[9px] block text-[12px] font-bold tracking-[.7px] text-[#6E6359]">
        EMAIL
      </label>
      <input
        id="login-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        aria-describedby={state.error ? errorId : undefined}
        defaultValue="caro@opendaycare.com"
        className={`mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#9C8A73] bg-white px-4 py-[14px] text-[15px] text-[#3F362E] placeholder:text-[#7A6E61] ${inputFocusClass}`}
      />

      <label htmlFor="login-password" className="mb-[8px] block text-[12px] font-bold tracking-[.7px] text-[#6E6359]">
        CONTRASEÑA
      </label>
      <input
        id="login-password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        aria-describedby={state.error ? errorId : undefined}
        placeholder="••••••••"
        className={`mb-[10px] w-full rounded-[14px] border-[1.5px] border-[#9C8A73] bg-white px-4 py-[14px] text-[15px] text-[#3F362E] placeholder:text-[#7A6E61] ${inputFocusClass}`}
      />

      {/*  -----  recuperar contraseña (sin ruta todavía: guia al usuario con un status)  -----  */}
      <div className="mb-5 text-right">
        <button
          type="button"
          onClick={() => setShowRecoveryHint(true)}
          className="py-[3px] text-[13.5px] font-bold text-[#B0462B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B0462B]"
        >
          ¿Olvidaste tu contraseña?
        </button>
      </div>
      {showRecoveryHint && (
        <p role="status" className="mb-4 text-[13px] text-[#6E6359]">
          Contactá al staff de la guardería para restablecer tu contraseña.
        </p>
      )}

      {/*  -----  error de credenciales  -----  */}
      {state.error && (
        <p id={errorId} role="alert" className="mb-4 rounded-[12px] bg-[#FBEAE5] px-4 py-3 text-[13.5px] font-bold text-[#B0462B]">
          {state.error}
        </p>
      )}

      {/*  -----  estado pendiente anunciado a lectores de pantalla (4.1.3)  -----  */}
      {pending && <span role="status" className="sr-only">Iniciando sesión…</span>}

      <button
        type="submit"
        disabled={pending}
        className={`block w-full rounded-[15px] bg-linear-to-b/srgb from-[#F4977E] to-[#EE8164] py-[15px] text-center text-[16px] font-extrabold text-[#4A2A1D] shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B0462B] disabled:opacity-60`}
      >
        {pending ? "Ingresando…" : "Iniciar sesión"}
      </button>
    </form>
  );
};

export default LoginForm;
