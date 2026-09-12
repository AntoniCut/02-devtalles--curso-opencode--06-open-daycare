/*
    *  ------------------------------------------  *
    *  -----  proxy.ts  --  /proxy.ts (raíz)  -----  *
    *  ------------------------------------------  *
*/

import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/proxy";

/** - `rutas públicas que no exigen sesión` */
const PUBLIC_PATHS = ["/login", "/activate"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const { supabase, response: supabaseResponse } = createClient(request);

  // Refresh session before routes run
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!isPublicPath && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    const next = `${pathname}${search}`;
    if (next !== "/") {
      url.searchParams.set("next", next);
    }
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
