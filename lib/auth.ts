/*
    *  ---------------------------------  *
    *  -----  auth.ts  --  /lib/auth.ts  -----  *
    *  ---------------------------------  *
*/

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

/** - `usuario autenticado (claims de la sesión de Supabase Auth)` */
export interface AuthenticatedUser {
  id: string;
  email: string | undefined;
}

/**
 * ---------------------------------------------
 * -----  `getAuthenticatedUser()`  -----
 * ---------------------------------------------
 * - Verifica la sesión en páginas server (defensa en profundidad junto con el proxy).
 * - Sin usuario → redirect a `/login` con `?next=` para volver tras loguear.
 */
export const getAuthenticatedUser = async (
  nextPath?: string,
): Promise<AuthenticatedUser> => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    const target = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";
    redirect(target);
  }

  return { id: data.user.id, email: data.user.email };
};

/** - `perfil de sesión para la UI (sidebar, saludos)` */
export interface AuthenticatedProfile extends AuthenticatedUser {
  name: string;
  initials: string;
  role: string;
}

/** - `etiquetas en español de los roles del enum user_role` */
const ROLE_LABELS: Record<string, string> = {
  staff: "Maestra",
  parent: "Familia",
  admin: "Administrador",
};

/**
 * ---------------------------------------------
 * -----  `getAuthenticatedProfile()`  -----
 * ---------------------------------------------
 * - Igual que `getAuthenticatedUser` pero devuelve los datos listos para la UI:
 * - nombre, iniciales y rol salen de `user_metadata` (los escribe el signup
 * - vía `raw_user_meta_data`); evita el SELECT a `public.users` bloqueado por RLS.
 */
export const getAuthenticatedProfile = async (
  nextPath?: string,
): Promise<AuthenticatedProfile> => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    const target = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";
    redirect(target);
  }

  const meta = data.user.user_metadata ?? {};
  const name: string =
    typeof meta.full_name === "string" && meta.full_name.trim()
      ? meta.full_name.trim()
      : data.user.email ?? "Usuario";
  const role: string =
    typeof meta.role === "string" ? ROLE_LABELS[meta.role] ?? meta.role : "Maestra";

  return {
    id: data.user.id,
    email: data.user.email,
    name,
    initials: name.slice(0, 1).toUpperCase(),
    role,
  };
};
