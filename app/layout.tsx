/*
    *  ---------------------------------------------  *
    *  -----  layout.tsx  --  /app/layout.tsx  -----  *
    *  ---------------------------------------------  *
*/
import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";

/** - `fuente display del mockup, para títulos` */
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

/** - `fuente base del mockup, para el resto de la UI` */
const nunito = Nunito({
  variable: "--font-nunito",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

/** - `metadata del sitio` */
export const metadata: Metadata = {
  title: "OpenDayCare",
  description: "Guardería OpenDayCare · Sala Soles",
};

/**
 * ----------------------------------
 * -----  `RootLayout(children)`  -----
 * ----------------------------------
 * - Layout raíz de la app: fuentes, metadata y estructura base.
 */
const RootLayout = ({ children }: LayoutProps<"/">) => {
  return (
    <html
      lang="es"
      className={`${fredoka.variable} ${nunito.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
