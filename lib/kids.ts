/*
    *  ---------------------------------------  *
    *  -----  kids.ts  --  /lib/kids.ts  -----  *
    *  ---------------------------------------  *
*/

/** - `niño tal como viene de la tabla children de Supabase (join con rooms)` */
export interface ChildRow {
  id: string;
  room_id: string;
  full_name: string;
  birth_date: string;
  enrolled_at: string | null;
  medical_notes: string | null;
  allergy_tags: string[];
  room_name: string;
}

/** - `estado de vinculación de un padre` */
export type ParentStatus = "active" | "pending";

/** - `padre vinculado al niño` */
export interface LinkedParent {
  name: string;
  relation: string; // "Mamá" | "Papá"
  status: ParentStatus; // active → badge ACTIVA · pending → "invitación enviada"
  initial: string;
  background: string;
  color: string;
}

/** - `etiqueta opcional de la tarjeta (MANÍ, LACTOSA, VINCULAR)` */
export interface KidTag {
  label: string;
  variant: "alert" | "invite"; // mapa de colores en kid-card.tsx
}

/** - `niño de la sala` */
export interface Kid {
  slug: string;
  name: string;
  age: string;
  initial: string;
  background: string;
  color: string;
  tag?: KidTag; // si no existe, se muestra el chevron ">"
  allergyNote?: string; // si existe, se muestra la tarjeta roja de alergias
  birthDate: string;
  classroom: string;
  entry: string;
  parents: LinkedParent[];
}

/** - `niños de la sala (los 8 del mockup)` */
/** - `salas hardcodeadas del daycare (select de agregar niño)` */
export const classrooms: string[] = ["Soles", "Estrellas", "Lunas"];

/** - `niños de la sala (los 8 del mockup)` */
export const kids: Kid[] = [
  {
    slug: "mateo-fernandez",
    name: "Mateo Fernández",
    age: "3 años",
    initial: "M",
    background: "#A9D9E8",
    color: "#1F7A93",
    tag: { label: "MANÍ", variant: "alert" },
    allergyNote: "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    birthDate: "12 mar 2022",
    classroom: "Soles",
    entry: "feb 2025",
    parents: [
      { name: "Lucía Fernández", relation: "Mamá", status: "active", initial: "L", background: "#C9B6E8", color: "#FFFFFF" },
      { name: "Diego Fernández", relation: "Papá", status: "pending", initial: "D", background: "#A9C7E8", color: "#FFFFFF" },
    ],
  },
  {
    slug: "sofia-mendez",
    name: "Sofía Méndez",
    age: "2 años",
    initial: "S",
    background: "#F4B8CC",
    color: "#C44A7A",
    birthDate: "3 ago 2023",
    classroom: "Soles",
    entry: "mar 2025",
    parents: [
      { name: "Paula Méndez", relation: "Mamá", status: "active", initial: "P", background: "#F4B8CC", color: "#FFFFFF" },
    ],
  },
  {
    slug: "benjamin-ruiz",
    name: "Benjamín Ruiz",
    age: "3 años",
    initial: "B",
    background: "#B9DEC4",
    color: "#3E8B62",
    birthDate: "28 ene 2022",
    classroom: "Soles",
    entry: "feb 2025",
    parents: [
      { name: "Marcela Ruiz", relation: "Mamá", status: "active", initial: "M", background: "#B9DEC4", color: "#FFFFFF" },
      { name: "Andrés Ruiz", relation: "Papá", status: "active", initial: "A", background: "#A9D9E8", color: "#FFFFFF" },
    ],
  },
  {
    slug: "valentina-soto",
    name: "Valentina Soto",
    age: "2 años",
    initial: "V",
    background: "#F4DC8E",
    color: "#9A7B1E",
    tag: { label: "VINCULAR", variant: "invite" },
    birthDate: "15 sep 2023",
    classroom: "Soles",
    entry: "abr 2025",
    parents: [],
  },
  {
    slug: "tomas-diaz",
    name: "Tomás Díaz",
    age: "3 años",
    initial: "T",
    background: "#C9B6E8",
    color: "#7B5FC0",
    tag: { label: "LACTOSA", variant: "alert" },
    allergyNote: "Intolerancia a la lactosa. Tomar leche deslactosada.",
    birthDate: "9 nov 2022",
    classroom: "Soles",
    entry: "feb 2025",
    parents: [
      { name: "Jorge Díaz", relation: "Papá", status: "active", initial: "J", background: "#C9B6E8", color: "#FFFFFF" },
    ],
  },
  {
    slug: "emma-castro",
    name: "Emma Castro",
    age: "2 años",
    initial: "E",
    background: "#F4B8CC",
    color: "#C44A7A",
    birthDate: "22 jun 2023",
    classroom: "Soles",
    entry: "mar 2025",
    parents: [
      { name: "Valeria Castro", relation: "Mamá", status: "active", initial: "V", background: "#F4DC8E", color: "#FFFFFF" },
    ],
  },
  {
    slug: "lucas-romero",
    name: "Lucas Romero",
    age: "3 años",
    initial: "L",
    background: "#A9D9E8",
    color: "#1F7A93",
    birthDate: "4 may 2022",
    classroom: "Soles",
    entry: "feb 2025",
    parents: [
      { name: "Martín Romero", relation: "Papá", status: "active", initial: "M", background: "#A9C7E8", color: "#FFFFFF" },
    ],
  },
  {
    slug: "olivia-vega",
    name: "Olivia Vega",
    age: "2 años",
    initial: "O",
    background: "#B9DEC4",
    color: "#3E8B62",
    birthDate: "30 dic 2023",
    classroom: "Soles",
    entry: "abr 2025",
    parents: [
      { name: "Carla Vega", relation: "Mamá", status: "active", initial: "C", background: "#C9B6E8", color: "#FFFFFF" },
    ],
  },
];

/** - `meses en español para formatear fechas (feb 2025, 12 mar 2022)` */
const monthsEs: string[] = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** - `paleta de avatares (fondo + texto) asignada por hash del nombre` */
const avatarPalette: Array<{ background: string; color: string }> = [
  { background: "#A9D9E8", color: "#1F7A93" },
  { background: "#F4B8CC", color: "#C44A7A" },
  { background: "#B9DEC4", color: "#3E8B62" },
  { background: "#F4DC8E", color: "#9A7B1E" },
  { background: "#C9B6E8", color: "#7B5FC0" },
];

/**
 * ----------------------------------
 * -----  `slugify(fullName)`  -----
 * ----------------------------------
 * - Convierte "Mateo Fernández" en "mateo-fernandez" (ASCII, kebab-case).
 */
export const slugify = (fullName: string): string =>
  fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * ------------------------------------------------
 * -----  `ageFromBirthDate(birthDate)`  -----
 * ------------------------------------------------
 * - Edad en años completos ("3 años" / "1 año"); nunca negativa.
 */
export const ageFromBirthDate = (birthDate: string): string => {
  const today: Date = new Date();
  const birth: Date = new Date(`${birthDate}T00:00:00`);
  let years: number = today.getFullYear() - birth.getFullYear();
  const beforeBirthday: boolean =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) {
    years -= 1;
  }
  if (years < 0) {
    years = 0;
  }
  return years === 1 ? "1 año" : `${years} años`;
};

/**
 * ---------------------------------------------------
 * -----  `formatDateEs(date, withDay)`  -----
 * ---------------------------------------------------
 * - Formatea "2022-03-12" como "12 mar 2022" (withDay) o "mar 2022".
 */
export const formatDateEs = (date: string, withDay: boolean): string => {
  const [, month, day] = date.split("-").map(Number);
  const monthLabel: string = monthsEs[month - 1];
  return withDay ? `${day} ${monthLabel} ${date.slice(0, 4)}` : `${monthLabel} ${date.slice(0, 4)}`;
};

/**
 * ------------------------------------------
 * -----  `avatarFor(fullName)`  -----
 * ------------------------------------------
 * - Colores de avatar determinísticos según el nombre (paleta del mockup).
 */
export const avatarFor = (fullName: string): { background: string; color: string } => {
  let hash: number = 0;
  for (let i = 0; i < fullName.length; i += 1) {
    hash = (hash * 31 + fullName.charCodeAt(i)) % 100000;
  }
  return avatarPalette[hash % avatarPalette.length];
};

/**
 * ------------------------------------------------------
 * -----  `mapDbChildToKid(child)`  -----
 * ------------------------------------------------------
 * - Mapea una fila de children (join rooms) al modelo Kid de la UI.
 * - Los padres no existen en DB (SPEC 05): siempre parents: [].
 */
export const mapDbChildToKid = (child: ChildRow): Kid => ({
  slug: slugify(child.full_name),
  name: child.full_name,
  age: ageFromBirthDate(child.birth_date),
  initial: child.full_name.trim().charAt(0).toUpperCase(),
  background: avatarFor(child.full_name).background,
  color: avatarFor(child.full_name).color,
  tag: child.allergy_tags[0] ? { label: child.allergy_tags[0].toUpperCase(), variant: "alert" } : undefined,
  allergyNote: child.medical_notes ?? undefined,
  birthDate: formatDateEs(child.birth_date, true),
  classroom: child.room_name,
  entry: child.enrolled_at ? formatDateEs(child.enrolled_at, false) : "—",
  parents: [],
});
