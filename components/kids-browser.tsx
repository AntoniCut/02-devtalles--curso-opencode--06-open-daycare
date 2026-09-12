/*
    *  ----------------------------------------------------------------  *
    *  -----  kids-browser.tsx  --  /components/kids-browser.tsx  -----  *
    *  ----------------------------------------------------------------  *
*/
"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import type { Kid } from "@/lib/kids";
import KidCard from "@/components/kid-card";

/** - `icono lupa del buscador` */
const searchIcon: ReactElement = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B0A290" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

/** - `props del listado de niños` */
interface KidsBrowserProps {
  kids: Kid[];
}

/**
 * ---------------------------------
 * -----  `KidsBrowser(kids)`  -----
 * ---------------------------------
 * - Buscador y grilla de niños con filtrado por nombre en cliente.
 */
const KidsBrowser = ({ kids }: KidsBrowserProps): ReactElement => {
  const [query, setQuery] = useState<string>("");

  //  -----  filtrado por nombre, case-insensitive  -----
  const filteredKids: Kid[] = kids.filter((kid) => kid.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <>
      {/*  -----  buscador  -----  */}
      <div className="flex items-center gap-2.75 bg-[#FFFDF9] border border-[#ECE0D0] rounded-[14px] py-3 px-4 mb-5.5">
        {searchIcon}
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar niño…"
          aria-label="Buscar niño"
          className="flex-1 border-none bg-transparent text-[15px] text-[#3F362E] outline-none placeholder:text-[#B6A99B]"
        />
      </div>

      {/*  -----  encabezado del listado con contador de resultados  ----- */}
      <div className="flex items-center gap-3 mb-3.5">
        <span className="text-[12.5px] font-extrabold tracking-[.8px] text-[#3F362E]">NIÑOS</span>
        <span className="text-[13px] text-[#A89A8B]">{filteredKids.length} niños</span>
        <span className="flex-1 h-px bg-[#E7DAC8]" />
      </div>

      {/*  -----  grilla de tarjetas  -----  */}
      <div className="grid grid-cols-2 gap-3.5">
        {filteredKids.map((kid) => (
          <KidCard key={kid.slug} kid={kid} />
        ))}
      </div>
    </>
  );
};

export default KidsBrowser;
