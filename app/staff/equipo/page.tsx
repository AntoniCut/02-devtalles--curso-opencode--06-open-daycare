/*
    *  ------------------------------------------------------  *
    *  -----  page.tsx  --  /app/staff/equipo/page.tsx  -----  *
    *  ------------------------------------------------------  *
*/
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import TeamInviteForm from "@/components/team-invite-form";
import { getAuthenticatedProfile } from "@/lib/auth";
import { generateInvitationCode } from "@/lib/invitation-code";
import { mapTeamMemberRow } from "@/lib/team";
import type { TeamMember, TeamMemberRow, TeamRoomOption } from "@/lib/team";
import { createClient } from "@/utils/supabase/server";

/** - `metadata de la página equipo` */
export const metadata: Metadata = {
  title: "Equipo · OpenDayCare",
};

/**
 * ----------------------------
 * -----  `EquipoPage()`  -----
 * ----------------------------
 * - Página del equipo de la guardería (solo admin): carga los miembros e
 * - invitaciones pendientes vía RPC, las salas de la guardería y un código
 * - provisional server-side para la tarjeta de invitación.
 */
const EquipoPage = async (): Promise<ReactElement> => {
  const profile = await getAuthenticatedProfile("/staff/equipo");

  //  -----  solo el admin administra el equipo; un staff vuelve a su feed  -----
  if (profile.role === "staff") {
    redirect("/staff");
  }

  //  -----  defensa en profundidad: un padre nunca ve las pantallas de guardería  -----
  if (profile.role !== "admin") {
    redirect("/familia");
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  //  -----  guardería del admin (para listar solo sus salas)  -----
  const { data: profileRow } = await supabase
    .from("users")
    .select("daycare_id")
    .eq("id", profile.id)
    .single();

  //  -----  miembros activos e invitaciones pendientes (RPC solo admin)  -----
  const { data: memberRows } = await supabase.rpc("get_team_members");

  /** - `equipo mapeado al modelo del listado` */
  const members: TeamMember[] = ((memberRows ?? []) as TeamMemberRow[]).map(mapTeamMemberRow);

  //  -----  salas de la guardería para el select de la invitación  -----
  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, name")
    .eq("daycare_id", profileRow?.daycare_id ?? "")
    .order("name");

  /** - `salas de la guardería con el shape del formulario` */
  const roomOptions: TeamRoomOption[] = (rooms ?? []).map((room) => ({ id: room.id, name: room.name }));

  /** - `código provisional visible en la tarjeta antes de enviar (patrón vincular-padre)` */
  const invitationCode: string = generateInvitationCode();

  return (
    <div className="min-h-screen flex items-start justify-center py-10 px-6 bg-[#F6ECDF]">
      <TeamInviteForm members={members} rooms={roomOptions} invitationCode={invitationCode} />
    </div>
  );
};

export default EquipoPage;
