/*
    *  --------------------------------------------------------  *
    *  -----  page.tsx  --  /app/vincular-padre/page.tsx  -----  *
    *  --------------------------------------------------------  *
*/
import type { Metadata } from "next";
import type { ReactElement } from "react";
import LinkParentForm from "@/components/link-parent-form";

/** - `metadata de la página vincular padre` */
export const metadata: Metadata = {
  title: "Vincular padre · OpenDayCare",
};

/**
 * ----------------------------------
 * -----  `VincularPadrePage()`  -----
 * ----------------------------------
 * - Página standalone para vincular un padre al niño: tarjeta centrada sobre el fondo del mockup.
 */
const VincularPadrePage = (): ReactElement => {
  return (
    <div className="min-h-screen flex items-start justify-center py-10 px-6 bg-[#F6ECDF]">
      <LinkParentForm />
    </div>
  );
};

export default VincularPadrePage;
