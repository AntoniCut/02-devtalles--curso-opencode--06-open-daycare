/*
    *  ---------------------------------  *
    *  -----  auth.ts  --  /lib/auth.ts  -----  *
    *  ---------------------------------  *
*/

import { cache } from "react";
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

/** - `perfil de sesión para la UI (sidebar, saludos y header del feed)` */
export interface AuthenticatedProfile extends AuthenticatedUser {
  name: string;
  initials: string;
  role: UserRole;
  roleLabel: string;
  roomId: string | null; // sala del staff; null para admin y padres
  daycareId: string | null; // guardería del perfil
  roomName: string | null; // nombre de la sala (header del feed)
  daycareName: string | null; // nombre de la guardería (header del feed)
}

/** - `usuario mínimo para resolver el rol (auth.getUser / signIn / signUp)` */
export interface RoleResolvableUser {
  id: string;
  app_metadata?: unknown;
}

/** - `cliente server de Supabase (el de utils/supabase/server)` */
type ServerSupabaseClient = ReturnType<typeof createClient>;

/** - `fila enriquecida del perfil (users + sala + guardería)` */
interface SessionProfileRow {
  role: unknown;
  room_id: string | null;
  daycare_id: string | null;
  rooms: unknown;
  daycares: unknown;
}

/**
 * ----------------------------------------
 * -----  `embeddedName(value)`  -----
 * ----------------------------------------
 * - Nombre de un embed de PostgREST (objeto o array, según la relación).
 */
const embeddedName = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    return (value[0] as { name?: string } | undefined)?.name ?? null;
  }
  return (value as { name?: string } | null)?.name ?? null;
};

/**
 * ------------------------------------------
 * -----  `getSessionProfile()`  -----
 * ------------------------------------------
 * - Resolución única por request (`React.cache`) del perfil de sesión: verifica
 * - el JWT con `getClaims` (firma local, igual que `proxy.ts`), resuelve el rol
 * - (token → fila → `parent`) y trae sala y guardería en la misma query.
 * - Sin sesión válida devuelve null; los wrappers deciden el redirect.
 */
const getSessionProfile = cache(async (): Promise<AuthenticatedProfile | null> => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  //  -----  verificación local del JWT (firma vía JWKS, como el proxy)  -----
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  //  -----  sin claims válidos no hay sesión  -----
  if (!claims?.sub) {
    return null;
  }

  //  -----  rol confiable del token: app_metadata (solo service role lo escribe)  -----
  const appMeta = claims.app_metadata as { role?: unknown } | undefined;
  const tokenRole: UserRole | null = readRole(appMeta?.role);

  //  -----  perfil, sala y guardería en una sola query (embeds de PostgREST)  -----
  const { data: profileData } = await supabase
    .from("users")
    .select("role, room_id, daycare_id, rooms(name), daycares(name)")
    .eq("id", claims.sub)
    .maybeSingle();
  const row: SessionProfileRow | null = profileData;

  //  -----  rol final: token → fila → el menos privilegiado (mismo default de la DB)  -----
  const role: UserRole = tokenRole ?? readRole(row?.role) ?? "parent";

  //  -----  nombre: user_metadata → email → genérico  -----
  const meta = (claims.user_metadata ?? {}) as Record<string, unknown>;
  const email: string | undefined = typeof claims.email === "string" ? claims.email : undefined;
  const name: string =
    typeof meta.full_name === "string" && meta.full_name.trim()
      ? meta.full_name.trim()
      : email ?? "Usuario";

  return {
    id: claims.sub,
    email,
    name,
    initials: name.slice(0, 1).toUpperCase(),
    role,
    roleLabel: ROLE_LABELS[role],
    roomId: row?.room_id ?? null,
    daycareId: row?.daycare_id ?? null,
    roomName: embeddedName(row?.rooms),
    daycareName: embeddedName(row?.daycares),
  };
});

/**
 * ---------------------------------------------
 * -----  `resolveUserRole(supabase, user)`  -----
 * ---------------------------------------------
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
 * -----  `getAuthenticatedUser()`  -----
 * ---------------------------------------------
 * - Verifica la sesión en páginas server (defensa en profundidad junto con el proxy).
 * - Sin usuario → redirect a `/login` con `?next=` para volver tras loguear.
 */
export const getAuthenticatedUser = async (
  nextPath?: string,
): Promise<AuthenticatedUser> => {
  const profile = await getSessionProfile();

  //  -----  sin sesión → login con retorno a la ruta pedida  -----
  if (!profile) {
    const target = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";
    redirect(target);
  }

  return { id: profile.id, email: profile.email };
};

/**
 * ---------------------------------------------
 * -----  `getAuthenticatedProfile()`  -----
 * ---------------------------------------------
 * - Igual que `getAuthenticatedUser` pero devuelve los datos listos para la UI:
 * - nombre, rol, sala y guardería, resueltos una sola vez por request.
 */
export const getAuthenticatedProfile = async (
  nextPath?: string,
): Promise<AuthenticatedProfile> => {
  const profile = await getSessionProfile();

  //  -----  sin sesión → login con retorno a la ruta pedida  -----
  if (!profile) {
    const target = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";
    redirect(target);
  }

  return profile;
};
