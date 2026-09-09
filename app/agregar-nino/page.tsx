/*
    *  -----------------------------------------------------  *
    *  -----  page.tsx  --  /app/agregar-nino/page.tsx  -----  *
    *  -----------------------------------------------------  *
*/
import type { Metadata } from "next";
import type { ReactElement } from "react";
import AddKidForm from "@/components/add-kid-form";

/** - `metadata de la página agregar niño` */
export const metadata: Metadata = {
  title: "Agregar niño · OpenDayCare",
};

/**
 * --------------------------------
 * -----  `AgregarNinoPage()`  -----
 * --------------------------------
 * - Página standalone para dar de alta un niño: tarjeta centrada sobre el fondo del mockup.
 */
const AgregarNinoPage = (): ReactElement => {
  return (
    <div className="min-h-screen flex items-start justify-center py-10 px-6 bg-[#F6ECDF]">
      <AddKidForm />
    </div>
  );
};

export default AgregarNinoPage;
