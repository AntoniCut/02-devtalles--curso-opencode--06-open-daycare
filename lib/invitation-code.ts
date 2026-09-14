/*
    *  -------------------------------------------------------  *
    *  -----  invitation-code.ts  --  /lib/invitation-code.ts  -----  *
    *  -------------------------------------------------------  *
*/

/** - `alfabeto del código de invitación (sin 0/O/1/I para evitar confusiones)` */
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** - `longitud del código de invitación (ej. 7K4P9)` */
export const CODE_LENGTH = 5;

/** - `formato válido de un código de invitación` */
export const CODE_PATTERN = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);

/**
 * ----------------------------------------
 * -----  `generateInvitationCode()`  -----
 * ----------------------------------------
 * - Código aleatorio de 5 caracteres criptográficamente seguro.
 */
export const generateInvitationCode = (): string => {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
};
