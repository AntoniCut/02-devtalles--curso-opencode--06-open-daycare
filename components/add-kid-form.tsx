/*
    *  ------------------------------------------------------------------  *
    *  -----  add-kid-form.tsx  --  /components/add-kid-form.tsx  -----  *
    *  ------------------------------------------------------------------  *
*/
"use client";

import { useState } from "react";
import type { ChangeEvent, ReactElement } from "react";
import Link from "next/link";
import { classrooms } from "@/lib/kids";

/** - `icono chevron del select de sala` */
const chevronIcon: ReactElement = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B0A290" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/** - `estilos de las etiquetas de los campos` */
const labelClasses: string = "block text-[12px] font-extrabold tracking-[.7px] text-[#94887B] mb-2";

/** - `estilos compartidos de inputs y textarea` */
const fieldClasses: string = "w-full py-[13px] px-4 rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white text-[15px] text-[#3F362E] outline-none placeholder:text-[#B6A99B]";

/**
 * --------------------------------
 * -----  `maskBirthDate(raw)`  -----
 * --------------------------------
 * - Aplica la máscara dd/mm/aaaa: solo dígitos, máximo 8, con "/" automática.
 */
const maskBirthDate = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);

  //  -----  sin dígitos suficientes todavía, sin separadores  -----
  if (digits.length <= 2) {
    return digits;
  }
  //  -----  día completo, sin mes completo  -----
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  //  -----  día y mes completos o más  -----
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

/**
 * --------------------------------
 * -----  `AddKidForm()`  -----
 * --------------------------------
 * - Formulario para agregar un niño: header Cancelar/Guardar y campos del mockup.
 */
const AddKidForm = (): ReactElement => {
  const [name, setName] = useState<string>("");
  const [birthDate, setBirthDate] = useState<string>("");
  const [classroom, setClassroom] = useState<string>("");
  const [allergies, setAllergies] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  /**
   * ------------------------------------------
   * -----  `handleBirthDateChange(event)`  -----
   * ------------------------------------------
   * - Actualiza la fecha aplicando la máscara dd/mm/aaaa.
   */
  const handleBirthDateChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setBirthDate(maskBirthDate(event.target.value));
  };

  //  -----  estilos del select: placeholder gris hasta elegir sala  -----
  const selectClasses = `appearance-none w-full py-[13px] pl-4 pr-[40px] rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white text-[15px] font-bold outline-none ${classroom === "" ? "text-[#B6A99B]" : "text-[#3F362E]"}`;

  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      className="w-full max-w-[520px] bg-[#FBF4EC] border border-[#ECE0D0] rounded-[24px] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)] overflow-hidden"
    >
      {/*  -----  header: cancelar, título y guardar  -----  */}
      <div className="flex items-center justify-between py-5 px-[26px] border-b border-[#ECE0D0]">
        <Link href="/kids" className="text-[15px] font-bold text-[#94887B]">Cancelar</Link>
        <span className="font-display font-semibold text-[18px] text-[#3F362E]">Agregar niño</span>
        <Link href="/kids" className="text-[15px] font-extrabold text-[#D9583C]">Guardar</Link>
      </div>

      {/*  -----  campos del formulario  -----  */}
      <div className="py-6 px-[26px]">
        {/*  -----  nombre completo  -----  */}
        <div className="mb-[18px]">
          <label htmlFor="name" className={labelClasses}>NOMBRE COMPLETO</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Martina López"
            className={fieldClasses}
          />
        </div>

        {/*  -----  fecha de nacimiento y sala en fila  -----  */}
        <div className="flex gap-[14px] mb-[18px]">
          <div className="flex-1">
            <label htmlFor="birth-date" className={labelClasses}>FECHA DE NACIMIENTO</label>
            <input
              id="birth-date"
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={birthDate}
              onChange={handleBirthDateChange}
              placeholder="dd/mm/aaaa"
              className={fieldClasses}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="classroom" className={labelClasses}>SALA</label>
            <div className="relative">
              <select
                id="classroom"
                value={classroom}
                onChange={(event) => setClassroom(event.target.value)}
                className={selectClasses}
              >
                <option value="" disabled hidden>Seleccionar sala…</option>
                {classrooms.map((room) => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">{chevronIcon}</span>
            </div>
          </div>
        </div>

        {/*  -----  alergias (etiquetas)  -----  */}
        <div className="mb-[18px]">
          <label htmlFor="allergies" className={labelClasses}>ALERGIAS (ETIQUETAS)</label>
          <input
            id="allergies"
            type="text"
            value={allergies}
            onChange={(event) => setAllergies(event.target.value)}
            placeholder="Ej. Maní, Lactosa"
            className={fieldClasses}
          />
        </div>

        {/*  -----  notas médicas  -----  */}
        <div>
          <label htmlFor="notes" className={labelClasses}>NOTAS MÉDICAS</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Indicaciones, medicación, contactos…"
            className={`${fieldClasses} min-h-[90px] resize-y leading-[1.5]`}
          />
        </div>
      </div>
    </form>
  );
};

export default AddKidForm;
