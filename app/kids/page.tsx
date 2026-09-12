/*
    *  ---------------------------------------------  *
    *  -----  page.tsx  --  /app/kids/page.tsx  -----  *
    *  ---------------------------------------------  *
*/
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import Sidebar from "@/components/sidebar";
import KidsBrowser from "@/components/kids-browser";
import { kids } from "@/lib/kids";
import { getAuthenticatedUser } from "@/lib/auth";

/** - `metadata de la página de niños` */
export const metadata: Metadata = {
  title: "Niños · OpenDayCare",
};

/** - `icono más del botón agregar niño` */
const plusIcon: ReactElement = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/**
 * --------------------------------
 * -----  `KidsPage()`  -----
 * --------------------------------
 * - Página de gestión de niños: cabecera, buscador y grilla de tarjetas.
 */
const KidsPage = async (): Promise<ReactElement> => {
  await getAuthenticatedUser();
  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-[880px] w-full mx-auto px-10 pt-8.5 pb-20">
          {/*  -----  cabecera: título y botón agregar niño  -----  */}
          <div className="flex items-end justify-between gap-4 mb-5.5">
            <div>
              <div className="text-[12.5px] font-extrabold tracking-[.8px] text-[#D9583C] mb-1">GESTIÓN</div>
              <h1 className="font-display font-semibold text-[30px] text-[#3F362E]">Niños</h1>
            </div>
            <Link
              href="/agregar-nino"
              className="flex items-center gap-2 py-2.75 px-4.5 rounded-[14px] bg-linear-to-b/srgb from-[#F4977E] to-[#EE8164] text-white font-extrabold text-[14.5px] shadow-[0_8px_18px_-8px_rgba(238,129,100,.7)]"
            >
              {plusIcon}
              Agregar niño
            </Link>
          </div>

          {/*  -----  buscador + grilla de niños  -----  */}
          <KidsBrowser kids={kids} />
        </div>
      </main>
    </div>
  );
};

export default KidsPage;
