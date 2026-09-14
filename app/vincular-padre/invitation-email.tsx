/*
    *  ---------------------------------------------------------------------  *
    *  -----  invitation-email.tsx  --  /app/vincular-padre/invitation-email.tsx  -----  *
    *  ---------------------------------------------------------------------  *
*/
import type { ReactElement } from "react";

/** - `props del template del email de invitación` */
export interface InvitationEmailProps {
    code: string;
    childName: string;
    daycareName: string;
    expiresLabel: string;
}

/**
 * -------------------------------------------------
 * -----  `InvitationEmail(props)`  -----
 * -------------------------------------------------
 * - Template inline del email de invitación: código grande, nombre del niño,
 *   guardería y vencimiento.
 */
export const InvitationEmail = ({ code, childName, daycareName, expiresLabel }: InvitationEmailProps): ReactElement => (
    <div style={{ backgroundColor: "#F6ECDF", padding: "40px 24px", fontFamily: "Arial, sans-serif" }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", backgroundColor: "#FBF4EC", border: "1px solid #ECE0D0", borderRadius: "24px", overflow: "hidden" }}>
            <div style={{ padding: "24px 26px", borderBottom: "1px solid #ECE0D0" }}>
                <div style={{ fontSize: "18px", fontWeight: 600, color: "#3F362E" }}>OpenDayCare</div>
                <div style={{ fontSize: "13px", color: "#A89A8B", marginTop: "4px" }}>{daycareName}</div>
            </div>
            <div style={{ padding: "26px" }}>
                <p style={{ fontSize: "15px", color: "#6E6359", lineHeight: "22px", margin: "0 0 8px" }}>Te invitaron a seguir el día de</p>
                <p style={{ fontSize: "22px", fontWeight: 600, color: "#3F362E", margin: "0 0 22px" }}>{childName}</p>
                <div style={{ backgroundColor: "#FBF1D6", border: "1px dashed #E6D08A", borderRadius: "16px", padding: "18px", textAlign: "center", marginBottom: "22px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.7px", color: "#A88526", marginBottom: "8px" }}>CÓDIGO DE INVITACIÓN</div>
                    <div style={{ fontSize: "34px", fontWeight: 600, letterSpacing: "7px", color: "#8A7234" }}>{code}</div>
                    <p style={{ fontSize: "13px", color: "#A88526", margin: "6px 0 0" }}>{expiresLabel}</p>
                </div>
                <p style={{ fontSize: "14px", color: "#6E6359", lineHeight: "21px", margin: "0" }}>
                    Entra en la app, pulsa <strong>“Activá tu cuenta”</strong>, introduce este código y el email con el que recibiste
                    esta invitación para crear tu contraseña y ver el feed de {childName}.
                </p>
            </div>
        </div>
    </div>
);
