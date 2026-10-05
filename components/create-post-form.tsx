/*
    *  ---------------------------------------------------------------------  *
    *  -----  create-post-form.tsx  --  /components/create-post-form.tsx  -----  *
    *  ---------------------------------------------------------------------  *
*/
"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, ReactElement, SubmitEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { createPost } from "@/app/staff/crear-publicacion/actions";
import {
  ALLOWED_PHOTO_TYPES,
  MAX_BODY_LENGTH,
  MAX_PHOTO_BYTES,
  MAX_PHOTOS_PER_POST,
  firstName,
  postTypeOptions,
} from "@/lib/posts";
import type { PostChildAvatar, PostPhotoInput, PostType } from "@/lib/posts";
import { createClient } from "@/utils/supabase/client";

/** - `props del formulario de nueva publicación` */
interface CreatePostFormProps {
  recipients: PostChildAvatar[];
  canAddressWholeRoom: boolean;
  daycareId: string;
  photoConsentBlockedIds: string[];
  wholeRoomPhotoConsentBlocked: boolean;
}

/** - `foto adjunta en el formulario, antes de subirse a Storage` */
interface PhotoDraft {
  id: string;
  file: File;
  previewUrl: string;
  alt: string;
  width: number | null;
  height: number | null;
}

/** - `errores de validación del formulario, por campo` */
interface FormErrors {
  typeId?: string; // "Elegí un tipo"
  description?: string; // "Campo requerido"
  recipients?: string; // "Elegí al menos un destinatario"
  photos?: string; // límites o tipo "Foto" sin imagen
}

/** - `extensión de archivo por MIME permitido` */
const PHOTO_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** - `icono + del tile de agregar foto` */
const plusIcon: ReactElement = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C5503A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/** - `estilos de las etiquetas de sección` */
const sectionLabelClasses: string = "text-[12px] font-extrabold tracking-[.7px] text-[#94887B]";

/** - `estilos de los botones de quitar/reordenar foto` */
const photoControlClasses: string =
  "flex w-7 h-7 items-center justify-center rounded-full border-[1.5px] border-[#EADFD0] bg-[#FFFDF9] text-[#6E6359] font-bold text-[15px] leading-none cursor-pointer disabled:opacity-40 disabled:cursor-default";

/**
 * --------------------------------------------------------------------------------------------------
 * -----  `validateForm(typeId, description, wholeClass, selectedIds, photos, blockedIds, roomBlocked)`  -----
 * --------------------------------------------------------------------------------------------------
 * - Valida los requeridos del formulario; devuelve los errores por campo.
 */
const validateForm = (
  typeId: PostType | null,
  description: string,
  wholeClass: boolean,
  selectedIds: string[],
  photos: PhotoDraft[],
  photoConsentBlockedIds: string[],
  wholeRoomPhotoConsentBlocked: boolean,
): FormErrors => {
  const errors: FormErrors = {};

  //  -----  tipo: requerido  -----
  if (typeId === null) {
    errors.typeId = "Elegí un tipo";
  }

  //  -----  descripción: requerida y con máximo de caracteres  -----
  if (description.trim() === "") {
    errors.description = "Campo requerido";
  } else if (description.trim().length > MAX_BODY_LENGTH) {
    errors.description = `Máximo ${MAX_BODY_LENGTH} caracteres`;
  }

  //  -----  destinatarios: al menos un niño o "Toda la sala"  -----
  if (!wholeClass && selectedIds.length === 0) {
    errors.recipients = "Elegí al menos un destinatario";
  }

  //  -----  tipo "Foto": exige al menos una imagen  -----
  if (typeId === "photo" && photos.length === 0) {
    errors.photos = "Adjuntá al menos una foto";
  }

  //  -----  consentimiento de fotos: bloquea antes de subir a Storage  -----
  if (photos.length > 0) {
    if (wholeClass && wholeRoomPhotoConsentBlocked) {
      errors.photos = "No se pueden publicar fotos: hay niños en la sala sin consentimiento de imagen";
    } else if (!wholeClass && selectedIds.some((id) => photoConsentBlockedIds.includes(id))) {
      errors.photos = "No se pueden publicar fotos de niños sin consentimiento de imagen";
    }
  }

  return errors;
};

/**
 * ----------------------------------------
 * -----  `readImageSize(previewUrl)`  -----
 * ----------------------------------------
 * - Lee las dimensiones naturales de la imagen (para post_photos).
 */
const readImageSize = (previewUrl: string): Promise<{ width: number; height: number }> =>
  new Promise((resolve) => {
    const image = new window.Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve({ width: 0, height: 0 });
    image.src = previewUrl;
  });

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
 * -----  `CreatePostForm(props)`  -----
 * -------------------------------------
 * - Formulario de nueva publicación: destinatarios y tipo reales, descripción,
 * - fotos con preview/alt/orden y subida directa a Storage al publicar.
 */
const CreatePostForm = ({
  recipients,
  canAddressWholeRoom,
  daycareId,
  photoConsentBlockedIds,
  wholeRoomPhotoConsentBlocked,
}: CreatePostFormProps): ReactElement => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [wholeClass, setWholeClass] = useState<boolean>(false);
  const [typeId, setTypeId] = useState<PostType | null>(null);
  const [description, setDescription] = useState<string>("");
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState<boolean>(false);

  /**
   * ------------------------------------------------
   * -----  `handleDescriptionChange(event)`  -----
   * ------------------------------------------------
   * - Actualiza la descripción y limpia su error al corregirla.
   */
  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    setDescription(event.target.value);

    //  -----  el error de la descripción se limpia al corregirla  -----
    if (errors.description && event.target.value.trim() !== "") {
      setErrors((current) => ({ ...current, description: undefined }));
    }
  };

  /**
   * ----------------------------------------
   * -----  `handleRecipientToggle(id)`  -----
   * ----------------------------------------
   * - Agrega o quita un niño de la selección y deselecciona "Toda la sala".
   */
  const handleRecipientToggle = (id: string): void => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
    setWholeClass(false);

    //  -----  el error de destinatarios se limpia al elegir alguno  -----
    if (errors.recipients) {
      setErrors((current) => ({ ...current, recipients: undefined }));
    }
  };

  /**
   * -------------------------------------
   * -----  `handleWholeClass()`  -----
   * -------------------------------------
   * - Activa "Toda la sala" y deselecciona a todos los niños.
   */
  const handleWholeClass = (): void => {
    setWholeClass(true);
    setSelectedIds([]);

    //  -----  el error de destinatarios se limpia al elegir "Toda la sala"  -----
    if (errors.recipients) {
      setErrors((current) => ({ ...current, recipients: undefined }));
    }
  };

  /**
   * ----------------------------------
   * -----  `handleType(id)`  -----
   * ----------------------------------
   * - Marca el tipo de publicación elegido (selección única, sin toggle-off).
   */
  const handleType = (id: PostType): void => {
    setTypeId(id);

    //  -----  el error del tipo se limpia al elegir uno  -----
    if (errors.typeId) {
      setErrors((current) => ({ ...current, typeId: undefined }));
    }
  };

  /**
   * ----------------------------------------------
   * -----  `handleAddPhotos(event)`  -----
   * ----------------------------------------------
   * - Valida y adjunta las fotos elegidas (máx. 4, 5 MB, JPEG/PNG/WebP).
   */
  const handleAddPhotos = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files: File[] = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) {
      return;
    }

    //  -----  formato permitido (sin HEIC)  -----
    if (files.some((file) => !ALLOWED_PHOTO_TYPES.includes(file.type))) {
      setErrors((current) => ({ ...current, photos: "Solo se permiten imágenes JPEG, PNG o WebP" }));
      return;
    }

    //  -----  tamaño máximo por foto  -----
    if (files.some((file) => file.size > MAX_PHOTO_BYTES)) {
      setErrors((current) => ({ ...current, photos: "Cada foto puede pesar hasta 5 MB" }));
      return;
    }

    //  -----  máximo de fotos por publicación  -----
    if (photos.length + files.length > MAX_PHOTOS_PER_POST) {
      setErrors((current) => ({ ...current, photos: `Podés adjuntar hasta ${MAX_PHOTOS_PER_POST} fotos` }));
      return;
    }

    const drafts: PhotoDraft[] = await Promise.all(
      files.map(async (file) => {
        const previewUrl: string = URL.createObjectURL(file);
        const size = await readImageSize(previewUrl);

        return {
          id: crypto.randomUUID(),
          file,
          previewUrl,
          alt: "",
          width: size.width > 0 ? size.width : null,
          height: size.height > 0 ? size.height : null,
        };
      }),
    );

    setPhotos((current) => [...current, ...drafts]);
    setErrors((current) => ({ ...current, photos: undefined }));
  };

  /**
   * -------------------------------------
   * -----  `handleRemovePhoto(id)`  -----
   * -------------------------------------
   * - Quita una foto adjunta y libera su preview.
   */
  const handleRemovePhoto = (id: string): void => {
    setPhotos((current) => {
      const target: PhotoDraft | undefined = current.find((photo) => photo.id === id);

      //  -----  liberar la URL del preview  -----
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((photo) => photo.id !== id);
    });
  };

  /**
   * ----------------------------------------------
   * -----  `handleMovePhoto(index, offset)`  -----
   * ----------------------------------------------
   * - Reordena una foto una posición a la izquierda (-1) o derecha (+1).
   */
  const handleMovePhoto = (index: number, offset: -1 | 1): void => {
    setPhotos((current) => {
      const target: number = index + offset;
      if (target < 0 || target >= current.length) {
        return current;
      }

      const next: PhotoDraft[] = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  /**
   * ---------------------------------------
   * -----  `handleAltChange(id, alt)`  -----
   * ---------------------------------------
   * - Actualiza la descripción (alt) de una foto.
   */
  const handleAltChange = (id: string, alt: string): void => {
    setPhotos((current) => current.map((photo) => (photo.id === id ? { ...photo, alt } : photo)));
  };

  /**
   * ------------------------------------
   * -----  `handleSubmit(event)`  -----
   * ------------------------------------
   * - Valida, sube las fotos a Storage y llama al Server Action de publicación.
   */
  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const nextErrors: FormErrors = validateForm(
      typeId,
      description,
      wholeClass,
      selectedIds,
      photos,
      photoConsentBlockedIds,
      wholeRoomPhotoConsentBlocked,
    );
    setErrors(nextErrors);

    //  -----  formulario inválido: no se envía nada  -----
    if (Object.keys(nextErrors).length > 0 || typeId === null) {
      return;
    }

    setSubmitting(true);
    setSubmitError(undefined);

    //  -----  subida directa navegador → Storage (recién al publicar)  -----
    const supabase = createClient();
    const uploadedPhotos: PostPhotoInput[] = [];

    for (const photo of photos) {
      const path: string = `${daycareId}/${crypto.randomUUID()}.${PHOTO_EXTENSIONS[photo.file.type] ?? "jpg"}`;
      const { error } = await supabase.storage.from("post-photos").upload(path, photo.file, {
        contentType: photo.file.type,
      });

      //  -----  si falla una subida no se publica nada  -----
      if (error) {
        setSubmitting(false);
        setSubmitError("No se pudieron subir las fotos. Intentá de nuevo.");
        return;
      }

      uploadedPhotos.push({ path, alt: photo.alt.trim(), width: photo.width, height: photo.height });
    }

    const formData = new FormData();
    formData.set("type", typeId);
    formData.set("body", description.trim());
    formData.set("wholeClass", wholeClass ? "true" : "false");
    formData.set("childIds", JSON.stringify(wholeClass ? [] : selectedIds));
    formData.set("photos", JSON.stringify(uploadedPhotos));

    const result = await createPost(formData);

    //  -----  error del Server Action: se muestra inline y no se navega  -----
    if (result?.error) {
      setSubmitting(false);
      setSubmitError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full max-w-[580px] bg-[#FBF4EC] border border-[#ECE0D0] rounded-[24px] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)] overflow-hidden">
      {/*  -----  header: cancelar, título y publicar  -----  */}
      <div className="flex items-center justify-between py-5 px-[26px] border-b border-[#ECE0D0]">
        <Link href="/staff" className="text-[#94887B] font-bold text-[15px]">Cancelar</Link>
        <div className="font-display font-semibold text-[18px] text-[#3F362E]">Nueva publicación</div>
        <button
          type="submit"
          disabled={submitting}
          className="text-[#D9583C] font-extrabold text-[15px] cursor-pointer disabled:opacity-60 disabled:cursor-default"
        >
          {submitting ? "Publicando…" : "Publicar"}
        </button>
      </div>

      {/*  -----  cuerpo de la tarjeta  -----  */}
      <div className="py-6 px-[26px]">
        {/*  -----  para: destinatarios de la publicación  -----  */}
        <div className="mb-[22px]">
          <div className={`${sectionLabelClasses} mb-[10px]`}>PARA</div>
          <div role="group" aria-label="Destinatarios" aria-describedby={errors.recipients ? "recipients-error" : undefined} className="flex flex-wrap gap-[9px]">
            {recipients.map((recipient) => {
              const isSelected: boolean = selectedIds.includes(recipient.id);

              return (
                <button
                  key={recipient.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleRecipientToggle(recipient.id)}
                  className={recipientChipStyles(isSelected)}
                >
                  <span
                    className="flex w-[26px] h-[26px] rounded-full items-center justify-center flex-none font-display font-semibold text-[13px]"
                    style={{ background: recipient.background, color: recipient.color }}
                  >
                    {recipient.initial}
                  </span>
                  {firstName(recipient.name)}
                </button>
              );
            })}
            {canAddressWholeRoom && (
              <button
                type="button"
                aria-pressed={wholeClass}
                onClick={handleWholeClass}
                className={wholeClassChipStyles(wholeClass)}
              >
                Toda la sala
              </button>
            )}
          </div>
          {errors.recipients && <p id="recipients-error" className="mt-1.5 text-[12.5px] font-bold text-[#D9583C]">{errors.recipients}</p>}
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
            maxLength={MAX_BODY_LENGTH}
            placeholder="Contá cómo le fue hoy…"
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? "description-error" : undefined}
            className={`w-full min-h-[120px] resize-y py-[14px] px-4 rounded-[14px] border-[1.5px] ${errors.description ? "border-[#D9583C]" : "border-[#EADFD0]"} bg-white text-[15px] text-[#3F362E] leading-[1.5] outline-none placeholder:text-[#B6A99B]`}
          />
          {errors.description && <p id="description-error" className="mt-1.5 text-[12.5px] font-bold text-[#D9583C]">{errors.description}</p>}
        </div>

        {/*  -----  fotos: previews con alt, quitar y reordenar  -----  */}
        <div>
          <div className={`${sectionLabelClasses} mb-[10px]`}>FOTOS</div>
          <div className="flex flex-wrap items-start gap-3" aria-describedby={errors.photos ? "photos-error" : undefined}>
            {photos.map((photo, index) => (
              <div key={photo.id} className="flex flex-col gap-1.5">
                <Image
                  src={photo.previewUrl}
                  alt={photo.alt.trim() !== "" ? photo.alt : `Vista previa de la foto ${index + 1}`}
                  width={96}
                  height={96}
                  className="w-[96px] h-[96px] object-cover rounded-[14px] border border-[#ECE0D0] bg-[#F4ECE1]"
                />
                <div className="flex gap-1.5 justify-center">
                  <button
                    type="button"
                    onClick={() => handleMovePhoto(index, -1)}
                    disabled={index === 0}
                    aria-label={`Mover foto ${index + 1} a la izquierda`}
                    className={photoControlClasses}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMovePhoto(index, 1)}
                    disabled={index === photos.length - 1}
                    aria-label={`Mover foto ${index + 1} a la derecha`}
                    className={photoControlClasses}
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    aria-label={`Quitar foto ${index + 1}`}
                    className={`${photoControlClasses} text-[#C5503A]`}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}

            {photos.length < MAX_PHOTOS_PER_POST && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-[96px] h-[96px] rounded-[14px] border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] flex-col items-center justify-center gap-[6px] text-[#B0A290] cursor-pointer"
              >
                {plusIcon}
                <span className="text-[12px]">Agregar</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_PHOTO_TYPES.join(",")}
            multiple
            onChange={handleAddPhotos}
            className="sr-only"
            aria-label="Agregar fotos"
          />

          {photos.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {photos.map((photo, index) => (
                <input
                  key={photo.id}
                  value={photo.alt}
                  onChange={(event) => handleAltChange(photo.id, event.target.value)}
                  placeholder={`Descripción de la foto ${index + 1} (opcional)`}
                  aria-label={`Descripción de la foto ${index + 1}`}
                  className="w-full py-[10px] px-3.5 rounded-[12px] border-[1.5px] border-[#EADFD0] bg-white text-[14px] text-[#3F362E] outline-none placeholder:text-[#B6A99B]"
                />
              ))}
            </div>
          )}

          {errors.photos && <p id="photos-error" className="mt-1.5 text-[12.5px] font-bold text-[#D9583C]">{errors.photos}</p>}
        </div>

        {/*  -----  error del envío (subida o Server Action)  -----  */}
        {submitError && <p role="alert" className="mt-4 text-[13px] font-bold text-[#D9583C]">{submitError}</p>}
      </div>
    </form>
  );
};

export default CreatePostForm;
