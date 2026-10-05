/*
    *  -----------------------------------------------------------------  *
    *  -----  staff-sidebar.tsx  --  /components/staff-sidebar.tsx  -----  *
    *  -----------------------------------------------------------------  *
*/
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import { logout } from "@/app/(auth)/login/actions";
import {
  bellIcon,
  homeIcon,
  kidsIcon,
  logoutIcon,
  plusIcon,
  pokeballIcon,
  sunIcon,
  userIcon,
} from "@/components/nav-icons";

/** - `usuario conectado mostrado por el staff sidebar (viene del server via props)` */
export interface StaffSidebarUser {
  name: string;
  initials: string;
  roleLabel: string;
}

/** - `ítem del menú lateral` */
interface NavItem {
  label: string;
  href: string;
  icon: ReactElement;
}

/** - `entradas del menú lateral de guardería` */
const navItems: NavItem[] = [
  { label: "Feed", href: "/staff", icon: homeIcon },
  { label: "Niños", href: "/staff/kids", icon: kidsIcon },
  { label: "Pokémon", href: "/staff/pokemon", icon: pokeballIcon },
  { label: "Avisos", href: "/staff/avisos", icon: bellIcon },
  { label: "Mi cuenta", href: "/staff/mi-cuenta", icon: userIcon },
];

/** - `estilos base de los enlaces del menú` */
const navItemBaseClass = "flex items-center gap-3 py-2.75 px-3 rounded-xl text-[14.5px]";

/** - `estilos del enlace del menú activo` */
const navItemActiveClass = "bg-[#FBE3D8] text-[#B14228] font-extrabold";

/** - `estilos de los enlaces del menú inactivos` */
const navItemInactiveClass = "text-[#6E6359] font-semibold";

/**
 * ----------------------------------
 * -----  `StaffSidebar(user)`  -----
 * ----------------------------------
 * - Barra lateral de la sección de guardería: logo, botón de nueva publicación,
 * - navegación bajo /staff y usuario conectado.
 */
const StaffSidebar = ({ user }: { user: StaffSidebarUser }): ReactElement => {
  const pathname = usePathname();

  return (
    <aside className="w-full flex-none bg-[#FFFDF9] border-b border-[#ECE0D0] lg:border-b-0 lg:border-r lg:w-62 lg:sticky lg:top-0 lg:h-screen flex flex-col px-4 py-6">
      {/*  -----  logo  -----  */}
      <Link href="/staff" className="flex items-center gap-2.75 pt-1 px-2 pb-5.5">
        <div className="w-9.5 h-9.5 rounded-xl bg-linear-155/srgb from-[#F8C3A8] to-[#F2937A] text-white flex items-center justify-center flex-none">
          {sunIcon}
        </div>
        <div>
          <div className="font-display font-semibold text-[17px] text-[#3F362E] leading-none">OpenDayCare</div>
          <div className="text-[11.5px] text-[#6E6359] mt-0.5">Sala Soles</div>
        </div>
      </Link>

      {/*  -----  botón nueva publicación  -----  */}
      <Link
        href="/staff/crear-publicacion"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-[14px] bg-linear-to-b/srgb from-[#C2492D] to-[#B23E24] text-white font-extrabold text-[14.5px] shadow-[0_8px_18px_-8px_rgba(178,62,36,.6)] mb-4.5"
      >
        {plusIcon}
        Nueva publicación
      </Link>

      {/*  -----  menú lateral  -----  */}
      <nav aria-label="Menú de guardería" className="flex flex-wrap lg:flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive: boolean = item.href === "/staff" ? pathname === "/staff" : pathname.startsWith(item.href);

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
            <div className="text-xs text-[#6E6359]">{user.roleLabel}</div>
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

export default StaffSidebar;
