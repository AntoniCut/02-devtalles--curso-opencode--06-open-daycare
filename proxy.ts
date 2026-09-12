/*
    *  -------------------------------------  *
    *  -----  proxy.ts  --  /proxy.ts  -----  *
    *  -------------------------------------  *
*/

import { type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/proxy";

export async function proxy(request: NextRequest) {
  return createClient(request);
}

export const config = {
  matcher: [
    // Run on everything except static assets and image optimizations
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
