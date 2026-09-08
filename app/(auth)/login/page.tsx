/*
    *  ------------------------------------------------------  *
    *  -----  page.tsx  --  /app/(auth)/login/page.tsx  -----  *
    *  ------------------------------------------------------  *
*/
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactElement } from "react";

/** - `metadata de la página de login` */
export const metadata: Metadata = {
  title: "Iniciar sesión · OpenDayCare",
};

/** - `icono sol del logo` */
const sunIcon: ReactElement = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

/**
 * --------------------------
 * -----  `LoginPage()`  -----
 * --------------------------
 * - Pantalla de inicio de sesión sin sidebar: panel de marca con gradiente
 * - y formulario de email/contraseña, fiel al mockup (sin selector de rol).
 */
const LoginPage = (): ReactElement => {
  return (
    <div className="grid min-h-screen grid-cols-[1.05fr_1fr] bg-[#FBF4EC]">
      {/*  -----  panel de marca  -----  */}
      <aside className="relative flex flex-col justify-between overflow-hidden bg-[linear-gradient(155deg,#F6A98E_0%,#F2937A_45%,#EC7E62_100%)] px-[60px] py-[56px] text-white">
        {/*  -----  círculos decorativos  -----  */}
        <div className="absolute -top-[140px] -right-[120px] size-[420px] rounded-full bg-white/12" />
        <div className="absolute -bottom-[110px] -left-[80px] size-[300px] rounded-full bg-white/10" />

        {/*  -----  logo  -----  */}
        <div className="relative flex items-center gap-[13px]">
          <div className="flex size-[46px] items-center justify-center rounded-[14px] bg-white/22">
            {sunIcon}
          </div>
          <span className="font-display font-semibold text-[21px] tracking-[.5px]">OpenDayCare</span>
        </div>

        {/*  -----  titular y descripción  -----  */}
        <div className="relative">
          <h1 className="mb-[18px] font-display font-semibold text-[42px] leading-[1.12]">
            El día de cada niño,
            <br />
            compartido con su familia.
          </h1>
          <p className="max-w-[430px] text-[17px] leading-[1.6] text-white/92">
            Publicá momentos, gestioná las salas y mantené a las familias cerca, desde un solo lugar.
          </p>
        </div>

        {/*  -----  footer de sala  -----  */}
        <div className="relative text-[14px] text-white/90">🌿 Guardería Sala Soles</div>
      </aside>

      {/*  -----  formulario de acceso  -----  */}
      <main className="flex items-center justify-center p-10">
        <div className="w-full max-w-[392px]">
          <h2 className="mb-[6px] font-display font-semibold text-[30px] text-[#3F362E]">Iniciar sesión</h2>
          <p className="mb-[28px] text-[15px] text-[#94887B]">Ingresá para ver el día de hoy.</p>

          <label htmlFor="login-email" className="mb-[9px] block text-[12px] font-bold tracking-[.7px] text-[#94887B]">
            EMAIL
          </label>
          <input
            id="login-email"
            type="email"
            defaultValue="caro@opendaycare.com"
            className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] text-[#3F362E] placeholder:text-[#B6A99B] focus:outline-none"
          />

          <label htmlFor="login-password" className="mb-[8px] block text-[12px] font-bold tracking-[.7px] text-[#94887B]">
            CONTRASEÑA
          </label>
          <input
            id="login-password"
            type="password"
            placeholder="••••••••"
            className="mb-[10px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] text-[#3F362E] placeholder:text-[#B6A99B] focus:outline-none"
          />

          {/*  -----  recuperar contraseña (estático, sin ruta aún)  -----  */}
          <div className="mb-5 text-right">
            <span className="cursor-pointer text-[13.5px] font-bold text-[#C5503A]">¿Olvidaste tu contraseña?</span>
          </div>

          <Link
            href="/"
            className="block w-full rounded-[15px] bg-linear-to-b/srgb from-[#F4977E] to-[#EE8164] py-[15px] text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)]"
          >
            Iniciar sesión
          </Link>

          <p className="mt-6 text-center text-[14.5px] text-[#94887B]">
            ¿Te invitó la guardería?{" "}
            <Link href="/activate" className="font-extrabold text-[#C5503A]">
              Activá tu cuenta
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
