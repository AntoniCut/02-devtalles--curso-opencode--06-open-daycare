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
