/*
    *  ----------------------------------------------------  *
    *  -----  proxy.ts  --  /utils/supabase/proxy.ts  -----  *
    *  ----------------------------------------------------  *
*/

import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** - `cliente de Supabase para el proxy junto con la respuesta vigente que porta las cookies` */
interface ProxyClient {
  supabase: ReturnType<typeof createServerClient>;

  /** - `respuesta vigente del proxy (setAll la reasigna durante el refresh)` */
  readonly response: NextResponse;
}

export const createClient = (request: NextRequest): ProxyClient => {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          //  -----  cache headers que entrega la librería con el refresh (no-store)  -----
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          )
        },
      },
    },
  );

  return {
    supabase,
    //  -----  getter: al leerla después del refresh devuelve la respuesta vigente  -----
    get response() {
      return supabaseResponse;
    },
  };
};
