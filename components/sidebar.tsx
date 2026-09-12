/*
    *  ------------------------------------------------------  *
    *  -----  sidebar.tsx  --  /components/sidebar.tsx  -----  *
    *  ------------------------------------------------------  *
*/
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";

/** - `usuario conectado mostrado por el sidebar (viene del server via props)` */
export interface SidebarUser {
  name: string;
  initials: string;
  role: string;
}

/** - `ítem del menú lateral` */
interface NavItem {
  label: string;
  href: string;
  icon: ReactElement;
}

/** - `icono sol del logo` */
const sunIcon: ReactElement = (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

/** - `icono más del botón nueva publicación` */
const plusIcon: ReactElement = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/** - `icono feed del menú` */
const homeIcon: ReactElement = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </svg>
);

/** - `icono niños del menú` */
const kidsIcon: ReactElement = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="3" />
    <circle cx="17" cy="9" r="2.4" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 20a5 5 0 0 1 5.5-4.9" />
  </svg>
);

/** - `icono avisos del menú` */
const bellIcon: ReactElement = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
  </svg>
);

/** - `icono mi cuenta del menú` */
const userIcon: ReactElement = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/** - `icono cerrar sesión` */
const logoutIcon: ReactElement = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

/** - `entradas del menú lateral` */
const navItems: NavItem[] = [
  { label: "Feed", href: "/", icon: homeIcon },
  { label: "Niños", href: "/kids", icon: kidsIcon },
  { label: "Avisos", href: "/avisos", icon: bellIcon },
  { label: "Mi cuenta", href: "/mi-cuenta", icon: userIcon },
];

/** - `estilos base de los enlaces del menú` */
const navItemBaseClass = "flex items-center gap-3 py-2.75 px-3 rounded-xl text-[14.5px]";

/** - `estilos del enlace del menú activo` */
const navItemActiveClass = "bg-[#FBE3D8] text-[#D9583C] font-extrabold";

/** - `estilos de los enlaces del menú inactivos` */
const navItemInactiveClass = "text-[#6E6359] font-semibold";

/**
 * -----------------------------
 * -----  `Sidebar()`  -----
 * -----------------------------
 * - Barra lateral compartida de las pantallas de maestra.
 */
const Sidebar = ({ user }: { user: SidebarUser }): ReactElement => {
  const pathname = usePathname();

  return (
    <aside className="w-62 flex-none bg-[#FFFDF9] border-r border-[#ECE0D0] flex flex-col px-4 py-6 sticky top-0 h-screen">
      {/*  -----  logo  -----  */}
      <Link href="/" className="flex items-center gap-2.75 pt-1 px-2 pb-5.5">
        <div className="w-9.5 h-9.5 rounded-xl bg-linear-155/srgb from-[#F8C3A8] to-[#F2937A] flex items-center justify-center flex-none">
          {sunIcon}
        </div>
        <div>
          <div className="font-display font-semibold text-[17px] text-[#3F362E] leading-none">OpenDayCare</div>
          <div className="text-[11.5px] text-[#A89A8B] mt-0.5">Sala Soles</div>
        </div>
      </Link>

      {/*  -----  botón nueva publicación  -----  */}
      <Link
        href="/crear-publicacion"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-[14px] bg-linear-to-b/srgb from-[#F4977E] to-[#EE8164] text-white font-extrabold text-[14.5px] shadow-[0_8px_18px_-8px_rgba(238,129,100,.75)] mb-4.5"
      >
        {plusIcon}
        Nueva publicación
      </Link>

      {/*  -----  menú lateral  -----  */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive: boolean = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${navItemBaseClass} ${isActive ? navItemActiveClass : navItemInactiveClass}`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/*  -----  usuario conectado  -----  */}
      <div className="border-t border-[#ECE0D0] pt-3.5 mt-2.5">
        <div className="flex items-center gap-2.75 px-2 py-1.5">
          <div className="w-9.5 h-9.5 rounded-full bg-[#F2937A] text-white font-display font-semibold text-base flex items-center justify-center flex-none">
            {user.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-sm text-[#3F362E]">{user.name}</div>
            <div className="text-xs text-[#A89A8B]">{user.role}</div>
          </div>
          <Link
            href="/login"
            title="Cerrar sesión"
            className="flex-none w-8 h-8 rounded-[10px] bg-[#F6ECDF] text-[#94887B] flex items-center justify-center"
          >
            {logoutIcon}
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
