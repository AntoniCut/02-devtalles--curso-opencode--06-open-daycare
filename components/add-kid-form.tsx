/*
    *  ------------------------------------------------------------------  *
    *  -----  add-kid-form.tsx  --  /components/add-kid-form.tsx  -----  *
    *  ------------------------------------------------------------------  *
*/
"use client";

import { useState } from "react";
import type { ChangeEvent, ReactElement, SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { classrooms } from "@/lib/kids";

/** - `icono chevron del select de sala` */
const chevronIcon: ReactElement = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B0A290" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

/** - `estilos de las etiquetas de los campos` */
const labelClasses: string = "block text-[12px] font-extrabold tracking-[.7px] text-[#94887B] mb-2";

/** - `formato de fecha admitido: dd/mm/aaaa` */
const DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/;

/**
 * -------------------------------------
 * -----  `isCalendarDate(value)`  -----
 * -------------------------------------
 * - Verifica formato dd/mm/aaaa y que la fecha exista en el calendario, cualquier año.
 */
const isCalendarDate = (value: string): boolean => {
  //  -----  formato dd/mm/aaaa  -----
  if (!DATE_PATTERN.test(value)) {
    return false;
  }
  //  -----  la fecha debe existir en el calendario (Date normaliza los desbordes)  -----
  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

/** - `errores de validación del formulario, por campo` */
interface FormErrors {
  name?: string;
  birthDate?: string;
  classroom?: string;
}

/**
 * -------------------------------------
 * -----  `fieldStyles(hasError)`  -----
 * -------------------------------------
 * - Estilos de un campo; borde rojo cuando tiene error de validación.
 */
const fieldStyles = (hasError: boolean): string => `w-full py-[13px] px-4 rounded-[14px] border-[1.5px] ${hasError ? "border-[#D9583C]" : "border-[#EADFD0]"} bg-white text-[15px] text-[#3F362E] outline-none placeholder:text-[#B6A99B]`;

/**
 * ----------------------------------------------------------
 * -----  `validateForm(name, birthDate, classroom)`  -----
 * ----------------------------------------------------------
 * - Valida los requeridos y el formato de la fecha; devuelve los errores por campo.
 */
const validateForm = (name: string, birthDate: string, classroom: string): FormErrors => {
  const errors: FormErrors = {};

  //  -----  nombre: requerido  -----
  if (name.trim() === "") {
    errors.name = "Campo requerido";
  }
  //  -----  fecha: requerida  -----
  if (birthDate === "") {
    errors.birthDate = "Campo requerido";
  }
  //  -----  fecha: formato dd/mm/aaaa y fecha real en el calendario (cualquier año)  -----
  else if (!isCalendarDate(birthDate)) {
    errors.birthDate = "Formato inválido (dd/mm/aaaa)";
  }
  //  -----  sala: requerida  -----
  if (classroom === "") {
    errors.classroom = "Campo requerido";
  }
  return errors;
};

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
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [birthDate, setBirthDate] = useState<string>("");
  const [classroom, setClassroom] = useState<string>("");
  const [allergies, setAllergies] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * -------------------------------------------------
   * -----  `clearErrorIfValid(field, value)`  -----
   * -------------------------------------------------
   * - Limpia el error de un campo cuando su valor pasa a ser válido.
   */
  const clearErrorIfValid = (field: keyof FormErrors, value: string): void => {
    //  -----  el campo no tiene error, nada que limpiar  -----
    if (!errors[field]) {
      return;
    }
    //  -----  el nuevo valor del campo es válido según su tipo  -----
    let isValid: boolean = true;
    if (field === "name") {
      isValid = value.trim() !== "";
    }
    if (field === "birthDate") {
      isValid = isCalendarDate(value);
    }
    if (field === "classroom") {
      isValid = value !== "";
    }
    if (isValid) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  /**
   * ------------------------------------------
   * -----  `handleBirthDateChange(event)`  -----
   * ------------------------------------------
   * - Actualiza la fecha aplicando la máscara dd/mm/aaaa.
   */
  const handleBirthDateChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const masked = maskBirthDate(event.target.value);
    setBirthDate(masked);
    clearErrorIfValid("birthDate", masked);
  };

  /**
   * ------------------------------------
   * -----  `handleSubmit(event)`  -----
   * ------------------------------------
   * - Valida el formulario; si es válido navega a la lista de niños.
   */
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const nextErrors = validateForm(name, birthDate, classroom);
    setErrors(nextErrors);

    //  -----  formulario válido: navegar a /kids sin persistir (mock)  -----
    if (Object.keys(nextErrors).length === 0) {
      router.push("/kids");
    }
  };

  //  -----  estilos del select: placeholder gris hasta elegir sala, borde rojo con error  -----
  const selectClasses = `appearance-none w-full py-[13px] pl-4 pr-[40px] rounded-[14px] border-[1.5px] ${errors.classroom ? "border-[#D9583C]" : "border-[#EADFD0]"} bg-white text-[15px] font-bold outline-none ${classroom === "" ? "text-[#B6A99B]" : "text-[#3F362E]"}`;

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-[520px] bg-[#FBF4EC] border border-[#ECE0D0] rounded-[24px] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)] overflow-hidden"
    >
      {/*  -----  header: cancelar, título y guardar  -----  */}
      <div className="flex items-center justify-between py-5 px-[26px] border-b border-[#ECE0D0]">
        <Link href="/kids" className="text-[15px] font-bold text-[#94887B]">Cancelar</Link>
        <span className="font-display font-semibold text-[18px] text-[#3F362E]">Agregar niño</span>
        <button type="submit" className="cursor-pointer text-[15px] font-extrabold text-[#D9583C]">Guardar</button>
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
            onChange={(event) => {
              setName(event.target.value);
              clearErrorIfValid("name", event.target.value);
            }}
            placeholder="Ej. Martina López"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={fieldStyles(Boolean(errors.name))}
          />
          {errors.name && <p id="name-error" className="mt-1.5 text-[12.5px] font-bold text-[#D9583C]">{errors.name}</p>}
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
              aria-invalid={Boolean(errors.birthDate)}
              aria-describedby={errors.birthDate ? "birth-date-error" : undefined}
              className={fieldStyles(Boolean(errors.birthDate))}
            />
            {errors.birthDate && <p id="birth-date-error" className="mt-1.5 text-[12.5px] font-bold text-[#D9583C]">{errors.birthDate}</p>}
          </div>
          <div className="flex-1">
            <label htmlFor="classroom" className={labelClasses}>SALA</label>
            <div className="relative">
              <select
                id="classroom"
                value={classroom}
                onChange={(event) => {
                  setClassroom(event.target.value);
                  clearErrorIfValid("classroom", event.target.value);
                }}
                aria-invalid={Boolean(errors.classroom)}
                aria-describedby={errors.classroom ? "classroom-error" : undefined}
                className={selectClasses}
              >
                <option value="" disabled hidden>Seleccionar sala…</option>
                {classrooms.map((room) => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">{chevronIcon}</span>
            </div>
            {errors.classroom && <p id="classroom-error" className="mt-1.5 text-[12.5px] font-bold text-[#D9583C]">{errors.classroom}</p>}
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
            className={fieldStyles(false)}
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
            className={`${fieldStyles(false)} min-h-[90px] resize-y leading-[1.5]`}
          />
        </div>
      </div>
    </form>
  );
};

export default AddKidForm;
