/*
    *  ---------------------------------------------------  *
    *  -----  layout.tsx  --  /app/staff/layout.tsx  -----  *
    *  ---------------------------------------------------  *
*/

import { redirect } from "next/navigation";
import type { ReactElement } from "react";
import StaffSidebar from "@/components/staff-sidebar";
import { getAuthenticatedProfile } from "@/lib/auth";

/**
 * ----------------------------------
 * -----  `StaffLayout(children)`  -----
 * ----------------------------------
 * - Shell de la sección de guardería: resuelve el perfil, bloquea a los padres
 * - (defensa en profundidad además del proxy) y renderiza el staff sidebar.
 */
const StaffLayout = async ({ children }: LayoutProps<"/staff">): Promise<ReactElement> => {
  const profile = await getAuthenticatedProfile();

  //  -----  guard de sección: un padre nunca ve las pantallas de guardería  -----
  if (profile.role === "parent") {
    redirect("/familia");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F6ECDF] lg:flex-row">
      <StaffSidebar
        user={{ name: profile.name, initials: profile.initials, roleLabel: profile.roleLabel }}
      />
      <main className="flex-1 min-w-0 lg:h-screen lg:overflow-y-auto">{children}</main>
    </div>
  );
};

export default StaffLayout;
