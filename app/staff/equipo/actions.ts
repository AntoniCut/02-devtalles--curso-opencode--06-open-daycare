/*
    *  ----------------------------------------------------------  *
    *  -----  actions.ts  --  /app/staff/equipo/actions.ts  -----  *
    *  ----------------------------------------------------------  *
*/
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { getAuthenticatedUser } from "@/lib/auth";
import { CODE_PATTERN, generateInvitationCode } from "@/lib/invitation-code";
import { ROLE_LABELS } from "@/lib/roles";
import type { TeamRole } from "@/lib/team";
import { TeamInvitationEmail } from "@/app/staff/equipo/team-invitation-email";
import { createClient } from "@/utils/supabase/server";

/** - `estado que devuelve la Server Action de invitar al equipo al formulario` */
export interface SendTeamInvitationState {
  error: string | null;
}

/** - `formato de email admitido` */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** - `días de vigencia de la invitación` */
const EXPIRATION_DAYS = 7;

/** - `cliente de Resend (envío del lado de Next.js, nunca en el browser)` */
const resend = new Resend(process.env.RESEND_API_KEY);

/** - `remitente del email (onboarding@resend.dev de prueba; dominio verificado en producción)` */
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

/** - `URL base de la app para el link de activación del email` */
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL ?? "http://localhost:3000";

/**
 * --------------------------------------------------
 * -----  `sendTeamInvitation(prev, formData)`  -----
 * --------------------------------------------------
 * - Server Action que revalida el formulario (solo admin de la guardería),
 *   inserta la invitación de equipo (reintenta si el código choca con UNIQUE)
 *   y envía el email con Resend. Si el envío falla, borra la invitación y
 *   devuelve el error inline; al éxito redirige a `/staff/equipo`.
 */
export const sendTeamInvitation = async (
  _prevState: SendTeamInvitationState,
  formData: FormData,
): Promise<SendTeamInvitationState> => {
  const code = String(formData.get("code") ?? "").toUpperCase();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const rawRole = String(formData.get("role") ?? "");
  const roomId = String(formData.get("roomId") ?? "");

  //  -----  validación server-side (los requeridos ya se validan en el cliente)  -----
  if (!name || !email || !EMAIL_PATTERN.test(email) || !CODE_PATTERN.test(code) || (rawRole !== "staff" && rawRole !== "admin")) {
    return { error: "No se pudo enviar la invitación. Revisá los campos." };
  }

  /** - `rol validado del miembro a invitar` */
  const role: TeamRole = rawRole === "admin" ? "admin" : "staff";

  //  -----  la sala es obligatoria para Maestra y no aplica para Administrador  -----
  if (role === "staff" && !roomId) {
    return { error: "Elegí una sala para la Maestra." };
  }
  if (role === "admin" && roomId) {
    return { error: "No se pudo enviar la invitación. Revisá los campos." };
  }

  const user = await getAuthenticatedUser("/staff/equipo");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  //  -----  revalidación de rol: solo el admin de una guardería invita  -----
  const { data: profile } = await supabase
    .from("users")
    .select("role, daycare_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Solo un administrador puede invitar al equipo." };
  }

  //  -----  la sala debe ser de la propia guardería (defensa en profundidad)  -----
  let roomName: string | null = null;
  if (role === "staff") {
    const { data: room } = await supabase
      .from("rooms")
      .select("id, name, daycare_id")
      .eq("id", roomId)
      .single();

    if (!room || room.daycare_id !== profile.daycare_id) {
      return { error: "La sala elegida no es de tu guardería." };
    }
    roomName = room.name;
  }

  //  -----  nombre de la guardería para el email  -----
  const { data: daycare } = await supabase
    .from("daycares")
    .select("name")
    .eq("id", profile.daycare_id)
    .single();
  const daycareName: string = daycare?.name ?? "OpenDayCare";

  //  -----  insert con reintentos si el código chocó con otro (columna UNIQUE)  -----
  const expiresAt = new Date(Date.now() + EXPIRATION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  let finalCode: string = code;
  let invitationId: string | null = null;
  let insertFailed = false;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabase
      .from("staff_invitations")
      .insert({
        daycare_id: profile.daycare_id,
        invited_by: user.id,
        full_name: name,
        email,
        role,
        room_id: role === "staff" ? roomId : null,
        code: finalCode,
        status: "pending",
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    //  -----  invitación creada: seguir con el email  -----
    if (!error && data) {
      invitationId = data.id;
      break;
    }
    //  -----  código duplicado: regenerar y reintentar  -----
    if (error?.code === "23505") {
      finalCode = generateInvitationCode();
      continue;
    }
    insertFailed = true;
    break;
  }

  if (!invitationId || insertFailed) {
    return { error: "No se pudo crear la invitación. Intentá de nuevo." };
  }

  //  -----  envío del email con Resend; si falla se revierte la invitación  -----
  const { error: sendError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Invitación al equipo de OpenDayCare — código ${finalCode}`,
    react: TeamInvitationEmail({
      code: finalCode,
      roleLabel: ROLE_LABELS[role],
      roomName,
      daycareName,
      expiresLabel: `Vence en ${EXPIRATION_DAYS} días`,
      activateUrl: `${APP_BASE_URL}/activate?code=${finalCode}`,
    }),
  });

  if (sendError) {
    await supabase.from("staff_invitations").delete().eq("id", invitationId);
    return { error: "No se pudo enviar el email. Intentá de nuevo." };
  }

  redirect("/staff/equipo");
};
