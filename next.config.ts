/*
    *  -------------------------------------------------  *
    *  -----  next.config.ts  --  /next.config.ts  -----  *
    *  -------------------------------------------------  *
*/
import type { NextConfig } from "next";

/** - `hostname del proyecto de Supabase para las URLs firmadas del bucket post-photos` */
const supabaseHostname: string | null = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
    : null;

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "raw.githubusercontent.com",
                pathname: "/PokeAPI/sprites/**",
            },
            ...(supabaseHostname
                ? [
                      {
                          protocol: "https" as const,
                          hostname: supabaseHostname,
                          pathname: "/storage/v1/object/sign/post-photos/**",
                      },
                  ]
                : []),
        ],
    },
};

export default nextConfig;
