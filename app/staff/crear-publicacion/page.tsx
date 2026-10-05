/*
    *  -------------------------------------------------------------------  *
    *  -----  page.tsx  --  /app/staff/crear-publicacion/page.tsx  -----  *
    *  -------------------------------------------------------------------  *
*/
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CreatePostForm from "@/components/create-post-form";
import { getAuthenticatedUser } from "@/lib/auth";
import { childAvatarFor } from "@/lib/posts";
import type { PostChildAvatar } from "@/lib/posts";
import { createClient } from "@/utils/supabase/server";

/** - `metadata de la página nueva publicación` */
export const metadata: Metadata = {
  title: "Nueva publicación · OpenDayCare",
};

/**
 * --------------------------------------
 * -----  `CrearPublicacionPage()`  -----
 * --------------------------------------
 * - Página server para crear una publicación: exige staff/admin, carga los niños
 * - activos de su sala (admin sin sala: toda la guardería) y los pasa al formulario.
 */
const CrearPublicacionPage = async (): Promise<ReactElement> => {
  const user = await getAuthenticatedUser("/staff/crear-publicacion");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  //  -----  perfil real (rol, sala y guardería) desde public.users  -----
  const { data: profile } = await supabase
    .from("users")
    .select("role, room_id, daycare_id")
    .eq("id", user.id)
    .single();

  //  -----  solo staff/admin publican; el resto vuelve al feed  -----
  if (!profile || (profile.role !== "staff" && profile.role !== "admin")) {
    redirect("/staff");
  }

  //  -----  niños activos de la sala (o de toda la guardería si no tiene sala)  -----
  let childrenQuery = supabase
    .from("children")
    .select("id, full_name, photo_consent, rooms!inner(daycare_id)")
    .eq("status", "active")
    .eq("rooms.daycare_id", profile.daycare_id)
    .order("full_name");

  if (profile.room_id) {
    childrenQuery = childrenQuery.eq("room_id", profile.room_id);
  }

  const { data: children } = await childrenQuery;

  /** - `niños disponibles para etiquetar en el formulario` */
  const recipients: PostChildAvatar[] = (children ?? []).map(
    (child: { id: string; full_name: string }) => childAvatarFor(child.id, child.full_name),
  );

  /** - `ids de niños sin consentimiento de fotos (el cliente bloquea la subida)` */
  const photoConsentBlockedIds: string[] = (children ?? [])
    .filter((child: { photo_consent: boolean }) => child.photo_consent === false)
    .map((child: { id: string }) => child.id);

  return (
    <div className="min-h-screen flex items-start justify-center py-10 px-6 bg-[#F6ECDF]">
      <CreatePostForm
        recipients={recipients}
        canAddressWholeRoom={profile.room_id !== null}
        daycareId={profile.daycare_id}
        photoConsentBlockedIds={photoConsentBlockedIds}
        wholeRoomPhotoConsentBlocked={photoConsentBlockedIds.length > 0}
      />
    </div>
  );
};

export default CrearPublicacionPage;
