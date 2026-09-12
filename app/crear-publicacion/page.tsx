/*
    *  -------------------------------------------------------------  *
    *  -----  page.tsx  --  /app/crear-publicacion/page.tsx  -----  *
    *  -------------------------------------------------------------  *
*/
import type { Metadata } from "next";
import type { ReactElement } from "react";
import CreatePostForm from "@/components/create-post-form";
import { getAuthenticatedUser } from "@/lib/auth";

/** - `metadata de la página nueva publicación` */
export const metadata: Metadata = {
  title: "Nueva publicación · OpenDayCare",
};

/**
 * --------------------------------------
 * -----  `CrearPublicacionPage()`  -----
 * --------------------------------------
 * - Página standalone para crear una publicación: tarjeta centrada sobre el fondo del mockup.
 */
const CrearPublicacionPage = async (): Promise<ReactElement> => {
  await getAuthenticatedUser("/crear-publicacion");
  return (
    <div className="min-h-screen flex items-start justify-center py-10 px-6 bg-[#F6ECDF]">
      <CreatePostForm />
    </div>
  );
};

export default CrearPublicacionPage;
