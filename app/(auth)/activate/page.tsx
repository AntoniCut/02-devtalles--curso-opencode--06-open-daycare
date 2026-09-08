/*
    *  --------------------------------------------------------  *
    *  -----  page.tsx  --  /app/(auth)/activate/page.tsx  -----  *
    *  --------------------------------------------------------  *
*/
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactElement } from "react";

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

/** - `icono check del checkbox de autorización` */
const checkIcon: ReactElement = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/**
 * ------------------------------
 * -----  `ActivatePage()`  -----
 * ------------------------------
 * - Pantalla de activación de cuenta invitada: tarjeta de invitación,
 * - código, email, contraseña y autorización de fotos, fiel al mockup.
 */
const ActivatePage = (): ReactElement => {
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

        {/*  -----  tarjeta de invitación  -----  */}
        <div className="mb-[22px] flex items-center gap-[14px] rounded-[16px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px]">
          <div className="flex size-[44px] flex-none items-center justify-center rounded-full bg-[#A9D9E8] font-display font-semibold text-[19px] text-[#1F7A93]">M</div>
          <div>
            <div className="text-[13px] text-[#94887B]">Te invitaron a seguir a</div>
            <div className="font-display font-semibold text-[17px] text-[#3F362E]">Mateo · Sala Soles</div>
          </div>
        </div>

        <label htmlFor="activate-code" className="mb-2 block text-[12px] font-bold tracking-[.7px] text-[#94887B]">
          CÓDIGO DE INVITACIÓN
        </label>
        <input
          id="activate-code"
          type="text"
          defaultValue="7K4P9"
          className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] font-display text-[18px] font-bold tracking-[3px] text-[#3F362E] placeholder:text-[#B6A99B] focus:outline-none"
        />

        <label htmlFor="activate-email" className="mb-2 block text-[12px] font-bold tracking-[.7px] text-[#94887B]">
          EMAIL
        </label>
        <input
          id="activate-email"
          type="email"
          defaultValue="lucia.fernandez@gmail.com"
          className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] text-[#3F362E] placeholder:text-[#B6A99B] focus:outline-none"
        />

        <label htmlFor="activate-password" className="mb-2 block text-[12px] font-bold tracking-[.7px] text-[#94887B]">
          CREAR CONTRASEÑA
        </label>
        <input
          id="activate-password"
          type="password"
          defaultValue="contraseña"
          className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#F2A78E] bg-white px-4 py-[14px] text-[15px] text-[#3F362E] placeholder:text-[#B6A99B] focus:outline-none"
        />

        {/*  -----  autorización de fotos (estática, marcada)  -----  */}
        <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-[14px] bg-[#FBF1D6] px-4 py-[14px]">
          <span className="mt-px flex size-6 flex-none items-center justify-center rounded-lg bg-[#5FB97E]">
            {checkIcon}
          </span>
          <span className="text-[14px] leading-[1.45] text-[#8A7234]">
            Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app.
          </span>
        </label>

        <Link
          href="/parent-feed"
          className="block w-full rounded-[15px] bg-linear-to-b/srgb from-[#F4977E] to-[#EE8164] py-[15px] text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)]"
        >
          Activar mi cuenta
        </Link>

        <p className="mt-[22px] text-center text-[14.5px] text-[#94887B]">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-extrabold text-[#C5503A]">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
};

export default ActivatePage;
