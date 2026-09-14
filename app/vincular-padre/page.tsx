/*
    *  --------------------------------------------------------  *
    *  -----  page.tsx  --  /app/vincular-padre/page.tsx  -----  *
    *  --------------------------------------------------------  *
*/
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import LinkParentForm from "@/components/link-parent-form";
import { getAuthenticatedUser } from "@/lib/auth";
import { slugify } from "@/lib/kids";
import { createClient } from "@/utils/supabase/server";

/** - `metadata de la página vincular padre` */
export const metadata: Metadata = {
  title: "Vincular padre · OpenDayCare",
};

/** - `alfabeto del código de invitación (sin 0/O/1/I para evitar confusiones)` */
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** - `longitud del código de invitación (ej. 7K4P9)` */
const CODE_LENGTH = 5;

/**
 * ----------------------------------------
 * -----  `generateInvitationCode()`  -----
 * ----------------------------------------
 * - Código aleatorio de 5 caracteres criptográficamente seguro.
 */
const generateInvitationCode = (): string => {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
};

/** - `props de la página (searchParams asíncrono en Next 16)` */
interface VincularPadrePageProps {
  searchParams: Promise<{ kid?: string | string[] }>;
}

/**
 * ----------------------------------
 * -----  `VincularPadrePage()`  -----
 * ----------------------------------
 * - Página standalone para vincular un padre al niño (dinámica por ?kid=<uuid>):
 *   carga el niño real de la DB, genera el código de invitación y redirige a
 *   /kids si el niño no existe.
 */
const VincularPadrePage = async (props: VincularPadrePageProps): Promise<ReactElement> => {
  await getAuthenticatedUser("/vincular-padre");

  const { kid: kidParam } = await props.searchParams;
  const kidId: string | undefined = Array.isArray(kidParam) ? kidParam[0] : kidParam;

  //  -----  sin ?kid= → volver a la lista de niños  -----
  if (!kidId) {
    redirect("/kids");
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: child } = await supabase
    .from("children")
    .select("id, full_name, rooms(name)")
    .eq("id", kidId)
    .single();

  //  -----  id inexistente → volver a la lista de niños  -----
  if (!child) {
    redirect("/kids");
  }

  const childName: string = child.full_name;
  const childFirstName: string = childName.split(" ")[0];
  const childSlug: string = slugify(childName);
  const invitationCode: string = generateInvitationCode();

  return (
    <div className="min-h-screen flex items-start justify-center py-10 px-6 bg-[#F6ECDF]">
      <LinkParentForm
        childName={childName}
        childFirstName={childFirstName}
        childSlug={childSlug}
        invitationCode={invitationCode}
      />
    </div>
  );
};

export default VincularPadrePage;
