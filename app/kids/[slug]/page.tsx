/*
    *  -----------------------------------------------------  *
    *  -----  page.tsx  --  /app/kids/[slug]/page.tsx  -----  *
    *  -----------------------------------------------------  *
*/
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import Sidebar from "@/components/sidebar";
import { kids } from "@/lib/kids";
import type { Kid, LinkedParent } from "@/lib/kids";
import { getAuthenticatedProfile } from "@/lib/auth";

/** - `texto del subtítulo del padre según su estado de vinculación` */
const parentStatusText: Record<LinkedParent["status"], string> = {
  active: "activa",
  pending: "invitación enviada",
};

/** - `configuración visual del badge de estado del padre` */
const parentStatusBadge: Record<LinkedParent["status"], { label: string; color: string; background: string }> = {
  active: { label: "ACTIVA", color: "#3E9B6C", background: "#CFEBD8" },
  pending: { label: "PENDIENTE", color: "#9A7B1E", background: "#F7E7A6" },
};

/** - `búsqueda de un niño por su slug` */
const findKid = (slug: string): Kid | undefined => kids.find((kid) => kid.slug === slug);

/** - `props de generateMetadata` */
interface KidMetadataProps {
  params: Promise<{ slug: string }>;
}

/**
 * -----------------------------------------
 * -----  `generateMetadata(props)`  -----
 * -----------------------------------------
 * - Metadata del perfil con el nombre del niño.
 */
export const generateMetadata = async ({ params }: KidMetadataProps): Promise<Metadata> => {
  const { slug } = await params;
  const kid: Kid | undefined = findKid(slug);

  return {
    title: kid ? `${kid.name} · OpenDayCare` : "Niño · OpenDayCare",
  };
};

/** - `icono chevron del enlace volver` */
const backIcon: ReactElement = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

/** - `icono triángulo de alerta de alergias` */
const warningIcon: ReactElement = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

/** - `icono sol del botón resumen del día` */
const sunIcon: ReactElement = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

/** - `icono más de vincular otro padre` */
const plusIcon: ReactElement = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/** - `props de una fila de datos del niño` */
interface InfoRowProps {
  label: string;
  value: string;
  hasBorder: boolean;
}

/**
 * --------------------------------------
 * -----  `InfoRow(label, value)`  -----
 * --------------------------------------
 * - Fila etiqueta/valor de la tabla de datos del perfil.
 */
const InfoRow = ({ label, value, hasBorder }: InfoRowProps): ReactElement => (
  <div className={`flex justify-between py-3.75 px-4.5 ${hasBorder ? "border-b border-[#F0E6D8]" : ""}`}>
    <span className="text-[#94887B] text-[14.5px]">{label}</span>
    <span className="font-extrabold text-[#3F362E] text-[14.5px]">{value}</span>
  </div>
);

/**
 * ---------------------------------------
 * -----  `KidProfilePage(props)`  -----
 * ---------------------------------------
 * - Perfil de un niño: datos, alergias y padres vinculados.
 */
const KidProfilePage = async (props: PageProps<"/kids/[slug]">): Promise<ReactElement> => {
  const { slug } = await props.params;
  const profile = await getAuthenticatedProfile(`/kids/${slug}`);
  const kid: Kid | undefined = findKid(slug);

  //  -----  slug inexistente → 404  -----
  if (!kid) {
    notFound();
  }

  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar user={profile} />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        <div className="max-w-[820px] w-full mx-auto px-10 pt-8.5 pb-20">
          {/*  -----  volver a niños  -----  */}
          <Link href="/kids" className="flex items-center gap-1.75 text-[#94887B] font-bold text-sm mb-5">
            {backIcon}
            Volver a Niños
          </Link>

          <div className="flex gap-6.5 items-start flex-wrap">
            {/*  -----  columna izquierda: perfil, alergias y datos  -----  */}
            <div className="flex-1 min-w-[300px] flex flex-col gap-4.5">
              {/*  -----  encabezado del perfil  -----  */}
              <div className="flex items-center gap-4.5">
                <div
                  className="w-[84px] h-[84px] rounded-full flex items-center justify-center flex-none font-display font-semibold text-[34px]"
                  style={{ background: kid.background, color: kid.color }}
                >
                  {kid.initial}
                </div>
                <div className="flex-1">
                  <h1 className="font-display font-semibold text-[28px] text-[#3F362E]">{kid.name}</h1>
                  <p className="mt-0.75 text-[#94887B] text-[15px]">{kid.age} · Sala {kid.classroom}</p>
                </div>
                <Link
                  href="/agregar-nino"
                  className="border-[1.5px] border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359] font-bold text-sm py-2.25 px-4 rounded-xl"
                >
                  Editar
                </Link>
              </div>

              {/*  -----  alergias y notas (solo si tiene)  -----  */}
              {kid.allergyNote ? (
                <div className="flex gap-3.5 bg-[#FBDAD6] rounded-2xl py-4 px-4.5">
                  <div className="w-10 h-10 rounded-[11px] bg-[#F4A8A0] flex items-center justify-center flex-none">
                    {warningIcon}
                  </div>
                  <div>
                    <div className="font-extrabold text-[#C5413A] text-[15px] mb-0.5">Alergias y notas</div>
                    <div className="text-[#B25249] text-[14.5px] leading-[1.5]">{kid.allergyNote}</div>
                  </div>
                </div>
              ) : null}

              {/*  -----  datos del niño  -----  */}
              <div className="bg-[#FFFDF9] border border-[#ECE0D0] rounded-2xl overflow-hidden">
                <InfoRow label="Fecha de nacimiento" value={kid.birthDate} hasBorder={true} />
                <InfoRow label="Sala" value={kid.classroom} hasBorder={true} />
                <InfoRow label="Ingreso" value={kid.entry} hasBorder={false} />
              </div>
            </div>

            {/*  -----  columna derecha: resumen y padres  -----  */}
            <div className="w-[300px] flex-none flex flex-col gap-3.5">
              <Link
                href="/resumen-dia"
                className="flex items-center justify-center gap-2.25 w-full py-3.25 rounded-[14px] bg-[#3F362E] text-white font-extrabold text-[15px]"
              >
                {sunIcon}
                Resumen del día
              </Link>

              {/*  -----  padres vinculados  -----  */}
              <div className="bg-[#FFFDF9] border border-[#ECE0D0] rounded-2xl py-4 px-4.5">
                <div className="text-[12.5px] font-extrabold tracking-[.8px] text-[#8A7C6D] mb-3.5">PADRES VINCULADOS</div>
                <div className="flex flex-col gap-3.5">
                  {kid.parents.map((parent) => (
                    <div key={parent.name} className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-none font-display font-semibold text-base"
                        style={{ background: parent.background, color: parent.color }}
                      >
                        {parent.initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-[14.5px] text-[#3F362E]">{parent.name}</div>
                        <div className="text-[12.5px] text-[#A89A8B]">{parent.relation} · {parentStatusText[parent.status]}</div>
                      </div>
                      <span
                        className="flex-none text-[10.5px] font-extrabold py-1 px-2.25 rounded-full"
                        style={{ background: parentStatusBadge[parent.status].background, color: parentStatusBadge[parent.status].color }}
                      >
                        {parentStatusBadge[parent.status].label}
                      </span>
                    </div>
                  ))}

                  {/*  -----  vincular otro padre  -----  */}
                  <Link href="/vincular-padre" className="flex items-center gap-3 pt-2">
                    <span className="w-10 h-10 rounded-full border-[1.5px] border-dashed border-[#D8CBBA] flex items-center justify-center text-[#B0A290] flex-none">
                      {plusIcon}
                    </span>
                    <span className="font-extrabold text-[14.5px] text-[#C5503A]">Vincular otro padre</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default KidProfilePage;
