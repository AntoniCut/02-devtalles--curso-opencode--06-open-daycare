/*
    *  ------------------------------------------------------------------------  *
    *  -----  link-parent-form.tsx  --  /components/link-parent-form.tsx  -----  *
    *  ------------------------------------------------------------------------  *
*/
"use client";

import { useState } from "react";
import type { ChangeEvent, ReactElement } from "react";
import Link from "next/link";

/** - `parentesco del padre/madre vinculado` */
type Relation = "Mamá" | "Papá" | "Tutor/a";

/** - `parentescos seleccionables del formulario` */
const relations: Relation[] = ["Mamá", "Papá", "Tutor/a"];

/** - `icono info del banner azul` */
const infoIcon: ReactElement = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4E72C8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

/** - `icono X de cierre del header` */
const closeIcon: ReactElement = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

/** - `icono send del CTA` */
const sendIcon: ReactElement = (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4z" />
    <path d="M22 2 11 13" />
  </svg>
);

/** - `estilos de las etiquetas de los campos (sin margen)` */
const labelClasses: string = "block text-[12px] font-extrabold tracking-[.7px] text-[#94887B]";

/** - `estilos de los inputs del formulario` */
const fieldStyles: string = "w-full py-[13px] px-4 rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white text-[15px] text-[#3F362E] outline-none placeholder:text-[#B6A99B]";

/**
 * ------------------------------------
 * -----  `pillStyles(selected)`  -----
 * ------------------------------------
 * - Estilos de una pill de parentesco según esté seleccionada o no.
 */
const pillStyles = (selected: boolean): string => `flex-1 py-[11px] rounded-full border-[1.5px] font-extrabold text-[14px] cursor-pointer ${selected ? "border-[#9FB8EC] bg-[#CCD8F4] text-[#4E72C8]" : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"}`;

/**
 * ------------------------------------
 * -----  `LinkParentForm()`  -----
 * ------------------------------------
 * - Formulario para vincular un padre al niño: header con cierre, banner informativo,
 *   campos nombre/email, pills de parentesco y tarjeta del código de invitación.
 */
const LinkParentForm = (): ReactElement => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [relation, setRelation] = useState<Relation>("Mamá");

  /**
   * -------------------------------------
   * -----  `handleRelation(item)`  -----
   * -------------------------------------
   * - Marca el parentesco elegido en las pills.
   */
  const handleRelation = (item: Relation): void => {
    setRelation(item);
  };

  //  -----  nombre del padre/madre  -----
  const handleNameChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setName(event.target.value);
  };

  //  -----  email del padre/madre  -----
  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setEmail(event.target.value);
  };

  return (
    <form className="w-full max-w-[480px] bg-[#FBF4EC] border border-[#ECE0D0] rounded-[24px] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)] overflow-hidden">
      {/*  -----  header: título, subtítulo y cierre  -----  */}
      <div className="flex items-center justify-between py-5 px-[26px] border-b border-[#ECE0D0]">
        <div>
          <div className="font-display font-semibold text-[18px] text-[#3F362E]">Vincular padre</div>
          <div className="text-[13px] text-[#A89A8B]">a Mateo Fernández</div>
        </div>
        <Link href="/kids/mateo-fernandez" aria-label="Cerrar" className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[#F0E6D8] text-[#94887B]">
          {closeIcon}
        </Link>
      </div>

      {/*  -----  cuerpo de la tarjeta  -----  */}
      <div className="py-[22px] px-[26px]">
        {/*  -----  banner informativo azul  -----  */}
        <div className="flex gap-[11px] rounded-[14px] bg-[#E3ECFB] px-4 py-[13px] mb-5">
          <span className="pointer-events-none mt-px flex-none">{infoIcon}</span>
          <p className="text-[13.5px] text-[#3F5694] leading-[1.45]">Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de Mateo.</p>
        </div>

        {/*  -----  nombre del padre/madre  -----  */}
        <div className="mb-[18px]">
          <label htmlFor="name" className={`${labelClasses} mb-2`}>NOMBRE DEL PADRE/MADRE</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Ej. Diego Fernández"
            className={fieldStyles}
          />
        </div>

        {/*  -----  email  -----  */}
        <div className="mb-[18px]">
          <label htmlFor="email" className={`${labelClasses} mb-2`}>EMAIL</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="correo@ejemplo.com"
            className={fieldStyles}
          />
        </div>

        {/*  -----  parentesco (pills seleccionables)  -----  */}
        <div className="mb-5">
          <div className={`${labelClasses} mb-[10px]`}>PARENTESCO</div>
          <div className="flex gap-[9px]">
            {relations.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleRelation(item)}
                aria-pressed={relation === item}
                className={pillStyles(relation === item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/*  -----  tarjeta del código de invitación  -----  */}
        <div className="rounded-[16px] border-[1.5px] border-dashed border-[#E6D08A] bg-[#FBF1D6] px-[18px] py-[18px] text-center mb-5">
          <div className="block text-[12px] font-extrabold tracking-[.7px] text-[#A88526] mb-2">CÓDIGO DE INVITACIÓN</div>
          <div className="font-display font-semibold text-[34px] tracking-[7px] text-[#8A7234]">7K4P9</div>
          <p className="text-[13px] text-[#A88526] mt-[6px]">Vence en 7 días</p>
        </div>

        {/*  -----  CTA enviar invitación  -----  */}
        <button type="button" className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] py-[14px] text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] cursor-pointer">
          {sendIcon}
          Enviar invitación
        </button>
      </div>
    </form>
  );
};

export default LinkParentForm;
