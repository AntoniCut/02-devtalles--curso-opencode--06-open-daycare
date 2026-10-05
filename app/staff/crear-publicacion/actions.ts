/*
    *  -------------------------------------------------------------------------  *
    *  -----  actions.ts  --  /app/staff/crear-publicacion/actions.ts  -----  *
    *  -------------------------------------------------------------------------  *
*/
"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { MAX_BODY_LENGTH, MAX_PHOTOS_PER_POST, postTypeOptions } from "@/lib/posts";
import type { PostPhotoInput, PostType } from "@/lib/posts";
import { createClient } from "@/utils/supabase/server";

/** - `filas que el action necesita del perfil del usuario` */
interface ProfileRow {
  role: "staff" | "parent" | "admin";
  room_id: string | null;
  daycare_id: string;
}

/**
 * ------------------------------
 * -----  `parseIds(raw)`  -----
 * ------------------------------
 * - Ids de niños enviados por el formulario (JSON array de strings).
 */
const parseIds = (raw: FormDataEntryValue | null): string[] => {
  if (typeof raw !== "string") {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
};

/**
 * ---------------------------------
 * -----  `parsePhotos(raw)`  -----
 * ---------------------------------
 * - Fotos enviadas por el formulario (path, alt y dimensiones).
 */
const parsePhotos = (raw: FormDataEntryValue | null): PostPhotoInput[] => {
  if (typeof raw !== "string") {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        path: typeof item.path === "string" ? item.path : "",
        alt: typeof item.alt === "string" ? item.alt : "",
        width: typeof item.width === "number" ? item.width : null,
        height: typeof item.height === "number" ? item.height : null,
      }))
      .filter((photo) => photo.path !== "");
  } catch {
    return [];
  }
};

/**
 * ----------------------------------
 * -----  `createPost(formData)`  -----
 * ----------------------------------
 * - Server Action de publicación: valida, verifica el consentimiento de fotos y
 * - crea la publicación de forma atómica (RPC `create_post`); redirige al feed.
 */
export const createPost = async (formData: FormData): Promise<{ error: string }> => {
  const user = await getAuthenticatedUser();
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  //  -----  perfil real del usuario (rol, sala y guardería)  -----
  const { data } = await supabase
    .from("users")
    .select("role, room_id, daycare_id")
    .eq("id", user.id)
    .single();
  const profile: ProfileRow | null = data;

  //  -----  solo staff/admin publican  -----
  if (!profile || (profile.role !== "staff" && profile.role !== "admin")) {
    redirect("/staff");
  }

  const type: string = String(formData.get("type") ?? "");
  const body: string = String(formData.get("body") ?? "").trim();
  const wholeClass: boolean = formData.get("wholeClass") === "true";
  const childIds: string[] = parseIds(formData.get("childIds"));
  const photos: PostPhotoInput[] = parsePhotos(formData.get("photos"));

  //  -----  validaciones de servidor  -----
  if (!postTypeOptions.some((option) => option.id === type)) {
    return { error: "Elegí un tipo de publicación" };
  }
  if (body === "") {
    return { error: "La descripción es obligatoria" };
  }
  if (body.length > MAX_BODY_LENGTH) {
    return { error: `La descripción no puede superar los ${MAX_BODY_LENGTH} caracteres` };
  }
  if (wholeClass && profile.room_id === null) {
    return { error: "No tenés una sala asignada para publicar a toda la sala" };
  }
  if (!wholeClass && childIds.length === 0) {
    return { error: "Elegí al menos un destinatario" };
  }
  if (type === "photo" && photos.length === 0) {
    return { error: "El tipo Foto requiere al menos una imagen" };
  }
  if (photos.length > MAX_PHOTOS_PER_POST) {
    return { error: `Podés adjuntar hasta ${MAX_PHOTOS_PER_POST} fotos` };
  }
  if (photos.some((photo) => !photo.path.startsWith(`${profile.daycare_id}/`))) {
    return { error: "Las fotos adjuntas no pertenecen a tu guardería" };
  }

  //  -----  los niños etiquetados deben ser visibles para el usuario  -----
  if (!wholeClass) {
    const { data: taggable } = await supabase
      .from("children")
      .select("id")
      .eq("status", "active")
      .in("id", childIds);

    if ((taggable ?? []).length !== childIds.length) {
      return { error: "Hay niños seleccionados que no pertenecen a tu sala" };
    }
  }

  //  -----  consentimiento de fotos (niños etiquetados o sala completa)  -----
  if (photos.length > 0) {
    if (wholeClass) {
      const { data: withoutConsent } = await supabase
        .from("children")
        .select("full_name")
        .eq("status", "active")
        .eq("photo_consent", false)
        .eq("room_id", profile.room_id);

      if ((withoutConsent ?? []).length > 0) {
        return { error: "No se pueden publicar fotos: hay niños en la sala sin consentimiento de imagen" };
      }
    } else {
      const { data: withoutConsent } = await supabase
        .from("children")
        .select("full_name")
        .eq("photo_consent", false)
        .in("id", childIds);

      if ((withoutConsent ?? []).length > 0) {
        const names: string = (withoutConsent ?? []).map((child) => child.full_name).join(", ");
        return { error: `No se pueden publicar fotos de ${names}: falta el consentimiento de imagen` };
      }
    }
  }

  //  -----  insert atómico: posts + post_children + post_photos  -----
  const { error } = await supabase.rpc("create_post", {
    p_type: type as PostType,
    p_body: body,
    p_room_id: wholeClass ? profile.room_id : null,
    p_child_ids: wholeClass ? [] : childIds,
    p_photos: photos,
  });

  if (error) {
    return { error: "No se pudo publicar. Intentá de nuevo." };
  }

  revalidatePath("/staff");
  redirect("/staff");
};
