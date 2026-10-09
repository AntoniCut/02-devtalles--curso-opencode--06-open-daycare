/*
    *  ------------------------------------------------------------------------  *
    *  -----  team-invite-form.tsx  --  /components/team-invite-form.tsx  -----  *
    *  ------------------------------------------------------------------------  *
*/
"use client";

import type { ReactElement } from "react";
import { avatarFor } from "@/lib/kids";
import { TEAM_STATUS_BADGES, TEAM_STATUS_LABELS, teamExpiresLabel, teamRoleLabel } from "@/lib/team";
import type { TeamMember, TeamRoomOption } from "@/lib/team";

/** - `props del listado del equipo y de la tarjeta de invitación` */
interface TeamInviteFormProps {
  members: TeamMember[];
  rooms: TeamRoomOption[]; // salas de la guardería para el select de la invitación
  invitationCode: string; // código provisional generado server-side
}

/**
 * -------------------------------------
 * -----  `TeamInviteForm(props)`  -----
 * -------------------------------------
 * - Listado del equipo de la guardería: miembros activos (nombre, rol y sala)
 * - e invitaciones pendientes (badge PENDIENTE con su vencimiento).
 */
const TeamInviteForm = ({ members }: TeamInviteFormProps): ReactElement => {
  return (
    <div className="w-full max-w-[640px]">
      {/*  -----  header de la sección  -----  */}
      <div className="mb-6">
        <div className="text-[12.5px] font-extrabold tracking-[.8px] text-[#D9583C] mb-1">GUARDERÍA · EQUIPO</div>
        <h1 className="font-display font-semibold text-[30px] text-[#3F362E]">Equipo</h1>
        <p className="mt-1.25 text-[#94887B] text-[14.5px]">
          {members.length === 1 ? "1 miembro" : `${members.length} miembros`}
        </p>
      </div>

      {/*  -----  listado de miembros e invitaciones pendientes  -----  */}
      <section
        aria-label="Miembros del equipo"
        className="bg-[#FFFDF9] border border-[#ECE0D0] rounded-[20px] shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)] overflow-hidden"
      >
        {members.map((member) => {
          /** - `avatar con color determinístico según el nombre` */
          const avatar = avatarFor(member.fullName);

          /** - `vencimiento de las invitaciones pendientes (null en activos)` */
          const expiresLabel: string | null = teamExpiresLabel(member.expiresAt);

          /** - `línea secundaria: rol y sala (el admin no tiene sala)` */
          const roleLine: string = member.roomName
            ? `${teamRoleLabel(member.role)} · ${member.roomName}`
            : teamRoleLabel(member.role);

          /** - `colores del badge de estado (verde activo / ámbar pendiente)` */
          const badge = TEAM_STATUS_BADGES[member.status];

          return (
            <article
              key={member.invitationId ?? member.userId}
              className="flex items-center gap-3.5 px-5 py-4 border-b border-[#F0E6D8] last:border-b-0"
            >
              {/*  -----  avatar con la inicial  -----  */}
              <div
                aria-hidden="true"
                className="w-10 h-10 rounded-full text-white font-display font-semibold text-base flex items-center justify-center flex-none"
                style={{ background: avatar.background }}
              >
                {member.fullName.trim().charAt(0).toUpperCase()}
              </div>

              {/*  -----  nombre, rol y sala  -----  */}
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-[15px] text-[#3F362E] truncate">{member.fullName}</div>
                <div className="text-[13px] text-[#94887B] truncate">{roleLine}</div>
              </div>

              {/*  -----  estado y vencimiento  -----  */}
              <div className="flex flex-col items-end gap-1 flex-none">
                <span
                  className="text-[11px] font-extrabold tracking-[.6px] px-2.5 py-1 rounded-full"
                  style={{ color: badge.color, background: badge.background }}
                >
                  {TEAM_STATUS_LABELS[member.status]}
                </span>
                {expiresLabel && <span className="text-[11.5px] text-[#A88526]">{expiresLabel}</span>}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
};

export default TeamInviteForm;
