/*
    *  ----------------------------------------------------------  *
    *  -----  post-card.tsx  --  /components/post-card.tsx  -----  *
    *  ----------------------------------------------------------  *
*/
import Link from "next/link";
import type { ReactElement } from "react";
import type { Post, PostType } from "@/lib/feed";

/** - `configuración visual del badge según el tipo de publicación` */
interface TypeBadge {
  label: string;
  color: string;
  dotColor: string;
  background: string;
}

/** - `badge por tipo de publicación, con los colores exactos del mockup` */
const badges: Record<PostType, TypeBadge> = {
  achievement: { label: "LOGRO", color: "#3E9B6C", dotColor: "#3E9B6C", background: "#CFEBD8" },
  activity: { label: "ACTIVIDAD", color: "#2E89A6", dotColor: "#2E89A6", background: "#C7E7F1" },
  announcement: { label: "ANUNCIO", color: "#4E72C8", dotColor: "#4E72C8", background: "#CCD8F4" },
};

/** - `icono corazón de los likes` */
const heartIcon: ReactElement = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

/** - `icono de comentarios` */
const commentIcon: ReactElement = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
  </svg>
);

/** - `icono altavoz del anuncio general` */
const megaphoneIcon: ReactElement = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </svg>
);

/** - `icono de la foto pendiente` */
const photoIcon: ReactElement = (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
  </svg>
);

/** - `props de la tarjeta de publicación` */
interface PostCardProps {
  post: Post;
}

/**
 * --------------------------------
 * -----  `PostCard(post)`  -----
 * --------------------------------
 * - Tarjeta de una publicación del feed con badge, foto opcional y acciones.
 */
const PostCard = ({ post }: PostCardProps): ReactElement => {
  const badge = badges[post.type];

  return (
    <article className="bg-[#FFFDF9] border border-[#ECE0D0] rounded-[20px] py-5 px-5.5 shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
      {/*  -----  cabecera: avatar, autor y badge  -----  */}
      <div className="flex items-center gap-3 mb-3.5">
        {post.avatar ? (
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center flex-none font-display font-semibold text-[17px]"
            style={{ background: post.avatar.background, color: post.avatar.color }}
          >
            {post.avatar.initial}
          </div>
        ) : (
          <div className="w-11 h-11 rounded-full bg-[#CCD8F4] text-[#4E72C8] flex items-center justify-center flex-none">
            {megaphoneIcon}
          </div>
        )}
        <div className="flex-1">
          <div className="font-display font-semibold text-[16.5px] text-[#3F362E]">{post.title}</div>
          <div className="text-[12.5px] text-[#A89A8B]">{post.time} · {post.authorLabel}</div>
        </div>
        <div className="flex items-center gap-1.75 px-3 py-1.5 rounded-full" style={{ background: badge.background }}>
          <span className="w-2 h-2 rounded-full" style={{ background: badge.dotColor }} />
          <span className="text-xs font-extrabold tracking-[.5px]" style={{ color: badge.color }}>
            {badge.label}
          </span>
        </div>
      </div>

      {/*  -----  destinatario  -----  */}
      <div className="text-[12.5px] text-[#A89A8B] mb-2.5">Para: {post.recipient}</div>

      {/*  -----  texto de la publicación  -----  */}
      <p className="text-[15.5px] leading-[1.55] text-[#4A4038]">{post.text}</p>

      {/*  -----  placeholder de foto pendiente  -----  */}
      {post.photoAlt ? (
        <Link
          href="/foto"
          className="flex flex-col items-center justify-center gap-2 mt-3.5 border-[1.5px] border-dashed border-[#DBCDBA] rounded-2xl bg-[#F4ECE1] h-50 text-[#B0A290]"
        >
          {photoIcon}
          <span className="text-[13.5px]">{post.photoAlt}</span>
        </Link>
      ) : null}

      {/*  -----  acciones  -----  */}
      <div className="flex items-center gap-4.5 mt-4 pt-3.5 border-t border-[#F0E6D8]">
        <span className="flex items-center gap-1.75 text-[#94887B] font-bold text-sm">
          {heartIcon}
          {post.likes}
        </span>
        <Link href="/detalle-publicacion" className="flex items-center gap-1.75 text-[#94887B] font-bold text-sm">
          {commentIcon}
          {post.comments}
        </Link>
        <Link href="/crear-publicacion" className="ml-auto text-[#C5503A] font-extrabold text-sm">
          Editar
        </Link>
      </div>
    </article>
  );
};

export default PostCard;
