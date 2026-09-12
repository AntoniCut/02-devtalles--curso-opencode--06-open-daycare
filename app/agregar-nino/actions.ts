/*
    *  -------------------------------------------------------  *
    *  -----  actions.ts  --  /app/agregar-nino/actions.ts  -----  *
    *  -------------------------------------------------------  *
*/
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

/** - `estado que devuelve la Server Action de guardar niño al formulario` */
export interface AddKidState {
  error: string | null;
}

/**
 * --------------------------------
 * -----  `addKid()`  -----
 * --------------------------------
 * - Server Action que inserta el niño en `public.children` con el client server
 * - de Supabase (RLS: policy INSERT para authenticated).
 * - En error devuelve `AddKidState` para que el formulario lo muestre inline;
 * - al éxito redirige a `/kids`.
 */
export const addKid = async (_prevState: AddKidState, formData: FormData): Promise<AddKidState> => {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const birthDate = String(formData.get("birthDate") ?? ""); // dd/mm/aaaa
  const roomId = String(formData.get("roomId") ?? "");
  const allergies = String(formData.get("allergies") ?? "");

  //  -----  birth_date en formato ISO para la columna date  -----
  const [day, month, year] = birthDate.split("/");
  const isoBirthDate = day && month && year ? `${year}-${month}-${day}` : "";

  if (!fullName || !isoBirthDate || !roomId) {
    return { error: "Completá los campos requeridos." };
  }

  //  -----  alergias: texto libre separado por comas → text[]  -----
  const allergyTags: string[] = allergies
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "");

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const today: string = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("children").insert({
    room_id: roomId,
    full_name: fullName,
    birth_date: isoBirthDate,
    enrolled_at: today,
    allergy_tags: allergyTags,
  });

  if (error) {
    return { error: "No se pudo guardar el niño. Intentá de nuevo." };
  }

  redirect("/kids");
};
