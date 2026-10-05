/*
    *  ---------------------------------  *
    *  -----  auth.ts  --  /lib/auth.ts  -----  *
    *  ---------------------------------  *
*/

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { ROLE_LABELS, readRole } from "@/lib/roles";
import type { UserRole } from "@/lib/roles";

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
  role: UserRole;
  roleLabel: string;
}

/** - `usuario mínimo para resolver el rol (auth.getUser / signIn / signUp)` */
export interface RoleResolvableUser {
  id: string;
  app_metadata?: unknown;
}

/** - `cliente server de Supabase (el de utils/supabase/server)` */
type ServerSupabaseClient = ReturnType<typeof createClient>;

/**
 * ---------------------------------------------------
 * -----  `resolveUserRole(supabase, user)`  -----
 * ---------------------------------------------------
 * - Rol confiable: `app_metadata` del token (solo service role lo escribe) y,
 * - si no viene, el respaldo `public.users.role`; nunca `user_metadata`.
 */
export const resolveUserRole = async (
  supabase: ServerSupabaseClient,
  user: RoleResolvableUser,
): Promise<UserRole> => {
  //  -----  rol del token: app_metadata (user_metadata no autoriza)  -----
  const appMeta = user.app_metadata as { role?: unknown } | undefined;
  const tokenRole: UserRole | null = readRole(appMeta?.role);

  if (tokenRole) {
    return tokenRole;
  }

  //  -----  respaldo confiable: public.users.role (la RLS permite el self-select)  -----
  const { data: row } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  //  -----  por defecto el rol menos privilegiado (mismo default de la DB)  -----
  return readRole(row?.role) ?? "parent";
};

/**
 * ---------------------------------------------
 * -----  `getAuthenticatedProfile()`  -----
 * ---------------------------------------------
 * - Igual que `getAuthenticatedUser` pero devuelve los datos listos para la UI:
 * - nombre y rol. El rol sale de `app_metadata` y, si el token no lo trae, del
 * - respaldo confiable `public.users.role`.
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

  //  -----  rol confiable del usuario  -----
  const role: UserRole = await resolveUserRole(supabase, data.user);

  const meta = data.user.user_metadata ?? {};
  const name: string =
    typeof meta.full_name === "string" && meta.full_name.trim()
      ? meta.full_name.trim()
      : data.user.email ?? "Usuario";

  return {
    id: data.user.id,
    email: data.user.email,
    name,
    initials: name.slice(0, 1).toUpperCase(),
    role,
    roleLabel: ROLE_LABELS[role],
  };
};
