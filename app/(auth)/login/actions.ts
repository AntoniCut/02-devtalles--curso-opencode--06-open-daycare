/*
    *  -------------------------------------------------------  *
    *  -----  actions.ts  --  /app/(auth)/login/actions.ts  -----  *
    *  -------------------------------------------------------  *
*/
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { isInternalPath } from "@/lib/auth";

/** - `estado que devuelve la Server Action de login al formulario` */
export interface LoginState {
  error: string | null;
}

/** - `ruta interna por defecto tras iniciar sesión` */
const DEFAULT_REDIRECT = "/";

/**
 * --------------------------------
 * -----  `login()`  -----
 * --------------------------------
 * - Server Action de inicio de sesión con email y contraseña contra Supabase Auth.
 * - En error devuelve `LoginState` para que el formulario lo muestre; al éxito
 *   redirige a `next` (si es ruta interna) o a `/`.
 */
export const login = async (_prevState: LoginState, formData: FormData): Promise<LoginState> => {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!email || !password) {
    return { error: "Ingresá tu email y contraseña." };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email o contraseña incorrectos." };
  }

  const target = next && isInternalPath(next) ? next : DEFAULT_REDIRECT;

  //  -----  redirect fuera del try para no tragar su error  -----
  redirect(target);
};

/**
 * --------------------------------
 * -----  `logout()`  -----
 * --------------------------------
 * - Server Action de cierre de sesión: invalida la sesión en Supabase Auth,
 * - borra las cookies y devuelve a `/login`.
 */
export const logout = async (): Promise<void> => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  await supabase.auth.signOut();

  redirect("/login");
};
