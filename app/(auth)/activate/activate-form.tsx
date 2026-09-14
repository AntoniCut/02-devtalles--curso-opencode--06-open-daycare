/*
    *  -----------------------------------------------------------------------------  *
    *  -----  activate-form.tsx  --  /app/(auth)/activate/activate-form.tsx  -----  *
    *  -----------------------------------------------------------------------------  *
*/
"use client";

import { useState, useActionState } from "react";
import type { ChangeEvent, ReactElement, SubmitEvent } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { activateAccount, lookupInvitation } from "@/app/(auth)/activate/actions";
import type { ActivateAccountState, InvitationPreview } from "@/app/(auth)/activate/actions";
import { CODE_PATTERN } from "@/lib/invitation-code";

/** - `icono check del checkbox de autorización` */
const checkIcon: ReactElement = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/** - `formato de email admitido` */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** - `estilos de las etiquetas de los campos (sin margen)` */
const labelClasses: string = "block text-[12px] font-bold tracking-[.7px] text-[#94887B]";

/** - `errores de validación del cliente, por campo` */
interface FormErrors {
  code?: string;
  email?: string;
  password?: string;
}

/**
 * ----------------------------------------
 * -----  `SubmitButton()`  -----
 * ----------------------------------------
 * - CTA Activar mi cuenta con estado de carga vía useFormStatus (hijo del form).
 */
const SubmitButton = (): ReactElement => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="block w-full rounded-[15px] bg-linear-to-b/srgb from-[#F4977E] to-[#EE8164] py-[15px] text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? "Activando…" : "Activar mi cuenta"}
    </button>
  );
};

/** - `props del formulario de activación (prellenado desde la página server)` */
interface ActivateFormProps {
  initialCode: string;
  initialEmail: string;
  initialPreview: InvitationPreview | null;
}

/**
 * ------------------------------------------------
 * -----  `ActivateForm(props)`  -----
 * ------------------------------------------------
 * - Formulario de activación de cuenta invitada: tarjeta de invitación con los
 *   datos reales de la invitación, código, email, contraseña, checkbox de
 *   autorización y CTA. El submit llama a la Server Action que crea la cuenta,
 *   vincula al niño y consume la invitación.
 */
const ActivateForm = ({ initialCode, initialEmail, initialPreview }: ActivateFormProps): ReactElement => {
  const [code, setCode] = useState<string>(initialCode);
  const [email, setEmail] = useState<string>(initialEmail);
  const [password, setPassword] = useState<string>("");
  const [preview, setPreview] = useState<InvitationPreview | null>(initialPreview);
  const [errors, setErrors] = useState<FormErrors>({});
  const [state, formAction] = useActionState<ActivateAccountState, FormData>(activateAccount, {
    codeError: null,
    emailError: null,
    passwordError: null,
  });

  const initial = initialPreview ? initialPreview.childName.slice(0, 1).toUpperCase() : "";

  /**
   * -----------------------------------------------------
   * -----  `validateClient(code, email, password)`  -----
   * -----------------------------------------------------
   * - Valida los requeridos y el formato en el cliente; devuelve los errores por campo.
   */
  const validateClient = (codeValue: string, emailValue: string, passwordValue: string): FormErrors => {
    const nextErrors: FormErrors = {};

    //  -----  código: requerido y con formato del mockup  -----
    if (codeValue.trim() === "") {
      nextErrors.code = "Campo requerido";
    } else if (!CODE_PATTERN.test(codeValue.trim().toUpperCase())) {
      nextErrors.code = "Código de invitación inválido o expirado";
    }
    //  -----  email: requerido  -----
    if (emailValue === "") {
      nextErrors.email = "Campo requerido";
    }
    //  -----  email: formato inválido  -----
    else if (!EMAIL_PATTERN.test(emailValue)) {
      nextErrors.email = "Email inválido";
    }
    //  -----  contraseña: requerida  -----
    if (passwordValue === "") {
      nextErrors.password = "Campo requerido";
    }
    return nextErrors;
  };

  /**
   * ------------------------------------------------------
   * -----  `clearErrorIfValid(field, value)`  -----
   * ------------------------------------------------------
   * - Limpia el error local de un campo cuando su valor pasa a ser válido.
   */
  const clearErrorIfValid = (field: keyof FormErrors): void => {
    if (!errors[field]) {
      return;
    }
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  /**
   * ------------------------------------------
   * -----  `fetchPreview(value)`  -----
   * ------------------------------------------
   * - Busca la invitación por código y actualiza la tarjeta (y prellena el email).
   */
  const fetchPreview = (value: string): void => {
    const normalized = value.trim().toUpperCase();
    if (!CODE_PATTERN.test(normalized)) {
      setPreview(null);
      return;
    }
    void lookupInvitation(normalized).then((result) => {
      if (result.ok) {
        setPreview(result.data);
        setEmail((current) => (current === "" ? result.data.invitationEmail : current));
      } else {
        setPreview(null);
      }
    });
  };

  //  -----  código de invitación  -----
  const handleCodeChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value;
    setCode(value);
    clearErrorIfValid("code");
    fetchPreview(value);
  };

  //  -----  email del padre  -----
  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setEmail(event.target.value);
    clearErrorIfValid("email");
  };

  //  -----  contraseña  -----
  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setPassword(event.target.value);
    clearErrorIfValid("password");
  };

  /**
   * ------------------------------------
   * -----  `handleSubmit(event)`  -----
   * ------------------------------------
   * - Valida en el cliente; si es válido lo deja pasar a la Server Action.
   */
  const handleSubmit = (event: SubmitEvent<HTMLFormElement>): void => {
    const nextErrors = validateClient(code, email, password);
    setErrors(nextErrors);

    //  -----  formulario inválido: no enviar  -----
    if (Object.keys(nextErrors).length > 0) {
      event.preventDefault();
    }
  };

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate>
      {/*  -----  tarjeta de invitación (datos reales vía lookup)  -----  */}
      {preview && (
        <div className="mb-[22px] flex items-center gap-[14px] rounded-[16px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px]">
          <div className="flex size-[44px] flex-none items-center justify-center rounded-full bg-[#A9D9E8] font-display font-semibold text-[19px] text-[#1F7A93]">{initial}</div>
          <div>
            <div className="text-[13px] text-[#94887B]">Te invitaron a seguir a</div>
            <div className="font-display font-semibold text-[17px] text-[#3F362E]">{preview.childName} · Sala {preview.roomName}</div>
          </div>
        </div>
      )}

      <label htmlFor="activate-code" className={`${labelClasses} mb-2 block`}>
        CÓDIGO DE INVITACIÓN
      </label>
      <input
        id="activate-code"
        name="code"
        type="text"
        value={code}
        onChange={handleCodeChange}
        placeholder="7K4P9"
        aria-invalid={Boolean(errors.code ?? state.codeError)}
        aria-describedby={errors.code ?? state.codeError ? "activate-code-error" : undefined}
        className={`mb-[18px] w-full rounded-[14px] border-[1.5px] bg-white px-4 py-[14px] font-display text-[18px] font-bold tracking-[3px] text-[#3F362E] uppercase outline-none placeholder:text-[#B6A99B] placeholder:tracking-[3px] ${errors.code ?? state.codeError ? "border-[#D9583C]" : "border-[#EADFD0]"}`}
      />
      {(errors.code ?? state.codeError) && <p id="activate-code-error" className="mb-[14px] -mt-[10px] text-[12.5px] font-bold text-[#D9583C]">{errors.code ?? state.codeError}</p>}

      <label htmlFor="activate-email" className={`${labelClasses} mb-2 block`}>
        EMAIL
      </label>
      <input
        id="activate-email"
        name="email"
        type="email"
        value={email}
        onChange={handleEmailChange}
        placeholder="correo@ejemplo.com"
        aria-invalid={Boolean(errors.email ?? state.emailError)}
        aria-describedby={errors.email ?? state.emailError ? "activate-email-error" : undefined}
        className={`mb-[18px] w-full rounded-[14px] border-[1.5px] bg-white px-4 py-[14px] text-[15px] text-[#3F362E] outline-none placeholder:text-[#B6A99B] ${errors.email ?? state.emailError ? "border-[#D9583C]" : "border-[#EADFD0]"}`}
      />
      {(errors.email ?? state.emailError) && <p id="activate-email-error" className="mb-[14px] -mt-[10px] text-[12.5px] font-bold text-[#D9583C]">{errors.email ?? state.emailError}</p>}

      <label htmlFor="activate-password" className={`${labelClasses} mb-2 block`}>
        CREAR CONTRASEÑA
      </label>
      <input
        id="activate-password"
        name="password"
        type="password"
        value={password}
        onChange={handlePasswordChange}
        placeholder="••••••••"
        aria-invalid={Boolean(errors.password ?? state.passwordError)}
        aria-describedby={errors.password ?? state.passwordError ? "activate-password-error" : undefined}
        className={`mb-[18px] w-full rounded-[14px] border-[1.5px] bg-white px-4 py-[14px] text-[15px] text-[#3F362E] outline-none placeholder:text-[#B6A99B] ${errors.password ?? state.passwordError ? "border-[#D9583C]" : "border-[#F2A78E]"}`}
      />
      {(errors.password ?? state.passwordError) && <p id="activate-password-error" className="mb-[14px] -mt-[10px] text-[12.5px] font-bold text-[#D9583C]">{errors.password ?? state.passwordError}</p>}

      {/*  -----  autorización de fotos (estática, marcada)  -----  */}
      <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-[14px] bg-[#FBF1D6] px-4 py-[14px]">
        <span className="mt-px flex size-6 flex-none items-center justify-center rounded-lg bg-[#5FB97E]">
          {checkIcon}
        </span>
        <span className="text-[14px] leading-[1.45] text-[#8A7234]">
          Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app.
        </span>
      </label>

      <SubmitButton />

      <p className="mt-[22px] text-center text-[14.5px] text-[#94887B]">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-extrabold text-[#C5503A]">
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
};

export default ActivateForm;
