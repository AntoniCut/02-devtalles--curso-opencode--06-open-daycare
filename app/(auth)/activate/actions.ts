/*
    *  ----------------------------------------------------------  *
    *  -----  actions.ts  --  /app/(auth)/activate/actions.ts  -----  *
    *  ----------------------------------------------------------  *
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

/** - `preview de una invitación válida (de padre o de equipo) para la tarjeta` */
export type InvitationPreview =
    | { kind: "parent"; childName: string; roomName: string; invitationEmail: string; invitationFullName: string }
    | { kind: "team"; daycareName: string; role: "staff" | "admin"; roomName: string | null; invitationEmail: string; invitationFullName: string };

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
 * - Server Action que devuelve los datos de la tarjeta para un código pendiente
 *   y no expirado: primero busca en las invitaciones de padres (niño, sala y
 *   email) y luego en las de equipo (guardería, rol, sala y email), vía las
 *   funciones SECURITY DEFINER (el visitante aún no tiene sesión).
 */
export const lookupInvitation = async (code: string): Promise<LookupInvitationResult> => {
    const normalized = code.trim().toUpperCase();

    //  -----  formato inválido: todavía no es un código completo  -----
    if (!CODE_PATTERN.test(normalized)) {
        return { ok: false, error: INVALID_CODE_ERROR };
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    //  -----  las invitaciones de padres tienen prioridad (resolución determinista)  -----
    const { data: parentData } = await supabase.rpc("get_invitation_preview", { p_code: normalized });
    const parentRow: { child_name: string; room_name: string; invitation_email: string; invitation_full_name: string } | undefined = parentData?.[0];

    if (parentRow) {
        return {
            ok: true,
            data: {
                kind: "parent",
                childName: parentRow.child_name,
                roomName: parentRow.room_name,
                invitationEmail: parentRow.invitation_email,
                invitationFullName: parentRow.invitation_full_name,
            },
        };
    }

    //  -----  luego las invitaciones de equipo  -----
    const { data: teamData } = await supabase.rpc("get_team_invitation_preview", { p_code: normalized });
    const teamRow: { daycare_name: string; role: "staff" | "admin"; room_name: string | null; invitation_email: string; invitation_full_name: string } | undefined = teamData?.[0];

    if (teamRow) {
        return {
            ok: true,
            data: {
                kind: "team",
                daycareName: teamRow.daycare_name,
                role: teamRow.role,
                roomName: teamRow.room_name,
                invitationEmail: teamRow.invitation_email,
                invitationFullName: teamRow.invitation_full_name,
            },
        };
    }

    //  -----  código inexistente, expirado o ya usado  -----
    return { ok: false, error: INVALID_CODE_ERROR };
};

/**
 * ------------------------------------------
 * -----  `activateAccount(prev, formData)`  -----
 * ------------------------------------------
 * - Server Action que activa la cuenta invitada: valida el código (existe,
 *   `pending`, no expirado) y la coincidencia de email con las vistas públicas,
 *   crea la cuenta con `signUp` (el trigger `handle_new_user` deriva daycare y
 *   rol de la invitación) y consume la invitación de forma atómica: con
 *   `accept_invitation` (vínculo de padre) o `accept_team_invitation`
 *   (promoción a staff/admin con su sala).
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

    //  -----  la invitación de padres tiene prioridad (vista pública)  -----
    const { data: parentData } = await supabase.rpc("get_invitation_preview", { p_code: code });
    const parentInvitation: { invitation_email: string; invitation_full_name: string } | undefined = parentData?.[0];

    //  -----  sin invitación de padre, se busca una de equipo  -----
    let teamInvitation: { invitation_email: string; invitation_full_name: string } | undefined;
    if (!parentInvitation) {
        const { data: teamData } = await supabase.rpc("get_team_invitation_preview", { p_code: code });
        teamInvitation = teamData?.[0];
    }

    /** - `invitación a consumir (de padre o de equipo)` */
    const invitation = parentInvitation
        ? { kind: "parent" as const, email: parentInvitation.invitation_email, fullName: parentInvitation.invitation_full_name }
        : teamInvitation
            ? { kind: "team" as const, email: teamInvitation.invitation_email, fullName: teamInvitation.invitation_full_name }
            : null;

    //  -----  código inválido, expirado, usado o email no coincidente: error unificado  -----
    if (!invitation || invitation.email.toLowerCase() !== email) {
        return { ...state, codeError: INVALID_CODE_ERROR };
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            //  -----  solo display: el rol y el daycare los deriva el trigger de la invitación  -----
            data: {
                full_name: invitation.fullName,
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

    //  -----  consume la invitación: vincula al padre o promueve el rol del equipo  -----
    const { error: acceptError } = await supabase.rpc(
        invitation.kind === "parent" ? "accept_invitation" : "accept_team_invitation",
        { p_code: code },
    );

    if (acceptError) {
        return {
            ...state,
            codeError: invitation.kind === "parent" ? "No se pudo vincular la cuenta. Intentá de nuevo." : "No se pudo activar la cuenta. Intentá de nuevo.",
        };
    }

    //  -----  el home lo define el rol real del usuario recién creado  -----
    const role = await resolveUserRole(supabase, signUpData.user);

    redirect(homeForRole(role));
};
