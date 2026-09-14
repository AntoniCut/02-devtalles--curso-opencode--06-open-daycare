/*
    *  --------------------------------------------------------  *
    *  -----  page.tsx  --  /app/(auth)/activate/page.tsx  -----  *
    *  --------------------------------------------------------  *
*/
import type { Metadata } from "next";
import type { ReactElement } from "react";
import ActivateForm from "@/app/(auth)/activate/activate-form";
import { lookupInvitation } from "@/app/(auth)/activate/actions";
import type { InvitationPreview } from "@/app/(auth)/activate/actions";
import { CODE_PATTERN } from "@/lib/invitation-code";

/** - `metadata de la página de activación de cuenta` */
export const metadata: Metadata = {
  title: "Activar cuenta · OpenDayCare",
};

/** - `icono sol del logo` */
const sunIcon: ReactElement = (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

/** - `props de la página (searchParams asíncrono en Next 16)` */
interface ActivatePageProps {
  searchParams: Promise<{ code?: string | string[] }>;
}

/**
 * ------------------------------
 * -----  `ActivatePage()`  -----
 * ------------------------------
 * - Pantalla de activación de cuenta invitada: logo, titular y formulario con la
 *   tarjeta de invitación real. Con ?code=<código> prellena código y email.
 */
const ActivatePage = async (props: ActivatePageProps): Promise<ReactElement> => {
  const { code: codeParam } = await props.searchParams;
  const rawCode: string | undefined = Array.isArray(codeParam) ? codeParam[0] : codeParam;

  let initialCode = "";
  let initialEmail = "";
  let initialPreview: InvitationPreview | null = null;

  //  -----  ?code= válido: cargar la invitación para la tarjeta y el email  -----
  if (rawCode) {
    const normalized = rawCode.trim().toUpperCase();
    if (CODE_PATTERN.test(normalized)) {
      const result = await lookupInvitation(normalized);
      if (result.ok) {
        initialCode = normalized;
        initialPreview = result.data;
        initialEmail = result.data.invitationEmail;
      }
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FBF4EC] p-10">
      <div className="w-full max-w-[440px]">
        {/*  -----  logo  -----  */}
        <div className="mb-[22px] flex size-[58px] items-center justify-center rounded-[18px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)] shadow-[0_12px_26px_-10px_rgba(238,129,100,.65)]">
          {sunIcon}
        </div>

        {/*  -----  titular y descripción  -----  */}
        <h1 className="mb-2 font-display font-semibold text-[32px] leading-[1.15] text-[#3F362E]">Bienvenida a OpenDayCare</h1>
        <p className="mb-[26px] text-[15.5px] leading-[1.55] text-[#94887B]">
          Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar la cuenta.
        </p>

        <ActivateForm initialCode={initialCode} initialEmail={initialEmail} initialPreview={initialPreview} />
      </div>
    </main>
  );
};

export default ActivatePage;
