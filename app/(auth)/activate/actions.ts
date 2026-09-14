/*
    *  -----------------------------------------------------------------  *
    *  -----  actions.ts  --  /app/(auth)/activate/actions.ts  -----  *
    *  -----------------------------------------------------------------  *
*/
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CODE_PATTERN } from "@/lib/invitation-code";
import { createClient } from "@/utils/supabase/server";

/** - `estado que devuelve la Server Action de activación al formulario` */
export interface ActivateAccountState {
  codeError: string | null;
  emailError: string | null;
  passwordError: string | null;
}

/** - `preview de una invitación válida, para la tarjeta de la pantalla` */
export interface InvitationPreview {
  childName: string;
  roomName: string;
  invitationEmail: string;
}

/** - `formato de email admitido` */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** - `resultado de buscar una invitación por código` */
export type LookupInvitationResult = { ok: true; data: InvitationPreview } | { ok: false; error: string };

/** - `mensaje unificado del spec para cualquier invitación inválida` */
const INVALID_CODE_ERROR = "Código de invitación inválido o expirado";

/**
 * ---------------------------------------------
 * -----  `lookupInvitation(code)`  -----
 * ---------------------------------------------
 * - Server Action que devuelve los datos de la tarjeta (niño, sala y email de
 *   la invitación) para un código pendiente y no expirado, vía la función
 *   SECURITY DEFINER `get_invitation_preview` (el visitante aún no tiene sesión).
 */
export const lookupInvitation = async (code: string): Promise<LookupInvitationResult> => {
  const normalized = code.trim().toUpperCase();

  //  -----  formato inválido: todavía no es un código completo  -----
  if (!CODE_PATTERN.test(normalized)) {
    return { ok: false, error: INVALID_CODE_ERROR };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data } = await supabase.rpc("get_invitation_preview", { p_code: normalized });
  const row: { child_name: string; room_name: string; invitation_email: string } | undefined = data?.[0];

  //  -----  código inexistente, expirado o ya usado  -----
  if (!row) {
    return { ok: false, error: INVALID_CODE_ERROR };
  }

  return {
    ok: true,
    data: {
      childName: row.child_name,
      roomName: row.room_name,
      invitationEmail: row.invitation_email,
    },
  };
};

/**
 * ------------------------------------------
 * -----  `activateAccount(prev, formData)`  -----
 * ------------------------------------------
 * - Server Action que activa la cuenta del padre invitado: valida el código
 *   (existe, `pending`, no expirado) y la coincidencia de email, crea la cuenta
 *   con `signUp` (el trigger `handle_new_user` crea el perfil en `public.users`
 *   con rol `parent`), inserta el vínculo en `parent_children` y marca la
 *   invitación `accepted`. Al éxito redirige a `/`.
 */
export const activateAccount = async (_prevState: ActivateAccountState, formData: FormData): Promise<ActivateAccountState> => {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const state: ActivateAccountState = { codeError: null, emailError: null, passwordError: null };

  //  -----  validación server-side de requeridos  -----
  if (!code || !CODE_PATTERN.test(code)) {
    return { ...state, codeError: INVALID_CODE_ERROR };
  }
  if (!email || !EMAIL_PATTERN.test(email)) {
    return { ...state, emailError: "Campo requerido" };
  }
  if (!password) {
    return { ...state, passwordError: "Campo requerido" };
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  //  -----  la invitación debe existir, estar pendiente y no expirada  -----
  const { data: invitation } = await supabase
    .from("invitations")
    .select("id, child_id, full_name, email, relationship, status, expires_at, accepted_at")
    .eq("code", code)
    .single();

  const isPending =
    invitation &&
    invitation.status === "pending" &&
    invitation.accepted_at === null &&
    new Date(invitation.expires_at).getTime() > Date.now();

  //  -----  código inválido, expirado, usado o email no coincidente: error unificado  -----
  if (!isPending || invitation.email !== email) {
    return { ...state, codeError: INVALID_CODE_ERROR };
  }

  //  -----  daycare_id para el trigger handle_new_user (metadata del signup)  -----
  const { data: preview } = await supabase.rpc("get_invitation_preview", { p_code: code });
  const daycareId: string | undefined = preview?.[0]?.daycare_id;

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        daycare_id: daycareId,
        role: "parent",
        full_name: invitation.full_name,
      },
    },
  });

  if (signUpError) {
    //  -----  email ya registrado: mensaje propio; el resto, genérico  -----
    if (signUpError.code === "user_already_exists" || /already registered/i.test(signUpError.message)) {
      return { ...state, emailError: "Ese email ya tiene cuenta. Iniciá sesión." };
    }
    return { ...state, passwordError: "No se pudo crear la cuenta. Probá otra contraseña." };
  }

  const parentId: string | undefined = signUpData.user?.id;
  if (!parentId) {
    return { ...state, codeError: "No se pudo crear la cuenta. Intentá de nuevo." };
  }

  //  -----  vínculo padre ↔ niño (RLS: policy INSERT para authenticated)  -----
  const { error: linkError } = await supabase.from("parent_children").insert({
    parent_id: parentId,
    child_id: invitation.child_id,
    relationship: invitation.relationship,
  });

  if (linkError) {
    return { ...state, codeError: "No se pudo vincular la cuenta. Intentá de nuevo." };
  }

  //  -----  la invitación queda consumida  -----
  await supabase
    .from("invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  redirect("/");
};
