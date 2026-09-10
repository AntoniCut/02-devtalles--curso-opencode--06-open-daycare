/*
    *  ------------------------------------------------------------------------  *
    *  -----  create-post-form.tsx  --  /components/create-post-form.tsx  -----  *
    *  ------------------------------------------------------------------------  *
*/
"use client";

import { useState } from "react";
import type { ChangeEvent, ReactElement, SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { postTypeOptions } from "@/lib/feed";
import type { CreatePostTypeId } from "@/lib/feed";
import { kids } from "@/lib/kids";

/** - `chip de destinatario individual: los 3 primeros niños de la sala (mockup)` */
interface RecipientOption {
  slug: string;
  name: string;
  initial: string;
  background: string;
  color: string;
}

/** - `destinatarios individuales derivados de lib/kids.ts (los 3 del mockup)` */
const recipientOptions: RecipientOption[] = kids.slice(0, 3).map((kid) => ({
  slug: kid.slug,
  name: kid.name.split(" ")[0],
  initial: kid.initial,
  background: kid.background,
  color: kid.color,
}));

/** - `icono cámara del tile de foto subida` */
const cameraIcon: ReactElement = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
  </svg>
);

/** - `icono + del tile de agregar foto` */
const plusIcon: ReactElement = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C5503A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/** - `descripción precargada del mockup` */
const MOCK_DESCRIPTION = "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón.";

/** - `estilos de las etiquetas de sección` */
const sectionLabelClasses: string = "text-[12px] font-extrabold tracking-[.7px] text-[#94887B]";

/** - `errores de validación del formulario, por campo` */
interface FormErrors {
  typeId?: string; // "Elegí un tipo"
  description?: string; // "Campo requerido"
}

/**
 * ----------------------------------------------------
 * -----  `validateForm(typeId, description)`  -----
 * ----------------------------------------------------
 * - Valida los requeridos del formulario; devuelve los errores por campo.
 */
const validateForm = (typeId: CreatePostTypeId | null, description: string): FormErrors => {
  const errors: FormErrors = {};

  //  -----  tipo: requerido  -----
  if (typeId === null) {
    errors.typeId = "Elegí un tipo";
  }
  //  -----  descripción: requerida  -----
  if (description.trim() === "") {
    errors.description = "Campo requerido";
  }
  return errors;
};

/**
 * --------------------------------------------------
 * -----  `recipientChipStyles(selected)`  -----
 * --------------------------------------------------
 * - Estilos de un chip de destinatario según esté seleccionado o no.
 */
const recipientChipStyles = (selected: boolean): string => `flex items-center gap-2 rounded-full border-[1.5px] py-[6px] pl-[6px] pr-[14px] font-bold text-[14px] cursor-pointer ${selected ? "border-[#3F362E] bg-[#3F362E] text-white" : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"}`;

/**
 * --------------------------------------------
 * -----  `wholeClassChipStyles(selected)`  -----
 * --------------------------------------------
 * - Estilos del chip "Toda la sala" (sin avatar) según esté seleccionado o no.
 */
const wholeClassChipStyles = (selected: boolean): string => `rounded-full border-[1.5px] py-[6px] px-4 font-bold text-[14px] cursor-pointer ${selected ? "border-[#3F362E] bg-[#3F362E] text-white" : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"}`;

/**
 * -------------------------------------
 * -----  `typeChipStyles(selected)`  -----
 * -------------------------------------
 * - Estilos de un chip de tipo; el anillo #3F362E aparece solo al seleccionar.
 *   El borde transparente con padding compensado mantiene la caja exacta del mockup
 *   (el borde de 1.5px se renderiza como 1px en DPR 1, por eso el padding es 7px/15px).
 */
const typeChipStyles = (selected: boolean): string => `rounded-full border-[1.5px] py-[7px] px-[15px] font-extrabold text-[13.5px] cursor-pointer ${selected ? "border-[#3F362E]" : "border-transparent"}`;

/**
 * -------------------------------------
 * -----  `CreatePostForm()`  -----
 * -------------------------------------
 * - Formulario de nueva publicación: header Cancelar/Publicar, selección de
 *   destinatarios y de tipo, descripción y tiles de fotos estáticos.
 */
const CreatePostForm = (): ReactElement => {
  const router = useRouter();
  const [recipients, setRecipients] = useState<string[]>(["mateo-fernandez"]);
  const [wholeClass, setWholeClass] = useState<boolean>(false);
  const [typeId, setTypeId] = useState<CreatePostTypeId | null>(null);
  const [description, setDescription] = useState<string>(MOCK_DESCRIPTION);
  const [errors, setErrors] = useState<FormErrors>({});

  //  -----  descripción de la publicación  -----
  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    setDescription(event.target.value);

    //  -----  el error de la descripción se limpia al corregirla  -----
    if (errors.description && event.target.value.trim() !== "") {
      setErrors((current) => ({ ...current, description: undefined }));
    }
  };

  /**
   * ---------------------------------------------------
   * -----  `handleRecipientToggle(slug)`  -----
   * ---------------------------------------------------
   * - Agrega o quita un niño de la selección y deselecciona "Toda la sala".
   */
  const handleRecipientToggle = (slug: string): void => {
    setRecipients((current) => (current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]));
    setWholeClass(false);
  };

  /**
   * -------------------------------------
   * -----  `handleWholeClass()`  -----
   * -------------------------------------
   * - Activa "Toda la sala" y deselecciona a todos los niños.
   */
  const handleWholeClass = (): void => {
    setWholeClass(true);
    setRecipients([]);
  };

  /**
   * ----------------------------------
   * -----  `handleType(id)`  -----
   * ----------------------------------
   * - Marca el tipo de publicación elegido (selección única, sin toggle-off).
   */
  const handleType = (id: CreatePostTypeId): void => {
    setTypeId(id);

    //  -----  el error del tipo se limpia al elegir uno  -----
    if (errors.typeId) {
      setErrors((current) => ({ ...current, typeId: undefined }));
    }
  };

  /**
   * ------------------------------------
   * -----  `handleSubmit(event)`  -----
   * ------------------------------------
   * - Valida el formulario; si es válido navega al feed sin persistir (mock).
   */
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const nextErrors = validateForm(typeId, description);
    setErrors(nextErrors);

    //  -----  formulario válido: navegar al feed sin persistir (mock)  -----
    if (Object.keys(nextErrors).length === 0) {
      router.push("/");
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full max-w-[580px] bg-[#FBF4EC] border border-[#ECE0D0] rounded-[24px] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)] overflow-hidden">
      {/*  -----  header: cancelar, título y publicar  -----  */}
      <div className="flex items-center justify-between py-5 px-[26px] border-b border-[#ECE0D0]">
        <Link href="/" className="text-[#94887B] font-bold text-[15px]">Cancelar</Link>
        <div className="font-display font-semibold text-[18px] text-[#3F362E]">Nueva publicación</div>
        <button type="submit" className="text-[#D9583C] font-extrabold text-[15px] cursor-pointer">Publicar</button>
      </div>

      {/*  -----  cuerpo de la tarjeta  -----  */}
      <div className="py-6 px-[26px]">
        {/*  -----  para: destinatarios de la publicación  -----  */}
        <div className="mb-[22px]">
          <div className={`${sectionLabelClasses} mb-[10px]`}>PARA</div>
          <div className="flex flex-wrap gap-[9px]">
            {recipientOptions.map((recipient) => {
              const isSelected: boolean = recipients.includes(recipient.slug);

              return (
                <button
                  key={recipient.slug}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleRecipientToggle(recipient.slug)}
                  className={recipientChipStyles(isSelected)}
                >
                  <span
                    className="flex w-[26px] h-[26px] rounded-full items-center justify-center flex-none font-display font-semibold text-[13px]"
                    style={{ background: recipient.background, color: recipient.color }}
                  >
                    {recipient.initial}
                  </span>
                  {recipient.name}
                </button>
              );
            })}
            <button
              type="button"
              aria-pressed={wholeClass}
              onClick={handleWholeClass}
              className={wholeClassChipStyles(wholeClass)}
            >
              Toda la sala
            </button>
          </div>
        </div>

        {/*  -----  tipo: selección única con anillo al clic  -----  */}
        <div className="mb-[22px]">
          <div className={`${sectionLabelClasses} mb-[10px]`}>TIPO</div>
          <div className="flex flex-wrap gap-[9px]">
            {postTypeOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={typeId === option.id}
                onClick={() => handleType(option.id)}
                className={typeChipStyles(typeId === option.id)}
                style={{ background: option.background, color: option.color }}
              >
                {option.label}
              </button>
            ))}
          </div>
          {errors.typeId && <p id="type-error" className="mt-1.5 text-[12.5px] font-bold text-[#D9583C]">{errors.typeId}</p>}
        </div>

        {/*  -----  descripción de la publicación  -----  */}
        <div className="mb-[22px]">
          <label htmlFor="description" className={`${sectionLabelClasses} block mb-[10px]`}>DESCRIPCIÓN</label>
          <textarea
            id="description"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Contá cómo le fue hoy…"
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? "description-error" : undefined}
            className={`w-full min-h-[120px] resize-y py-[14px] px-4 rounded-[14px] border-[1.5px] ${errors.description ? "border-[#D9583C]" : "border-[#EADFD0]"} bg-white text-[15px] text-[#3F362E] leading-[1.5] outline-none placeholder:text-[#B6A99B]`}
          />
          {errors.description && <p id="description-error" className="mt-1.5 text-[12.5px] font-bold text-[#D9583C]">{errors.description}</p>}
        </div>

        {/*  -----  fotos: tiles estáticos del mockup  -----  */}
        <div>
          <div className={`${sectionLabelClasses} mb-[10px]`}>FOTOS</div>
          <div className="flex gap-3">
            <div className="flex w-[96px] h-[96px] rounded-[14px] bg-[#F4ECE1] border border-[#ECE0D0] items-center justify-center text-[#CBB89F]">
              {cameraIcon}
            </div>
            <div className="flex w-[96px] h-[96px] rounded-[14px] border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] flex-col items-center justify-center gap-[6px] text-[#B0A290]">
              {plusIcon}
              <span className="text-[12px]">Agregar</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CreatePostForm;
