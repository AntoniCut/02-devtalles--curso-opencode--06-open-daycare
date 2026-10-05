/*
    *  ---------------------------------------------------------  *
    *  -----  family-feed.tsx  --  /components/family-feed.tsx  -----  *
    *  ---------------------------------------------------------  *
*/
"use client";

import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import FamilyPostCard from "@/components/family-post-card";
import { firstName, formatFamilyDaySeparator, groupPostsByDay } from "@/lib/posts";
import type { FamilyChild, FamilyFeedPost, PostDayGroup } from "@/lib/posts";

/** - `props del feed de familia (hijos para los pills y publicaciones visibles)` */
interface FamilyFeedProps {
  posts: FamilyFeedPost[];
  kids: FamilyChild[];
}

/** - `estilos base de los pills de hijo` */
const pillBaseClass =
  "flex items-center gap-2 rounded-full border-[1.5px] font-bold text-[14px] py-1.75 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9583C]";

/** - `estilos del pill seleccionado` */
const pillSelectedClass = "border-[#3F362E] bg-[#3F362E] text-white";

/** - `estilos de los pills inactivos` */
const pillInactiveClass = "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]";

/**
 * ---------------------------------------
 * -----  `FamilyFeed(posts, kids)`  -----
 * ---------------------------------------
 * - Feed de familia con filtro local por hijo: el servidor entrega todo lo
 * - visible por RLS y los pills filtran sin volver al servidor. Un hijo
 * - seleccionado muestra sus publicaciones etiquetadas y los anuncios de su sala.
 */
const FamilyFeed = ({ posts, kids }: FamilyFeedProps): ReactElement => {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const selectedChild: FamilyChild | null =
    kids.find((child) => child.id === selectedChildId) ?? null;

  //  -----  filtro: hijo seleccionado → sus publicaciones + anuncios de su sala  -----
  const visiblePosts: FamilyFeedPost[] = useMemo(() => {
    if (!selectedChild) {
      return posts;
    }

    return posts.filter(
      (post) =>
        post.children.some((child) => child.id === selectedChild.id) ||
        (post.roomId !== null && post.roomId === selectedChild.roomId),
    );
  }, [posts, selectedChild]);

  //  -----  agrupado por día con el separador de familia  -----
  const groups: PostDayGroup<FamilyFeedPost>[] = useMemo(
    () => groupPostsByDay(visiblePosts, formatFamilyDaySeparator),
    [visiblePosts],
  );

  return (
    <>
      {/*  -----  pills de hijo + "Todos"  -----  */}
      <div className="flex gap-2.5 mb-5.5 flex-wrap">
        {kids.map((child) => {
          const isSelected: boolean = child.id === selectedChildId;

          return (
            <button
              key={child.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedChildId(isSelected ? null : child.id)}
              className={`${pillBaseClass} pl-2 pr-3.75 ${isSelected ? pillSelectedClass : pillInactiveClass}`}
            >
              <span
                className="w-6.5 h-6.5 rounded-full flex items-center justify-center flex-none font-display font-semibold text-[13px]"
                style={{ background: child.background, color: child.color }}
              >
                {child.initial}
              </span>
              {firstName(child.name)}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={selectedChildId === null}
          onClick={() => setSelectedChildId(null)}
          className={`${pillBaseClass} px-4 ${selectedChildId === null ? pillSelectedClass : pillInactiveClass}`}
        >
          Todos
        </button>
      </div>

      {/*  -----  publicaciones agrupadas por día  -----  */}
      {groups.length > 0 ? (
        groups.map((group) => (
          <section key={group.label} className="mb-6 last:mb-0">
            <div className="flex items-center gap-3.5 mb-3.5">
              <span className="text-[12.5px] font-extrabold tracking-[.8px] text-[#6E6359]">{group.label}</span>
              <span className="flex-1 h-px bg-[#E7DAC8]" />
            </div>
            <div className="flex flex-col gap-4">
              {group.posts.map((post) => (
                <FamilyPostCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        ))
      ) : (
        /*  -----  empty state del filtro o del feed (role=status lo anuncia al filtrar)  -----  */
        <div role="status" className="bg-[#FFFDF9] border border-[#ECE0D0] rounded-[20px] py-10 px-6 text-center shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
          <p className="font-display font-semibold text-[18px] text-[#3F362E]">
            {selectedChild ? `Todavía no hay novedades de ${firstName(selectedChild.name)}` : "Todavía no hay publicaciones"}
          </p>
          <p className="mt-1.5 text-[14px] text-[#6E6359]">Las novedades de la sala van a aparecer acá.</p>
        </div>
      )}
    </>
  );
};

export default FamilyFeed;
