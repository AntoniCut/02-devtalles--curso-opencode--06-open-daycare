/*
    *  -------------------------------------------------  *
    *  -----  page.tsx  --  /app/pokemon/page.tsx  -----  *
    *  -------------------------------------------------  *
*/
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import Sidebar from "@/components/sidebar";
import PokemonCard from "@/components/pokemon-card";
import { getAuthenticatedProfile } from "@/lib/auth";

/** - `metadata de la página del Pokémon actual` */
export const metadata: Metadata = {
  title: "Pokémon · OpenDayCare",
};

/** - `icono flecha del botón regresar` */
const backIcon: ReactElement = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

/**
 * ------------------------------
 * -----  `PokemonPage()`  -----
 * ------------------------------
 * - Pantalla del Pokémon actual: sidebar, cabecera con botón regresar y la
 *   tarjeta que hace la petición HTTP a la PokéAPI.
 */
const PokemonPage = async (): Promise<ReactElement> => {
  const profile = await getAuthenticatedProfile();

  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar user={profile} />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-[760px] w-full mx-auto px-10 pt-8.5 pb-20">
          {/*  -----  cabecera: título y botón regresar  -----  */}
          <div className="flex items-end justify-between gap-4 mb-5.5">
            <div>
              <div className="text-[12.5px] font-extrabold tracking-[.8px] text-[#D9583C] mb-1">ACTIVIDAD</div>
              <h1 className="font-display font-semibold text-[30px] text-[#3F362E]">Pokémon</h1>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 py-2.75 px-4.5 rounded-[14px] bg-[#FBE3D8] text-[#D9583C] font-extrabold text-[14.5px]"
            >
              {backIcon}
              Regresar
            </Link>
          </div>

          {/*  -----  tarjeta del Pokémon actual  -----  */}
          <div className="flex justify-center">
            <PokemonCard />
          </div>
        </div>
      </main>
    </div>
  );
};

export default PokemonPage;
