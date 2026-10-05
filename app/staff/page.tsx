/*
    *  -----------------------------------------------  *
    *  -----  page.tsx  --  /app/staff/page.tsx  -----  *
    *  -----------------------------------------------  *
*/
import Link from "next/link";
import type { ReactElement } from "react";
import { cookies } from "next/headers";
import PostCard from "@/components/post-card";
import { getAuthenticatedProfile } from "@/lib/auth";
import { childAvatarFor, formatToday, groupPostsByDay, photoAlt } from "@/lib/posts";
import type { FeedPost, FeedPostPhoto, PostChildAvatar, PostDayGroup } from "@/lib/posts";
import { createClient } from "@/utils/supabase/server";

/** - `icono cámara del composer` */
const cameraIcon: ReactElement = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

/** - `perfil del usuario para el header (rol, sala y guardería)` */
interface ProfileRow {
  role: "staff" | "parent" | "admin";
  room_id: string | null;
  daycare_id: string;
}

/**
 * -------------------------------------
 * -----  `authorNameFrom(author)`  -----
 * -------------------------------------
 * - Nombre del autor desde el embed de users (objeto o array, según PostgREST).
 */
const authorNameFrom = (author: unknown): string => {
  if (Array.isArray(author)) {
    return (author[0] as { full_name?: string } | undefined)?.full_name ?? "Staff";
  }
  return (author as { full_name?: string } | null)?.full_name ?? "Staff";
};

/**
 * --------------------------------------
 * -----  `childrenFrom(links)`  -----
 * --------------------------------------
 * - Niños etiquetados desde el embed post_children (objeto o array).
 */
const childrenFrom = (links: unknown): PostChildAvatar[] => {
  if (!Array.isArray(links)) {
    return [];
  }

  return links
    .flatMap((link) => {
      const children: unknown = (link as { children?: unknown }).children;
      return Array.isArray(children) ? children : children ? [children] : [];
    })
    .map((child) => {
      const row = child as { id: string; full_name: string };
      return childAvatarFor(row.id, row.full_name);
    });
};

/**
 * ----------------------
 * -----  `Home()`  -----
 * ----------------------
 * - Feed real de la sala: publicaciones visibles por RLS, agrupadas por día,
 * - con fotos firmadas del bucket privado y datos reales en el header.
 */
const Home = async (): Promise<ReactElement> => {
  const profile = await getAuthenticatedProfile();
  const firstName: string = profile.name.split(" ")[0];
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  //  -----  perfil real: rol, sala y guardería  -----
  const { data: profileData } = await supabase
    .from("users")
    .select("role, room_id, daycare_id")
    .eq("id", profile.id)
    .single();
  const userProfile: ProfileRow | null = profileData;
  const roomId: string | null = userProfile?.room_id ?? null;
  const daycareId: string = userProfile?.daycare_id ?? "";

  //  -----  nombre de la sala y de la guardería para el header  -----
  let roomName: string = "";
  if (roomId) {
    const { data: room } = await supabase.from("rooms").select("name").eq("id", roomId).single();
    roomName = room?.name ?? "";
  }
  const { data: daycare } = await supabase.from("daycares").select("name").eq("id", daycareId).single();
  const daycareName: string = daycare?.name ?? "";
  const headerLabel: string = roomName ? `GUARDERÍA · SALA ${roomName.toUpperCase()}` : daycareName.toUpperCase();

  //  -----  conteo real de niños activos (sala del staff o guardería del admin)  -----
  let childrenCountQuery = supabase
    .from("children")
    .select("id, rooms!inner(daycare_id)", { count: "exact", head: true })
    .eq("status", "active")
    .eq("rooms.daycare_id", daycareId);
  if (roomId) {
    childrenCountQuery = childrenCountQuery.eq("room_id", roomId);
  }
  const { count: childrenCount } = await childrenCountQuery;

  //  -----  publicaciones visibles (RLS) con autor, niños etiquetados y fotos  -----
  const { data: rows } = await supabase
    .from("posts")
    .select("id, author_id, room_id, type, body, published_at, author:users!posts_author_id_fkey(full_name), post_children(children(id, full_name)), post_photos(path, alt, width, height, position)")
    .order("published_at", { ascending: false })
    .limit(50);

  //  -----  URLs firmadas de las fotos (bucket privado, 1 hora)  -----
  const photoPaths: string[] = (rows ?? []).flatMap((row) => (row.post_photos ?? []).map((photo) => photo.path));
  const signedUrlByPath = new Map<string, string>();
  if (photoPaths.length > 0) {
    const { data: signed } = await supabase.storage.from("post-photos").createSignedUrls(photoPaths, 3600);
    (signed ?? []).forEach((item) => {
      if (item.path && item.signedUrl) {
        signedUrlByPath.set(item.path, item.signedUrl);
      }
    });
  }

  //  -----  mapeo a FeedPost  -----
  const feedPosts: FeedPost[] = (rows ?? []).map((row) => {
    const photos: FeedPostPhoto[] = [...(row.post_photos ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((photo) => ({
        path: photo.path,
        url: signedUrlByPath.get(photo.path) ?? "",
        alt: photoAlt(photo.alt),
        width: photo.width,
        height: photo.height,
      }));

    return {
      id: row.id,
      type: row.type,
      isMine: row.author_id === profile.id,
      authorName: authorNameFrom(row.author),
      roomAnnouncement: row.room_id !== null,
      children: childrenFrom(row.post_children),
      body: row.body,
      publishedAt: row.published_at,
      photos,
    };
  });

  //  -----  agrupado por día (PUBLICADO HOY / AYER / fecha)  -----
  const groups: PostDayGroup[] = groupPostsByDay(feedPosts);

  return (
    <div className="max-w-[760px] w-full mx-auto px-10 pt-8.5 pb-20">
      {/*  -----  saludo de la sala  -----  */}
      <div className="mb-6">
        <div className="text-[12.5px] font-extrabold tracking-[.8px] text-[#D9583C] mb-1">{headerLabel}</div>
        <h1 className="font-display font-semibold text-[30px] text-[#3F362E]">Buenas, {firstName}</h1>
        <p className="mt-1.25 text-[#94887B] text-[14.5px]">{childrenCount ?? 0} niños · {formatToday()}</p>
      </div>

      {/*  -----  composer  -----  */}
      <Link
        href="/staff/crear-publicacion"
        className="flex items-center gap-3.5 bg-[#FFFDF9] border border-[#ECE0D0] rounded-[18px] py-3.5 px-4.5 mb-6 shadow-[0_4px_14px_-10px_rgba(120,90,60,.4)]"
      >
        <div className="w-10 h-10 rounded-full bg-[#F2937A] text-white font-display font-semibold text-base flex items-center justify-center flex-none">
          {profile.initials}
        </div>
        <span className="flex-1 text-[#A89A8B] text-[15px]">Compartí un momento…</span>
        <span className="w-9.5 h-9.5 rounded-xl bg-[#FBE3D8] text-[#E0654A] flex items-center justify-center">
          {cameraIcon}
        </span>
      </Link>

      {/*  -----  publicaciones agrupadas por día  -----  */}
      {groups.length > 0 ? (
        groups.map((group) => (
          <section key={group.label} className="mb-6 last:mb-0">
            <div className="flex items-center gap-3.5 mb-3.5">
              <span className="text-[12.5px] font-extrabold tracking-[.8px] text-[#8A7C6D]">{group.label}</span>
              <span className="flex-1 h-px bg-[#E7DAC8]" />
            </div>
            <div className="flex flex-col gap-4">
              {group.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        ))
      ) : (
        /*  -----  empty state: todavía no hay publicaciones  -----  */
        <div className="bg-[#FFFDF9] border border-[#ECE0D0] rounded-[20px] py-10 px-6 text-center shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
          <p className="font-display font-semibold text-[18px] text-[#3F362E]">Todavía no hay publicaciones</p>
          <p className="mt-1.5 text-[14px] text-[#94887B]">Compartí el primer momento de la sala.</p>
          <Link
            href="/staff/crear-publicacion"
            className="inline-flex items-center justify-center mt-4 py-2.5 px-5 rounded-[14px] bg-linear-to-b/srgb from-[#F4977E] to-[#EE8164] text-white font-extrabold text-[14px]"
          >
            Nueva publicación
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;
