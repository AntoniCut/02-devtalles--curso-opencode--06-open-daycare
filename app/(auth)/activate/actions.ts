/*
    *  -----------------------------------------------------------------  *
    *  -----  actions.ts  --  /app/(auth)/activate/actions.ts  -----  *
    *  -----------------------------------------------------------------  *
*/
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveUserRole } from "@/lib/auth";
import { homeForRole } from "@/lib/roles";
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
 *   (existe, `pending`, no expirado) y la coincidencia de email con la vista
 *   pública `get_invitation_preview`, crea la cuenta con `signUp` (el trigger
 *   `handle_new_user` deriva daycare y rol de la invitación) y consume la
 *   invitación con el RPC `accept_invitation`, que crea el vínculo en
 *   `parent_children` y marca la invitación `accepted` de forma atómica.
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

  //  -----  la invitación debe existir, estar pendiente y no expirada (vista pública)  -----
  const { data: preview } = await supabase.rpc("get_invitation_preview", { p_code: code });
  const invitation: { invitation_email: string; invitation_full_name: string } | undefined = preview?.[0];

  //  -----  código inválido, expirado, usado o email no coincidente: error unificado  -----
  if (!invitation || invitation.invitation_email.toLowerCase() !== email) {
    return { ...state, codeError: INVALID_CODE_ERROR };
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      //  -----  solo display: el rol y el daycare los deriva el trigger de la invitación  -----
      data: {
        full_name: invitation.invitation_full_name,
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

  if (!signUpData.user) {
    return { ...state, codeError: "No se pudo crear la cuenta. Intentá de nuevo." };
  }

  //  -----  valida el código contra la sesión nueva, vincula al padre y consume la invitación  -----
  const { error: acceptError } = await supabase.rpc("accept_invitation", { p_code: code });

  if (acceptError) {
    return { ...state, codeError: "No se pudo vincular la cuenta. Intentá de nuevo." };
  }

  //  -----  el home lo define el rol real del usuario recién creado  -----
  const role = await resolveUserRole(supabase, signUpData.user);

  redirect(homeForRole(role));
};
