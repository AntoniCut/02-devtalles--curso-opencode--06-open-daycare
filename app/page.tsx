/*
    *  -----------------------------------------  *
    *  -----  page.tsx  --  /app/page.tsx  -----  *
    *  -----------------------------------------  *
*/
import Link from "next/link";
import type { ReactElement } from "react";
import Sidebar from "@/components/sidebar";
import PostCard from "@/components/post-card";
import { classroom, posts } from "@/lib/feed";
import { getAuthenticatedProfile } from "@/lib/auth";

/** - `icono cámara del composer` */
const cameraIcon: ReactElement = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

/**
 * ----------------------
 * -----  `Home()`  -----
 * ----------------------
 * - Home del feed de maestra: sidebar, saludo, composer y publicaciones del día.
 */
const Home = async (): Promise<ReactElement> => {
  const profile = await getAuthenticatedProfile();
  const firstName: string = profile.name.split(" ")[0];

  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar user={profile} />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-[760px] w-full mx-auto px-10 pt-8.5 pb-20">
          {/*  -----  saludo de la sala  -----  */}
          <div className="mb-6">
            <div className="text-[12.5px] font-extrabold tracking-[.8px] text-[#D9583C] mb-1">{classroom.label}</div>
            <h1 className="font-display font-semibold text-[30px] text-[#3F362E]">Buenas, {firstName}</h1>
            <p className="mt-1.25 text-[#94887B] text-[14.5px]">{classroom.childrenCount} niños · {classroom.date}</p>
          </div>

          {/*  -----  composer  -----  */}
          <Link
            href="/crear-publicacion"
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

          {/*  -----  separador publicado hoy  -----  */}
          <div className="flex items-center gap-3.5 mb-3.5">
            <span className="text-[12.5px] font-extrabold tracking-[.8px] text-[#8A7C6D]">PUBLICADO HOY</span>
            <span className="flex-1 h-px bg-[#E7DAC8]" />
          </div>

          {/*  -----  publicaciones  -----  */}
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
