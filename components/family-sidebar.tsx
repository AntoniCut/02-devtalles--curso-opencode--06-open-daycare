/*
    *  -------------------------------------------------------------------  *
    *  -----  family-sidebar.tsx  --  /components/family-sidebar.tsx  -----  *
    *  -------------------------------------------------------------------  *
*/
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import { logout } from "@/app/(auth)/login/actions";
import { homeIcon, logoutIcon, sunIcon, userIcon } from "@/components/nav-icons";

/** - `usuario conectado mostrado por el family sidebar (viene del server via props)` */
export interface FamilySidebarUser {
  name: string;
  initials: string;
  relationshipLabel: string; // "Mamá de Mateo"
}

/** - `ítem del menú lateral` */
interface NavItem {
  label: string;
  href: string;
  icon: ReactElement;
}

/** - `entradas del menú lateral de familia` */
const navItems: NavItem[] = [
  { label: "Feed", href: "/familia", icon: homeIcon },
  { label: "Resumen del día", href: "/familia/resumen-dia", icon: sunIcon },
  { label: "Mi cuenta", href: "/familia/mi-cuenta", icon: userIcon },
];

/** - `estilos base de los enlaces del menú` */
const navItemBaseClass = "flex items-center gap-3 py-2.75 px-3 rounded-xl text-[14.5px]";

/** - `estilos del enlace del menú activo` */
const navItemActiveClass = "bg-[#FBE3D8] text-[#B14228] font-extrabold";

/** - `estilos de los enlaces del menú inactivos` */
const navItemInactiveClass = "text-[#6E6359] font-semibold";

/**
 * -----------------------------------
 * -----  `FamilySidebar(user)`  -----
 * -----------------------------------
 * - Barra lateral de la sección de familia: logo, navegación bajo /familia
 * - (sin botón de nueva publicación) y usuario con su parentesco.
 */
const FamilySidebar = ({ user }: { user: FamilySidebarUser }): ReactElement => {
  const pathname = usePathname();

  return (
    <aside className="w-full flex-none bg-[#FFFDF9] border-b border-[#ECE0D0] lg:border-b-0 lg:border-r lg:w-62 lg:sticky lg:top-0 lg:h-screen flex flex-col px-4 py-6">
      {/*  -----  logo  -----  */}
      <Link href="/familia" className="flex items-center gap-2.75 pt-1 px-2 pb-5.5">
        <div className="w-9.5 h-9.5 rounded-xl bg-linear-155/srgb from-[#F8C3A8] to-[#F2937A] text-white flex items-center justify-center flex-none">
          {sunIcon}
        </div>
        <div>
          <div className="font-display font-semibold text-[17px] text-[#3F362E] leading-none">OpenDayCare</div>
          <div className="text-[11.5px] text-[#6E6359] mt-0.5">Familia</div>
        </div>
      </Link>

      {/*  -----  menú lateral  -----  */}
      <nav aria-label="Menú de familia" className="flex flex-wrap lg:flex-col gap-1 flex-1 mt-1">
        {navItems.map((item) => {
          const isActive: boolean = item.href === "/familia" ? pathname === "/familia" : pathname.startsWith(item.href);

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
          <div className="w-9.5 h-9.5 rounded-full bg-[#C9B6E8] text-white font-display font-semibold text-base flex items-center justify-center flex-none">
            {user.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-sm text-[#3F362E]">{user.name}</div>
            <div className="text-xs text-[#6E6359]">{user.relationshipLabel}</div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="flex-none w-8 h-8 rounded-[10px] bg-[#F6ECDF] text-[#6E6359] flex items-center justify-center"
            >
              {logoutIcon}
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
};

export default FamilySidebar;
