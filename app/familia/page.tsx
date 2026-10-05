/*
    *  -----------------------------------------------------  *
    *  -----  page.tsx  --  /app/familia/page.tsx  -----  *
    *  -----------------------------------------------------  *
*/

import { cookies } from "next/headers";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import FamilyFeed from "@/components/family-feed";
import { getAuthenticatedProfile } from "@/lib/auth";
import { roomNameFrom } from "@/lib/kids";
import { childAvatarFor, firstName, photoAlt } from "@/lib/posts";
import type {
  FamilyChild,
  FamilyFeedPost,
  FamilyPostChild,
  FeedPostPhoto,
} from "@/lib/posts";
import { createClient } from "@/utils/supabase/server";

/** - `metadata del feed de familia` */
export const metadata: Metadata = {
  title: "Feed · OpenDayCare",
};

/** - `fila del embed children (dentro de parent_children o post_children)` */
interface EmbeddedChild {
  id: string;
  full_name: string;
  room_id: string | null;
  rooms: unknown;
}

/**
 * -------------------------------------------------
 * -----  `embeddedChild(value)`  -----
 * -------------------------------------------------
 * - Niño del embed de PostgREST (objeto o array, según la relación).
 */
const embeddedChild = (value: unknown): EmbeddedChild | null => {
  if (Array.isArray(value)) {
    return (value[0] as EmbeddedChild | undefined) ?? null;
  }
  return (value as EmbeddedChild | null) ?? null;
};

/**
 * -------------------------------------------------
 * -----  `authorNameFrom(author)`  -----
 * -------------------------------------------------
 * - Nombre del autor desde el embed de users (objeto o array).
 */
const authorNameFrom = (author: unknown): string => {
  if (Array.isArray(author)) {
    return (author[0] as { full_name?: string } | undefined)?.full_name ?? "Staff";
  }
  return (author as { full_name?: string } | null)?.full_name ?? "Staff";
};

/**
 * -------------------------------------------
 * -----  `FamilyPage()`  -----
 * -------------------------------------------
 * - Feed de familia: publicaciones visibles por RLS (etiquetadas a sus hijos
 * - y anuncios de su sala), hijos del padre para los pills y saludo real.
 */
const FamilyPage = async (): Promise<ReactElement> => {
  const profile = await getAuthenticatedProfile();
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  //  -----  hijos vinculados al padre (RLS: parent_children scoped)  -----
  const { data: linkRows } = await supabase
    .from("parent_children")
    .select("children(id, full_name, room_id, rooms(name))")
    .eq("parent_id", profile.id)
    .order("created_at");

  const familyChildren: FamilyChild[] = (linkRows ?? []).flatMap((link) => {
    const child = embeddedChild((link as { children: unknown }).children);
    if (!child) {
      return [];
    }

    return [
      {
        ...childAvatarFor(child.id, child.full_name),
        roomId: child.room_id,
        roomName: roomNameFrom(child.rooms),
      },
    ];
  });

  //  -----  publicaciones visibles (RLS) con autora, niños (con sala), sala y fotos  -----
  const { data: rows } = await supabase
    .from("posts")
    .select(
      "id, author_id, room_id, type, body, published_at, author:users!posts_author_id_fkey(full_name), rooms(name), post_children(children(id, full_name, room_id, rooms(name))), post_photos(path, alt, width, height, position)",
    )
    .order("published_at", { ascending: false })
    .limit(50);

  //  -----  URLs firmadas de las fotos (bucket privado, 1 hora)  -----
  const photoRows = (rows ?? []).flatMap((row) => row.post_photos ?? []);
  const photoPaths: string[] = photoRows.map((photo) => photo.path);
  const signedUrlByPath = new Map<string, string>();
  if (photoPaths.length > 0) {
    const { data: signed } = await supabase.storage.from("post-photos").createSignedUrls(photoPaths, 3600);
    (signed ?? []).forEach((item) => {
      if (item.path && item.signedUrl) {
        signedUrlByPath.set(item.path, item.signedUrl);
      }
    });
  }

  //  -----  mapeo a FamilyFeedPost  -----
  const posts: FamilyFeedPost[] = (rows ?? []).map((row) => {
    const photos: FeedPostPhoto[] = [...(row.post_photos ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((photo) => ({
        path: photo.path,
        url: signedUrlByPath.get(photo.path) ?? "",
        alt: photoAlt(photo.alt),
        width: photo.width,
        height: photo.height,
      }));

    //  -----  niños etiquetados con su sala (para el card y el filtro)  -----
    const children: FamilyPostChild[] = (row.post_children ?? []).flatMap((link) => {
      const child = embeddedChild((link as { children: unknown }).children);
      if (!child) {
        return [];
      }

      return [
        {
          ...childAvatarFor(child.id, child.full_name),
          roomId: child.room_id,
          roomName: roomNameFrom(child.rooms),
        },
      ];
    });

    //  -----  sala a mostrar: la del anuncio o la del primer niño etiquetado  -----
    const roomName: string = roomNameFrom(row.rooms) || children[0]?.roomName || "";

    return {
      id: row.id,
      type: row.type,
      isMine: row.author_id === profile.id,
      authorName: authorNameFrom(row.author),
      roomAnnouncement: row.room_id !== null,
      children,
      body: row.body,
      publishedAt: row.published_at,
      photos,
      roomId: row.room_id,
      roomName,
    };
  });

  const greetingName: string = firstName(profile.name);

  return (
    <div className="max-w-[720px] w-full mx-auto px-6 lg:px-10 pt-8.5 pb-20">
      {/*  -----  saludo de familia  -----  */}
      <div className="mb-5">
        <div className="text-[12.5px] font-extrabold tracking-[.8px] text-[#B14228] mb-1">TU FAMILIA</div>
        <h1 className="font-display font-semibold text-[30px] text-[#3F362E]">Hola, {greetingName}</h1>
        <p className="mt-1.25 text-[#6E6359] text-[14.5px]">Así va el día de hoy</p>
      </div>

      {/*  -----  pills de hijo + publicaciones agrupadas  -----  */}
      <FamilyFeed posts={posts} kids={familyChildren} />
    </div>
  );
};

export default FamilyPage;
