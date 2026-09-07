/*
    *  --------------------------------------------------------  *
    *  -----  kid-card.tsx  --  /components/kid-card.tsx  -----  *
    *  --------------------------------------------------------  *
*/
import Link from "next/link";
import type { ReactElement } from "react";
import type { Kid, KidTag } from "@/lib/kids";

/** - `configuración visual del badge según su variante` */
interface TagBadge {
  color: string;
  background: string;
}

/** - `colores del badge por variante, con los valores exactos del mockup` */
const tagVariants: Record<KidTag["variant"], TagBadge> = {
  alert: { color: "#D9684A", background: "#FBD8CC" },
  invite: { color: "#C56486", background: "#F9D2DE" },
};

/** - `icono chevron de las tarjetas sin badge` */
const chevronIcon: ReactElement = (
  <svg className="flex-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CBB89F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

/**
 * ------------------------------------------
 * -----  `parentsLabel(parentsCount)`  -----
 * ------------------------------------------
 * - Devuelve el texto de padres vinculados según la cantidad.
 */
const parentsLabel = (parentsCount: number): string => {
  if (parentsCount === 0) {
    return "sin padres vinculados";
  }
  if (parentsCount === 1) {
    return "1 padre vinculado";
  }
  return `${parentsCount} padres vinculados`;
};

/** - `props de la tarjeta de niño` */
interface KidCardProps {
  kid: Kid;
}

/**
 * ----------------------------
 * -----  `KidCard(kid)`  -----
 * ----------------------------
 * - Tarjeta clicable de un niño que navega a su perfil.
 */
const KidCard = ({ kid }: KidCardProps): ReactElement => {
  const tag: KidTag | undefined = kid.tag;

  return (
    <Link
      href={`/kids/${kid.slug}`}
      className="flex items-center gap-3.5 min-w-0 bg-[#FFFDF9] border border-[#ECE0D0] rounded-[18px] p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,.5)] transition duration-150 hover:border-[#F2A78E] hover:-translate-y-0.5"
    >
      {/*  -----  avatar con la inicial  -----  */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center flex-none font-display font-semibold text-[19px]"
        style={{ background: kid.background, color: kid.color }}
      >
        {kid.initial}
      </div>

      {/*  -----  nombre, edad y padres vinculados  -----  */}
      <div className="flex-1 min-w-0">
        <div className="font-display font-semibold text-base text-[#3F362E]">{kid.name}</div>
        <div className="text-[13px] text-[#A89A8B]">{kid.age} · {parentsLabel(kid.parents.length)}</div>
      </div>

      {/*  -----  badge de alergia/vinculación o chevron  -----  */}
      {tag ? (
        <span
          className="flex-none text-[11px] font-extrabold py-[5px] px-[9px] rounded-full"
          style={{ background: tagVariants[tag.variant].background, color: tagVariants[tag.variant].color }}
        >
          {tag.label}
        </span>
      ) : (
        chevronIcon
      )}
    </Link>
  );
};

export default KidCard;
