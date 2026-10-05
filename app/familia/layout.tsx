/*
    *  -----------------------------------------------------  *
    *  -----  layout.tsx  --  /app/familia/layout.tsx  -----  *
    *  -----------------------------------------------------  *
*/

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactElement } from "react";
import FamilySidebar from "@/components/family-sidebar";
import type { FamilySidebarUser } from "@/components/family-sidebar";
import { getAuthenticatedProfile } from "@/lib/auth";
import { formatRelationshipLabel } from "@/lib/kids";
import type { ChildParentRow } from "@/lib/kids";
import { isStaffRole } from "@/lib/roles";
import { createClient } from "@/utils/supabase/server";

/** - `vínculo del padre con cada hijo (parent_children + children)` */
interface FamilyLinkRow {
  relationship: ChildParentRow["relationship"];
  children: { full_name?: string } | Array<{ full_name?: string }> | null;
}

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

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  //  -----  hijos vinculados al padre (RLS: parent_children scoped)  -----
  const { data: links } = await supabase
    .from("parent_children")
    .select("relationship, children(full_name)")
    .eq("parent_id", profile.id)
    .order("created_at");
  const rows: FamilyLinkRow[] = links ?? [];
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
