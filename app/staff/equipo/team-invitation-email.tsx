/*
    *  ----------------------------------------------------------------------------------------  *
    *  -----  team-invitation-email.tsx  --  /app/staff/equipo/team-invitation-email.tsx  -----  *
    *  ----------------------------------------------------------------------------------------  *
*/
import type { ReactElement } from "react";

/** - `props del template del email de invitación de equipo` */
export interface TeamInvitationEmailProps {
    code: string;
    roleLabel: string;
    roomName: string | null;
    daycareName: string;
    expiresLabel: string;
    activateUrl: string;
}

/**
 * ------------------------------------------
 * -----  `TeamInvitationEmail(props)`  -----
 * ------------------------------------------
 * - Template inline del email de invitación de equipo: guardería, rol, sala
 *   (si aplica), código grande, vencimiento y link a /activate con el código.
 */
export const TeamInvitationEmail = ({ code, roleLabel, roomName, daycareName, expiresLabel, activateUrl }: TeamInvitationEmailProps): ReactElement => (
    <div style={{ backgroundColor: "#F6ECDF", padding: "40px 24px", fontFamily: "Arial, sans-serif" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", backgroundColor: "#FBF4EC", border: "1px solid #ECE0D0", borderRadius: "24px", overflow: "hidden" }}>
            <div style={{ padding: "24px 26px", borderBottom: "1px solid #ECE0D0" }}>
                <div style={{ fontSize: "18px", fontWeight: 600, color: "#3F362E" }}>OpenDayCare</div>
                <div style={{ fontSize: "13px", color: "#A89A8B", marginTop: "4px" }}>{daycareName}</div>
            </div>
            <div style={{ padding: "26px" }}>
                <p style={{ fontSize: "15px", color: "#6E6359", lineHeight: "22px", margin: "0 0 8px" }}>Te invitaron a unirte al equipo de la guardería</p>
                <p style={{ fontSize: "22px", fontWeight: 600, color: "#3F362E", margin: "0 0 22px" }}>
                    {roleLabel}
                    {roomName ? ` · Sala ${roomName}` : ""}
                </p>
                <div style={{ backgroundColor: "#FBF1D6", border: "1px dashed #E6D08A", borderRadius: "16px", padding: "18px", textAlign: "center", marginBottom: "22px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.7px", color: "#A88526", marginBottom: "8px" }}>CÓDIGO DE INVITACIÓN</div>
                    <div style={{ fontSize: "34px", fontWeight: 600, letterSpacing: "7px", color: "#8A7234" }}>{code}</div>
                    <p style={{ fontSize: "13px", color: "#A88526", margin: "6px 0 0" }}>{expiresLabel}</p>
                </div>
                <p style={{ fontSize: "14px", color: "#6E6359", lineHeight: "21px", margin: "0 0 18px" }}>
                    Entrá a la app, pulsá <strong>“Activá tu cuenta”</strong>, ingresá este código y el email con el que recibiste esta
                    invitación para crear tu contraseña y entrar al panel de la guardería.
                </p>
                <a
                    href={activateUrl}
                    style={{ display: "block", backgroundColor: "#EE8164", color: "#FFFFFF", fontSize: "15px", fontWeight: 700, textAlign: "center", padding: "14px", borderRadius: "14px", textDecoration: "none", marginBottom: "14px" }}
                >
                    Activar mi cuenta
                </a>
                <p style={{ fontSize: "12px", color: "#A89A8B", wordBreak: "break-all", margin: "0" }}>{activateUrl}</p>
            </div>
        </div>
    </div>
);
