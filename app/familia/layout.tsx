/*
    *  -----------------------------------------------------  *
    *  -----  layout.tsx  --  /app/familia/layout.tsx  -----  *
    *  -----------------------------------------------------  *
*/

import { redirect } from "next/navigation";
import type { ReactElement } from "react";
import FamilySidebar from "@/components/family-sidebar";
import type { FamilySidebarUser } from "@/components/family-sidebar";
import { getAuthenticatedProfile } from "@/lib/auth";
import { getFamilyLinks } from "@/lib/family";
import type { FamilyLinkRow } from "@/lib/family";
import { formatRelationshipLabel } from "@/lib/kids";
import { isStaffRole } from "@/lib/roles";

/**
 * -------------------------------------------------
 * -----  `childNamesFrom(links)`  -----
 * -------------------------------------------------
 * - Nombres de los hijos del padre desde el embed de parent_children.
 */
const childNamesFrom = (links: FamilyLinkRow[]): string[] =>
  links.flatMap((link) => {
    const children = link.children;
    if (Array.isArray(children)) {
      return children.flatMap((child) => (child.full_name ? [child.full_name] : []));
    }
    return children?.full_name ? [children.full_name] : [];
  });

/**
 * -----------------------------------
 * -----  `FamilyLayout(children)`  -----
 * -----------------------------------
 * - Shell de la sección de familia: resuelve el perfil y los hijos del padre,
 * - bloquea a staff/admin (defensa en profundidad además del proxy) y renderiza
 * - el family sidebar con el parentesco.
 */
const FamilyLayout = async ({ children }: LayoutProps<"/familia">): Promise<ReactElement> => {
  const profile = await getAuthenticatedProfile();

  //  -----  guard de sección: staff/admin usan la sección de guardería  -----
  if (isStaffRole(profile.role)) {
    redirect("/staff");
  }

  //  -----  vínculos del padre: helper cacheado compartido con la página  -----
  const rows: FamilyLinkRow[] = await getFamilyLinks(profile.id);
  const childNames: string[] = childNamesFrom(rows);

  //  -----  parentesco del sidebar: "Mamá de Mateo" (o "Familia" sin hijos)  -----
  const relationshipLabel: string = rows[0]
    ? formatRelationshipLabel(rows[0].relationship, childNames)
    : "Familia";

  const user: FamilySidebarUser = {
    name: profile.name,
    initials: profile.initials,
    relationshipLabel,
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F6ECDF] lg:flex-row">
      <FamilySidebar user={user} />
      <main className="flex-1 min-w-0 lg:h-screen lg:overflow-y-auto">{children}</main>
    </div>
  );
};

export default FamilyLayout;
