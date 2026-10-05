/*
    *  -----------------------------------------  *
    *  -----  page.tsx  --  /app/page.tsx  -----  *
    *  -----------------------------------------  *
*/

import { redirect } from "next/navigation";
import { getAuthenticatedProfile } from "@/lib/auth";
import { homeForRole } from "@/lib/roles";

/**
 * ----------------------------------
 * -----  `RootDispatcher()`  -----
 * ----------------------------------
 * - Fallback server de la raíz: resuelve el rol real (app_metadata con respaldo
 * - en public.users) y redirige al home de su sección. Sin sesión, `getAuthenticatedProfile`
 * - manda a `/login` con `?next=/`.
 */
const RootDispatcher = async (): Promise<never> => {
  const profile = await getAuthenticatedProfile("/");
  redirect(homeForRole(profile.role));
};

export default RootDispatcher;
