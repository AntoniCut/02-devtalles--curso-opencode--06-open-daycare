/*
    *  -------------------------------------------------------  *
    *  -----  actions.ts  --  /app/vincular-padre/actions.ts  -----  *
    *  -------------------------------------------------------  *
*/
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { getAuthenticatedUser } from "@/lib/auth";
import { slugify } from "@/lib/kids";
import { CODE_PATTERN, generateInvitationCode } from "@/lib/invitation-code";
import { InvitationEmail } from "@/app/vincular-padre/invitation-email";
import { createClient } from "@/utils/supabase/server";

/** - `estado que devuelve la Server Action de enviar invitación al formulario` */
export interface SendInvitationState {
  error: string | null;
}

/** - `mapeo del parentesco UI (labels del mockup) al enum relationship_type de la DB` */
const RELATIONSHIP_MAP: Record<"Mamá" | "Papá" | "Tutor/a", "mother" | "father" | "guardian"> = {
  "Mamá": "mother",
  "Papá": "father",
  "Tutor/a": "guardian",
};

/** - `formato de email admitido` */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** - `días de vigencia de la invitación` */
const EXPIRATION_DAYS = 7;

/** - `cliente de Resend (envío del lado de Next.js, nunca en el browser)` */
const resend = new Resend(process.env.RESEND_API_KEY);

/** - `remitente del email (onboarding@resend.dev de prueba; dominio verificado en producción)` */
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

/**
 * --------------------------------------------
 * -----  `sendInvitation(prev, formData)`  -----
 * --------------------------------------------
 * - Server Action que valida el formulario, inserta la invitación en
 *   `public.invitations` (RLS: policy para authenticated) y envía el email con
 *   Resend. Al éxito redirige al perfil del niño; en fallo devuelve
 *   `SendInvitationState` para que el formulario lo muestre inline.
 */
export const sendInvitation = async (_prevState: SendInvitationState, formData: FormData): Promise<SendInvitationState> => {
  const childId = String(formData.get("childId") ?? "");
  const code = String(formData.get("code") ?? "").toUpperCase();
  const fullName = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const relation = String(formData.get("relation") ?? "Mamá") as keyof typeof RELATIONSHIP_MAP;

  //  -----  validación server-side (los requeridos ya se validan en el cliente)  -----
  if (!childId || !fullName || !email || !EMAIL_PATTERN.test(email) || !CODE_PATTERN.test(code)) {
    return { error: "No se pudo enviar la invitación. Revisá los campos." };
  }
  const relationship = RELATIONSHIP_MAP[relation] ?? "guardian";

  const user = await getAuthenticatedUser("/vincular-padre");
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  //  -----  el niño debe existir (FK) y aporta nombre para el email y slug destino  -----
  const { data: child } = await supabase
    .from("children")
    .select("id, full_name, rooms(name, daycares(name))")
    .eq("id", childId)
    .single();

  if (!child) {
    return { error: "El niño ya no existe. Recargá la página." };
  }

  const rooms = child.rooms as { daycares?: { name?: string } | Array<{ name?: string }> | null } | null;
  const daycareName: string =
    Array.isArray(rooms?.daycares) ? rooms.daycares[0]?.name ?? "OpenDayCare" : rooms?.daycares?.name ?? "OpenDayCare";

  //  -----  insert con reintentos si el código chocó con otro (columna UNIQUE)  -----
  const expiresAt = new Date(Date.now() + EXPIRATION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  let finalCode: string = code;
  let insertFailed = false;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { error } = await supabase.from("invitations").insert({
      child_id: child.id,
      invited_by: user.id,
      full_name: fullName,
      email,
      relationship,
      code: finalCode,
      status: "pending",
      expires_at: expiresAt,
    });
    if (!error) {
      insertFailed = false;
      break;
    }
    if (error.code === "23505") {
      //  -----  código duplicado: regenerar y reintentar  -----
      finalCode = generateInvitationCode();
      continue;
    }
    insertFailed = true;
    break;
  }

  if (insertFailed) {
    return { error: "No se pudo crear la invitación. Intentá de nuevo." };
  }

  //  -----  envío del email con Resend; si falla se revierte la invitación  -----
  const { error: sendError } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Invitación a OpenDayCare — código ${finalCode}`,
    react: InvitationEmail({
      code: finalCode,
      childName: child.full_name,
      daycareName,
      expiresLabel: `Vence en ${EXPIRATION_DAYS} días`,
    }),
  });

  if (sendError) {
    await supabase.from("invitations").delete().eq("child_id", child.id).eq("code", finalCode);
    return { error: "No se pudo enviar el email. Intentá de nuevo." };
  }

  redirect(`/kids/${slugify(child.full_name)}`);
};
