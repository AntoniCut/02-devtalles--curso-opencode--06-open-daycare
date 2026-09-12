/*
    *  -----------------------------------------------------------  *
    *  -----  login-form.tsx  --  /app/(auth)/login/login-form.tsx  -----  *
    *  -----------------------------------------------------------  *
*/
"use client";

import { useActionState } from "react";
import type { ReactElement } from "react";
import { login, type LoginState } from "@/app/(auth)/login/actions";

/** - `estado inicial del formulario de login` */
const initialLoginState: LoginState = { error: null };

/**
 * --------------------------------
 * -----  `LoginForm()`  -----
 * --------------------------------
 * - Formulario de inicio de sesión (Client Component) que ejecuta la Server Action
 * - `login` con `useActionState`; mantiene idéntico el estilo del mockup.
 * - `next` llega desde el server component (`?next=` del proxy) como hidden input.
 */
const LoginForm = ({ next }: { next?: string }): ReactElement => {
  const [state, formAction, pending] = useActionState(login, initialLoginState);

  return (
    <form action={formAction}>
      <input type="hidden" name="next" value={next ?? ""} />

      <label htmlFor="login-email" className="mb-[9px] block text-[12px] font-bold tracking-[.7px] text-[#94887B]">
        EMAIL
      </label>
      <input
        id="login-email"
        name="email"
        type="email"
        required
        defaultValue="caro@opendaycare.com"
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] text-[#3F362E] placeholder:text-[#B6A99B] focus:outline-none"
      />

      <label htmlFor="login-password" className="mb-[8px] block text-[12px] font-bold tracking-[.7px] text-[#94887B]">
        CONTRASEÑA
      </label>
      <input
        id="login-password"
        name="password"
        type="password"
        required
        placeholder="••••••••"
        className="mb-[10px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] text-[#3F362E] placeholder:text-[#B6A99B] focus:outline-none"
      />

      {/*  -----  recuperar contraseña (estático, sin ruta aún)  -----  */}
      <div className="mb-5 text-right">
        <span className="cursor-pointer text-[13.5px] font-bold text-[#C5503A]">¿Olvidaste tu contraseña?</span>
      </div>

      {/*  -----  error de credenciales  -----  */}
      {state.error && (
        <p role="alert" className="mb-4 rounded-[12px] bg-[#FBEAE5] px-4 py-3 text-[13.5px] font-bold text-[#C5503A]">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="block w-full rounded-[15px] bg-linear-to-b/srgb from-[#F4977E] to-[#EE8164] py-[15px] text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] disabled:opacity-60"
      >
        {pending ? "Ingresando…" : "Iniciar sesión"}
      </button>
    </form>
  );
};

export default LoginForm;
