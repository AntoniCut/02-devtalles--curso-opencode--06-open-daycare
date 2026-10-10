/*
    *  ------------------------------------------  *
    *  -----  proxy.ts  --  /proxy.ts (raíz)  -----  *
    *  ------------------------------------------  *
*/

import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/proxy";
import { homeForRole, isPathAllowedForRole, readRole } from "@/lib/roles";
import type { UserRole } from "@/lib/roles";

/** - `rutas públicas que no exigen sesión` */
const PUBLIC_PATHS = ["/login", "/activate"];

/**
 * ------------------------------
 * -----  `proxy(request)`  -----
 * ------------------------------
 * - Dispatcher de `/` por rol, guards de sección (`/staff/*` solo staff/admin,
 * - `/familia/*` solo padres) y protección de sesión. El rol se lee de
 * - `app_metadata.role` del token; si el token no lo trae, no bloquea aquí y la
 * - capa de DB (layouts y páginas) resuelve el rol.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const { supabase, response: supabaseResponse } = createClient(request);

  // Refresh session before routes run
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const isAuthenticated = Boolean(claims);

  //  -----  rol confiable del token (solo service role escribe app_metadata)  -----
  const appMeta = claims?.app_metadata as { role?: unknown } | undefined;
  const role: UserRole | null = readRole(appMeta?.role);

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  // Server Action POST requests must never be redirected here: the action
  // client expects `text/x-component` and would break on an HTML redirect
  // response ("An unexpected response was received from the server.").
  // The action itself handles its own redirects after running.
  const isServerAction = request.headers.has("next-action");

  if (!isServerAction && !isPublicPath && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    const next = `${pathname}${search}`;
    if (next !== "/") {
      url.searchParams.set("next", next);
    }
    return NextResponse.redirect(url);
  }

  //  -----  dispatcher de la raíz: cada rol aterriza en su sección  -----
  if (!isServerAction && isAuthenticated && pathname === "/" && role) {
    const url = request.nextUrl.clone();
    url.pathname = homeForRole(role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  //  -----  guards de sección: un rol no navega la sección del otro  -----
  if (
    !isServerAction &&
    isAuthenticated &&
    role &&
    !isPublicPath &&
    !isPathAllowedForRole(pathname, role)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = homeForRole(role);
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
