/*
    *  ---------------------------------------  *
    *  -----  team.ts  --  /lib/team.ts  -----  *
    *  ---------------------------------------  *
*/

import { ROLE_LABELS } from "@/lib/roles";
import type { UserRole } from "@/lib/roles";

/** - `roles que puede tener un miembro del equipo (staff o admin)` */
export type TeamRole = Extract<UserRole, "staff" | "admin">;

/** - `estado de un miembro del equipo: activo o invitación pendiente` */
export type TeamStatus = "active" | "pending";

/** - `miembro del equipo (activo o invitación pendiente) de /staff/equipo` */
export interface TeamMember {
  userId: string | null; // null en invitaciones pendientes
  invitationId: string | null; // null en miembros activos
  fullName: string;
  email: string; // email del perfil o de la invitación
  role: TeamRole;
  roomName: string | null; // sala del staff; null en admin
  status: TeamStatus;
  expiresAt: string | null; // ISO de vencimiento; null en miembros activos
}

/** - `fila del RPC get_team_members (columnas snake_case de la DB)` */
export interface TeamMemberRow {
  user_id: string | null;
  invitation_id: string | null;
  full_name: string;
  email: string | null;
  role: TeamRole;
  room_name: string | null;
  status: string; // 'active' | 'pending'
  expires_at: string | null;
}

/** - `etiquetas de los badges de estado del listado` */
export const TEAM_STATUS_LABELS: Record<TeamStatus, string> = {
  active: "ACTIVO",
  pending: "PENDIENTE",
};

/** - `colores de los badges de estado (verde activo / ámbar pendiente)` */
export const TEAM_STATUS_BADGES: Record<TeamStatus, { color: string; background: string }> = {
  active: { color: "#3E9B6C", background: "#CFEBD8" },
  pending: { color: "#9A7B1E", background: "#F7E7A6" },
};

/**
 * ----------------------------------------
 * -----  `teamRoleLabel(role)`  -----
 * ----------------------------------------
 * - Etiqueta en español del rol del equipo ("Maestra" / "Administrador").
 */
export const teamRoleLabel = (role: TeamRole): string => ROLE_LABELS[role];

/**
 * ------------------------------------------------
 * -----  `teamExpiresLabel(expiresAt)`  -----
 * ------------------------------------------------
 * - Vencimiento relativo de una invitación pendiente ("Vence en 5 días");
 * - null si no hay fecha (miembros activos).
 */
export const teamExpiresLabel = (expiresAt: string | null): string | null => {
  //  -----  sin fecha de vencimiento no hay etiqueta  -----
  if (!expiresAt) {
    return null;
  }

  //  -----  días completos que faltan hasta el vencimiento  -----
  const days: number = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));

  //  -----  vence hoy  -----
  if (days === 0) {
    return "Vence hoy";
  }

  //  -----  vence en 1 día o en N días  -----
  return days === 1 ? "Vence en 1 día" : `Vence en ${days} días`;
};

/**
 * ------------------------------------------------
 * -----  `mapTeamMemberRow(row)`  -----
 * ------------------------------------------------
 * - Mapea una fila del RPC get_team_members al modelo TeamMember del listado.
 */
export const mapTeamMemberRow = (row: TeamMemberRow): TeamMember => ({
  userId: row.user_id,
  invitationId: row.invitation_id,
  fullName: row.full_name,
  email: row.email ?? "",
  role: row.role,
  roomName: row.room_name,
  status: row.status === "pending" ? "pending" : "active",
  expiresAt: row.expires_at,
});
