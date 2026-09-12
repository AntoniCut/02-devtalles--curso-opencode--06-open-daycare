/*
    *  -----------------------------------------------------  *
    *  -----  page.tsx  --  /app/agregar-nino/page.tsx  -----  *
    *  -----------------------------------------------------  *
*/
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { cookies } from "next/headers";
import AddKidForm from "@/components/add-kid-form";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

/** - `metadata de la página agregar niño` */
export const metadata: Metadata = {
  title: "Agregar niño · OpenDayCare",
};

/**
 * --------------------------------
 * -----  `AgregarNinoPage()`  -----
 * --------------------------------
 * - Página standalone para dar de alta un niño: tarjeta centrada sobre el fondo del mockup.
 * - Las salas del select salen de la tabla `rooms` de la DB.
 */
const AgregarNinoPage = async (): Promise<ReactElement> => {
  await getAuthenticatedUser("/agregar-nino");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: rooms } = await supabase.from("rooms").select("id, name").order("name");

  return (
    <div className="min-h-screen flex items-start justify-center py-10 px-6 bg-[#F6ECDF]">
      <AddKidForm rooms={rooms ?? []} />
    </div>
  );
};

export default AgregarNinoPage;
