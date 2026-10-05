/*
    *  -------------------------------------------------------------------  *
    *  -----  family-post-card.tsx  --  /components/family-post-card.tsx  -----  *
    *  -------------------------------------------------------------------  *
*/

import type { ReactElement } from "react";
import { megaphoneIcon } from "@/components/feed-icons";
import PhotoCarousel from "@/components/photo-carousel";
import { formatPostTime, formatPostTitle, postTypeBadges } from "@/lib/posts";
import type { FamilyFeedPost } from "@/lib/posts";

/** - `props de la tarjeta de publicación de familia` */
interface FamilyPostCardProps {
  post: FamilyFeedPost;
}

/**
 * ------------------------------------
 * -----  `FamilyPostCard(post)`  -----
 * ------------------------------------
 * - Tarjeta del feed de familia: nombre del niño (o "Anuncio general"), hora,
 * - "Maestra {autor} · Sala {sala}", badge de tipo, cuerpo y fotos, sin contadores.
 */
const FamilyPostCard = ({ post }: FamilyPostCardProps): ReactElement => {
  const badge = postTypeBadges[post.type];
  const firstChild = post.children[0];

  return (
    <article className="bg-[#FFFDF9] border border-[#ECE0D0] rounded-[20px] py-5 px-5.5 shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
      {/*  -----  cabecera: avatar, niño/autora y badge  -----  */}
      <div className="flex items-center gap-3 mb-3.5">
        {firstChild ? (
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center flex-none font-display font-semibold text-[17px]"
            style={{ background: firstChild.background, color: firstChild.color }}
          >
            {firstChild.initial}
          </div>
        ) : (
          <div className="w-11 h-11 rounded-full bg-[#CCD8F4] text-[#4E72C8] flex items-center justify-center flex-none">
            {megaphoneIcon}
          </div>
        )}
        <div className="flex-1">
          <div className="font-display font-semibold text-[16.5px] text-[#3F362E]">
            {formatPostTitle(post.children, post.roomAnnouncement)}
          </div>
          <div className="text-[12.5px] text-[#6E6359]">
            {formatPostTime(post.publishedAt)} · Maestra {post.authorName}
            {post.roomName ? ` · Sala ${post.roomName}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-1.75 px-3 py-1.5 rounded-full" style={{ background: badge.background }}>
          <span className="w-2 h-2 rounded-full" style={{ background: badge.color }} />
          <span className="text-xs font-extrabold tracking-[.5px]" style={{ color: badge.color }}>
            {badge.label}
          </span>
        </div>
      </div>

      {/*  -----  texto de la publicación  -----  */}
      <p className="text-[15.5px] leading-[1.55] text-[#4A4038]">{post.body}</p>

      {/*  -----  fotos en carrusel  -----  */}
      {post.photos.length > 0 && <PhotoCarousel photos={post.photos} />}
    </article>
  );
};

export default FamilyPostCard;
