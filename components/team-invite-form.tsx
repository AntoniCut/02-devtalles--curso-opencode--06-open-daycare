/*
    *  ------------------------------------------------------------------------  *
    *  -----  team-invite-form.tsx  --  /components/team-invite-form.tsx  -----  *
    *  ------------------------------------------------------------------------  *
*/
"use client";

import { useState } from "react";
import type { ChangeEvent, ReactElement, SubmitEvent } from "react";
import { avatarFor } from "@/lib/kids";
import { ROLE_LABELS } from "@/lib/roles";
import { TEAM_STATUS_BADGES, TEAM_STATUS_LABELS, teamExpiresLabel, teamRoleLabel } from "@/lib/team";
import type { TeamMember, TeamRole, TeamRoomOption } from "@/lib/team";

/** - `props del listado del equipo y de la tarjeta de invitación` */
interface TeamInviteFormProps {
  members: TeamMember[];
  rooms: TeamRoomOption[]; // salas de la guardería para el select de la invitación
  invitationCode: string; // código provisional generado server-side
}

/** - `errores de validación del formulario de invitación, por campo` */
interface InviteFormErrors {
  name?: string;
  email?: string;
  room?: string;
}

/** - `roles seleccionables de la invitación (pills)` */
const roleOptions: TeamRole[] = ["staff", "admin"];

/** - `formato de email admitido` */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** - `estilos de las etiquetas de los campos (sin margen)` */
const labelClasses: string = "block text-[12px] font-extrabold tracking-[.7px] text-[#94887B]";

/** - `icono persona+ del botón invitar miembro` */
const inviteIcon: ReactElement = (
  <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="3.2" />
    <path d="M2.8 20a6.2 6.2 0 0 1 12.4 0M18 7v6M15 10h6" />
  </svg>
);

/** - `icono X de cierre de la tarjeta` */
const closeIcon: ReactElement = (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

/** - `icono send del CTA enviar invitación` */
const sendIcon: ReactElement = (
  <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4z" />
    <path d="M22 2 11 13" />
  </svg>
);

/** - `icono info del banner azul` */
const infoIcon: ReactElement = (
  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4E72C8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

/**
 * -------------------------------------
 * -----  `fieldStyles(hasError)`  -----
 * -------------------------------------
 * - Estilos de un campo; borde rojo cuando tiene error de validación.
 */
const fieldStyles = (hasError: boolean): string => `w-full py-[13px] px-4 rounded-[14px] border-[1.5px] ${hasError ? "border-[#D9583C]" : "border-[#EADFD0]"} bg-white text-[15px] text-[#3F362E] outline-none placeholder:text-[#B6A99B]`;

/**
 * --------------------------------------
 * -----  `selectStyles(hasError)`  -----
 * --------------------------------------
 * - Estilos del select de sala; borde rojo cuando tiene error de validación.
 */
const selectStyles = (hasError: boolean): string => `w-full py-[13px] px-4 rounded-[14px] border-[1.5px] ${hasError ? "border-[#D9583C]" : "border-[#EADFD0]"} bg-white text-[15px] text-[#3F362E] outline-none cursor-pointer`;

/**
 * ------------------------------------
 * -----  `pillStyles(selected)`  -----
 * ------------------------------------
 * - Estilos de una pill de rol según esté seleccionada o no.
 */
const pillStyles = (selected: boolean): string => `flex-1 py-[11px] rounded-full border-[1.5px] font-extrabold text-[14px] cursor-pointer ${selected ? "border-[#9FB8EC] bg-[#CCD8F4] text-[#4E72C8]" : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"}`;

/**
 * ---------------------------------------------------------
 * -----  `validateInvite(name, email, role, roomId)`  -----
 * ---------------------------------------------------------
 * - Valida los requeridos del formulario; la sala es obligatoria para Maestra.
 */
const validateInvite = (name: string, email: string, role: TeamRole, roomId: string): InviteFormErrors => {
  const errors: InviteFormErrors = {};

  //  -----  nombre: requerido  -----
  if (name.trim() === "") {
    errors.name = "Campo requerido";
  }
  //  -----  email: requerido  -----
  if (email === "") {
    errors.email = "Campo requerido";
  }
  //  -----  email: formato inválido  -----
  else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Email inválido";
  }
  //  -----  sala: obligatoria cuando el rol es Maestra  -----
  if (role === "staff" && roomId === "") {
    errors.room = "Elegí una sala";
  }
  return errors;
};

/**
 * -------------------------------------
 * -----  `TeamInviteForm(props)`  -----
 * -------------------------------------
 * - Listado del equipo de la guardería (miembros activos e invitaciones
 * - pendientes) y tarjeta desplegable para invitar: nombre, email, rol, sala
 * - y el código provisional generado server-side.
 */
const TeamInviteForm = ({ members, rooms, invitationCode }: TeamInviteFormProps): ReactElement => {
  const [isInviteOpen, setIsInviteOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<TeamRole>("staff");
  const [roomId, setRoomId] = useState<string>("");
  const [errors, setErrors] = useState<InviteFormErrors>({});

  /**
   * --------------------------------
   * -----  `handleRole(item)`  -----
   * --------------------------------
   * - Marca el rol elegido; Administrador no lleva sala, así que la limpia.
   */
  const handleRole = (item: TeamRole): void => {
    setRole(item);

    //  -----  Administrador: sin sala  -----
    if (item === "admin") {
      setRoomId("");
      setErrors((current) => ({ ...current, room: undefined }));
    }
  };

  /**
   * -----------------------------------------------
   * -----  `clearErrorIfValid(field, value)`  -----
   * -----------------------------------------------
   * - Limpia el error de un campo cuando su valor pasa a ser válido.
   */
  const clearErrorIfValid = (field: keyof InviteFormErrors, value: string): void => {
    //  -----  el campo no tiene error, nada que limpiar  -----
    if (!errors[field]) {
      return;
    }

    let isValid: boolean = true;

    //  -----  nombre: válido con contenido  -----
    if (field === "name") {
      isValid = value.trim() !== "";
    }
    //  -----  email: válido con formato  -----
    if (field === "email") {
      isValid = EMAIL_PATTERN.test(value);
    }
    //  -----  sala: válida con una opción elegida  -----
    if (field === "room") {
      isValid = value !== "";
    }

    //  -----  el nuevo valor es válido: quitar el error  -----
    if (isValid) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  //  -----  nombre del miembro invitado  -----
  const handleNameChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setName(event.target.value);
    clearErrorIfValid("name", event.target.value);
  };

  //  -----  email del miembro invitado  -----
  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setEmail(event.target.value);
    clearErrorIfValid("email", event.target.value);
  };

  //  -----  sala elegida (solo Maestra)  -----
  const handleRoomChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    setRoomId(event.target.value);
    clearErrorIfValid("room", event.target.value);
  };

  /**
   * -----------------------------------
   * -----  `handleSubmit(event)`  -----
   * -----------------------------------
   * - Valida el formulario en el cliente y evita navegar; el envío al servidor
   * - se conecta con la Server Action de la invitación.
   */
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>): void => {
    const nextErrors = validateInvite(name, email, role, roomId);
    setErrors(nextErrors);

    //  -----  evitar la navegación por defecto del submit  -----
    event.preventDefault();
  };

  return (
    <div className="w-full max-w-[640px]">
      {/*  -----  header de la sección con el botón de invitar  -----  */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="text-[12.5px] font-extrabold tracking-[.8px] text-[#D9583C] mb-1">GUARDERÍA · EQUIPO</div>
          <h1 className="font-display font-semibold text-[30px] text-[#3F362E]">Equipo</h1>
          <p className="mt-1.25 text-[#94887B] text-[14.5px]">
            {members.length === 1 ? "1 miembro" : `${members.length} miembros`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsInviteOpen((open) => !open)}
          aria-expanded={isInviteOpen}
          aria-controls="team-invite-card"
          className="flex items-center gap-2 flex-none py-3 px-4.5 rounded-[14px] bg-linear-to-b/srgb from-[#F4977E] to-[#EE8164] text-white font-extrabold text-[14px] shadow-[0_10px_22px_-10px_rgba(238,129,100,.7)] cursor-pointer mt-1"
        >
          {inviteIcon}
          Invitar miembro
        </button>
      </div>

      {/*  -----  tarjeta de invitación desplegable  -----  */}
      {isInviteOpen && (
        <form
          id="team-invite-card"
          onSubmit={handleSubmit}
          noValidate
          className="w-full bg-[#FBF4EC] border border-[#ECE0D0] rounded-[24px] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)] overflow-hidden mb-6"
        >
          {/*  -----  hidden: código provisional y rol elegido  -----  */}
          <input type="hidden" name="code" value={invitationCode} />
          <input type="hidden" name="role" value={role} />

          {/*  -----  header de la tarjeta  -----  */}
          <div className="flex items-center justify-between py-5 px-[26px] border-b border-[#ECE0D0]">
            <div>
              <div className="font-display font-semibold text-[18px] text-[#3F362E]">Invitar miembro</div>
              <div className="text-[13px] text-[#A89A8B]">al equipo de la guardería</div>
            </div>
            <button
              type="button"
              onClick={() => setIsInviteOpen(false)}
              aria-label="Cerrar"
              className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[#F0E6D8] text-[#94887B] cursor-pointer"
            >
              {closeIcon}
            </button>
          </div>

          {/*  -----  cuerpo de la tarjeta  -----  */}
          <div className="py-[22px] px-[26px]">
            {/*  -----  banner informativo azul  -----  */}
            <div className="flex gap-[11px] rounded-[14px] bg-[#E3ECFB] px-4 py-[13px] mb-5">
              <span className="pointer-events-none mt-px flex-none">{infoIcon}</span>
              <p className="text-[13.5px] text-[#3F5694] leading-[1.45]">Le enviaremos un correo con un código para que active su cuenta y acceda al panel de la guardería.</p>
            </div>

            {/*  -----  nombre del miembro  -----  */}
            <div className="mb-[18px]">
              <label htmlFor="invite-name" className={`${labelClasses} mb-2`}>NOMBRE DEL MIEMBRO</label>
              <input
                id="invite-name"
                name="name"
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Ej. Paula Gómez"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "invite-name-error" : undefined}
                className={fieldStyles(Boolean(errors.name))}
              />
              {errors.name && <p id="invite-name-error" className="mt-1.5 text-[12.5px] font-bold text-[#D9583C]">{errors.name}</p>}
            </div>

            {/*  -----  email del miembro  -----  */}
            <div className="mb-[18px]">
              <label htmlFor="invite-email" className={`${labelClasses} mb-2`}>EMAIL</label>
              <input
                id="invite-email"
                name="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="correo@ejemplo.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "invite-email-error" : undefined}
                className={fieldStyles(Boolean(errors.email))}
              />
              {errors.email && <p id="invite-email-error" className="mt-1.5 text-[12.5px] font-bold text-[#D9583C]">{errors.email}</p>}
            </div>

            {/*  -----  rol (pills seleccionables)  -----  */}
            <div className="mb-5">
              <div className={`${labelClasses} mb-[10px]`}>ROL</div>
              <div className="flex gap-[9px]">
                {roleOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleRole(item)}
                    aria-pressed={role === item}
                    className={pillStyles(role === item)}
                  >
                    {ROLE_LABELS[item]}
                  </button>
                ))}
              </div>
            </div>

            {/*  -----  sala: obligatoria para Maestra, oculta para Administrador  -----  */}
            {role === "staff" && (
              <div className="mb-[18px]">
                <label htmlFor="invite-room" className={`${labelClasses} mb-2`}>SALA</label>
                <select
                  id="invite-room"
                  name="roomId"
                  value={roomId}
                  onChange={handleRoomChange}
                  aria-invalid={Boolean(errors.room)}
                  aria-describedby={errors.room ? "invite-room-error" : undefined}
                  className={selectStyles(Boolean(errors.room))}
                >
                  <option value="">Elegí una sala</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>
                {errors.room && <p id="invite-room-error" className="mt-1.5 text-[12.5px] font-bold text-[#D9583C]">{errors.room}</p>}
              </div>
            )}

            {/*  -----  tarjeta del código de invitación  -----  */}
            <div className="rounded-[16px] border-[1.5px] border-dashed border-[#E6D08A] bg-[#FBF1D6] px-[18px] py-[18px] text-center mb-5">
              <div className="block text-[12px] font-extrabold tracking-[.7px] text-[#A88526] mb-2">CÓDIGO DE INVITACIÓN</div>
              <div className="font-display font-semibold text-[34px] tracking-[7px] text-[#8A7234]">{invitationCode}</div>
              <p className="text-[13px] text-[#A88526] mt-[6px]">Vence en 7 días</p>
            </div>

            {/*  -----  CTA enviar invitación  -----  */}
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] py-[14px] text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] cursor-pointer"
            >
              {sendIcon}
              Enviar invitación
            </button>
          </div>
        </form>
      )}

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
