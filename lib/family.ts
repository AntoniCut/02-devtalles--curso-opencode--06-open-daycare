/*
    *  ---------------------------------------  *
    *  -----  family.ts  --  /lib/family.ts  -----  *
    *  ---------------------------------------  *
*/

import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { ChildParentRow } from "@/lib/kids";

/** - `niño del embed de parent_children (children + su sala)` */
export interface FamilyLinkChild {
  id: string;
  full_name: string;
  room_id: string | null;
  rooms: unknown;
}

/** - `vínculo del padre con un hijo (parent_children + children)` */
export interface FamilyLinkRow {
  relationship: ChildParentRow["relationship"];
  children: FamilyLinkChild | FamilyLinkChild[] | null;
}

/**
 * --------------------------------------
 * -----  `getFamilyLinks(parentId)`  -----
 * --------------------------------------
 * - Vínculos del padre con sus hijos (parent_children + children + sala),
 * - resueltos una sola vez por request (`React.cache`): el layout y la página
 * - de /familia comparten el mismo resultado.
 */
export const getFamilyLinks = cache(async (parentId: string): Promise<FamilyLinkRow[]> => {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  //  -----  hijos vinculados al padre (RLS: parent_children scoped)  -----
  const { data: links } = await supabase
    .from("parent_children")
    .select("relationship, children(id, full_name, room_id, rooms(name))")
    .eq("parent_id", parentId)
    .order("created_at");

  return (links ?? []) as FamilyLinkRow[];
});
