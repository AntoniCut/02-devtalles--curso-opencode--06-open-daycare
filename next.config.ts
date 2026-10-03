/*
    *  -------------------------------------------------  *
    *  -----  next.config.ts  --  /next.config.ts  -----  *
    *  -------------------------------------------------  *
*/
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "raw.githubusercontent.com",
                pathname: "/PokeAPI/sprites/**",
            },
            {
                // URLs firmadas del bucket privado post-photos. Se usa un hostname glob
                // en vez de process.env: Turbopack re-evalúa next.config.ts al reiniciar
                // y las variables de .env no están garantizadas en esa re-evaluación.
                protocol: "https",
                hostname: "*.supabase.co",
                pathname: "/storage/v1/object/sign/post-photos/**",
            },
        ],
    },
};

export default nextConfig;
