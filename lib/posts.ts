/*
    *  -------------------------------------------  *
    *  -----  posts.ts  --  /lib/posts.ts  -----  *
    *  -------------------------------------------  *
*/

import { avatarFor } from "@/lib/kids";

/** - `zona horaria de la guardería para fechas y horas del feed` */
const TIME_ZONE = "America/Argentina/Buenos_Aires";

/** - `texto alternativo genérico cuando la foto no tiene descripción` */
export const DEFAULT_PHOTO_ALT = "Foto de la publicación";

/** - `máximo de fotos por publicación` */
export const MAX_PHOTOS_PER_POST = 4;

/** - `tamaño máximo por foto (5 MB)` */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** - `tipos de imagen permitidos en el composer (sin HEIC)` */
export const ALLOWED_PHOTO_TYPES: string[] = ["image/jpeg", "image/png", "image/webp"];

/** - `máximo de caracteres de la descripción` */
export const MAX_BODY_LENGTH = 2000;

/** - `tipo de publicación (enum post_type de la DB)` */
export type PostType = "meal" | "nap" | "activity" | "achievement" | "mood" | "photo" | "announcement";

/** - `opción de tipo del composer: label y colores del chip` */
export interface PostTypeOption {
  id: PostType;
  label: string; // "Comida", "Siesta"…
  background: string; // color de fondo del chip
  color: string; // color del texto del chip
}

/** - `tipos del formulario de nueva publicación (los 7 del mockup, con colores exactos)` */
export const postTypeOptions: PostTypeOption[] = [
  { id: "meal", label: "Comida", background: "#9A7B1E", color: "#FFFFFF" },
  { id: "nap", label: "Siesta", background: "#E7DCF6", color: "#7B5FC0" },
  { id: "activity", label: "Actividad", background: "#2E89A6", color: "#FFFFFF" },
  { id: "achievement", label: "Logro", background: "#CFEBD8", color: "#3E9B6C" },
  { id: "mood", label: "Ánimo", background: "#F9D2DE", color: "#C56486" },
  { id: "photo", label: "Foto", background: "#FBD8CC", color: "#D9684A" },
  { id: "announcement", label: "Anuncio", background: "#CCD8F4", color: "#4E72C8" },
];

/** - `configuración visual del badge de tipo de publicación` */
export interface PostTypeBadge {
  label: string;
  color: string;
  background: string;
}

/** - `badge por tipo de publicación (colores del mockup + paleta del composer)` */
export const postTypeBadges: Record<PostType, PostTypeBadge> = {
  meal: { label: "COMIDA", color: "#6B5214", background: "#F4DC8E" },
  nap: { label: "SIESTA", color: "#5A3D9E", background: "#E7DCF6" },
  activity: { label: "ACTIVIDAD", color: "#17607E", background: "#C7E7F1" },
  achievement: { label: "LOGRO", color: "#256B47", background: "#CFEBD8" },
  mood: { label: "ÁNIMO", color: "#A63A5E", background: "#F9D2DE" },
  photo: { label: "FOTO", color: "#A94129", background: "#FBD8CC" },
  announcement: { label: "ANUNCIO", color: "#2E4A93", background: "#CCD8F4" },
};

/** - `niño etiquetado en una publicación, con su avatar determinístico` */
export interface PostChildAvatar {
  id: string;
  name: string;
  initial: string;
  background: string;
  color: string;
}

/** - `foto de una publicación lista para renderizar (URL firmada)` */
export interface FeedPostPhoto {
  path: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
}

/** - `foto que el formulario envía al Server Action (antes de insertarse)` */
export interface PostPhotoInput {
  path: string;
  alt: string;
  width: number | null;
  height: number | null;
}

/** - `publicación del feed ya mapeada para la UI` */
export interface FeedPost {
  id: string;
  type: PostType;
  isMine: boolean;
  authorName: string;
  roomAnnouncement: boolean; // true = "Toda la sala"
  children: PostChildAvatar[];
  body: string;
  publishedAt: string; // ISO
  photos: FeedPostPhoto[];
}

/** - `niño etiquetado con su sala (feed de familia)` */
export interface FamilyPostChild extends PostChildAvatar {
  roomId: string | null;
  roomName: string;
}

/** - `publicación del feed de familia: niños con sala y sala del anuncio` */
export interface FamilyFeedPost extends Omit<FeedPost, "children"> {
  children: FamilyPostChild[];
  roomId: string | null; // sala del anuncio (null en publicaciones de niños)
  roomName: string; // sala a mostrar en el card
}

/** - `niño del padre para los pills y el filtro del feed de familia` */
export interface FamilyChild {
  id: string;
  name: string;
  roomId: string | null;
  roomName: string;
  initial: string;
  background: string;
  color: string;
}

/** - `grupo de publicaciones de un mismo día en el feed` */
export interface PostDayGroup<T extends FeedPost = FeedPost> {
  label: string;
  posts: T[];
}

/**
 * ------------------------------------------------------
 * -----  `childAvatarFor(id, fullName)`  -----
 * ------------------------------------------------------
 * - Avatar determinístico de un niño (paleta de lib/kids.ts).
 */
export const childAvatarFor = (id: string, fullName: string): PostChildAvatar => ({
  id,
  name: fullName,
  initial: fullName.trim().charAt(0).toUpperCase(),
  background: avatarFor(fullName).background,
  color: avatarFor(fullName).color,
});

/**
 * -----------------------------------
 * -----  `firstName(fullName)`  -----
 * -----------------------------------
 * - Primer nombre para títulos y destinatarios ("Mateo Fernández" → "Mateo").
 */
export const firstName = (fullName: string): string => fullName.trim().split(/\s+/)[0] ?? fullName;

/**
 * ------------------------------------------------------------
 * -----  `formatPostTitle(children, roomAnnouncement)`  -----
 * ------------------------------------------------------------
 * - Título del card: "Anuncio general", "Mateo" o "Mateo +2".
 */
export const formatPostTitle = (children: PostChildAvatar[], roomAnnouncement: boolean): string => {
  //  -----  anuncio de sala: no hay niños etiquetados  -----
  if (roomAnnouncement) {
    return "Anuncio general";
  }

  //  -----  sin niños ni sala: fallback (no debería ocurrir)  -----
  if (children.length === 0) {
    return "Publicación";
  }

  //  -----  un niño: su primer nombre  -----
  if (children.length === 1) {
    return firstName(children[0].name);
  }

  //  -----  varios niños: primer nombre + cantidad restante  -----
  return `${firstName(children[0].name)} +${children.length - 1}`;
};

/**
 * ---------------------------------------------------------------
 * -----  `formatRecipientLabel(children, roomAnnouncement)`  -----
 * ---------------------------------------------------------------
 * - Línea "Para": "toda la sala" o "familia de Mateo y Sofía (+1 más)".
 */
export const formatRecipientLabel = (children: PostChildAvatar[], roomAnnouncement: boolean): string => {
  //  -----  anuncio de sala  -----
  if (roomAnnouncement) {
    return "toda la sala";
  }

  //  -----  sin destinatarios: fallback (no debería ocurrir)  -----
  if (children.length === 0) {
    return "sin destinatarios";
  }

  //  -----  un niño  -----
  if (children.length === 1) {
    return `familia de ${firstName(children[0].name)}`;
  }

  //  -----  dos niños  -----
  if (children.length === 2) {
    return `familia de ${firstName(children[0].name)} y ${firstName(children[1].name)}`;
  }

  //  -----  tres o más: los dos primeros + el resto  -----
  return `familia de ${firstName(children[0].name)} y ${firstName(children[1].name)} (+${children.length - 2} más)`;
};

/**
 * --------------------------------
 * -----  `formatPostTime(iso)`  -----
 * --------------------------------
 * - Hora "14:20" en la zona horaria de la guardería.
 */
export const formatPostTime = (iso: string): string =>
  new Intl.DateTimeFormat("es-AR", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));

/**
 * -----------------------------
 * -----  `dayKey(date)`  -----
 * -----------------------------
 * - Clave "YYYY-MM-DD" de una fecha en la zona de la guardería.
 */
const dayKey = (date: Date): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

/**
 * ----------------------------------------
 * -----  `weekdayDateLabel(date)`  -----
 * ----------------------------------------
 * - "martes 17 jun" en mayúsculas y sin puntos (zona horaria de la guardería).
 */
const weekdayDateLabel = (date: Date): string => {
  const label: string = new Intl.DateTimeFormat("es-AR", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(date);

  return label.replace(",", "").replace(/\.$/, "").toUpperCase();
};

/**
 * ----------------------------------------
 * -----  `formatDaySeparator(iso)`  -----
 * ----------------------------------------
 * - Separador del feed de staff: "PUBLICADO HOY", "AYER" o "MARTES 17 JUN".
 */
export const formatDaySeparator = (iso: string): string => {
  const postKey: string = dayKey(new Date(iso));
  const now: Date = new Date();

  //  -----  misma fecha que hoy  -----
  if (postKey === dayKey(now)) {
    return "PUBLICADO HOY";
  }

  //  -----  misma fecha que ayer (Argentina no tiene horario de verano)  -----
  const yesterday: Date = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (postKey === dayKey(yesterday)) {
    return "AYER";
  }

  //  -----  fecha anterior: "martes 17 jun" en mayúsculas  -----
  return weekdayDateLabel(new Date(iso));
};

/**
 * ----------------------------------------------
 * -----  `formatFamilyDaySeparator(iso)`  -----
 * ----------------------------------------------
 * - Separador del feed de familia: "HOY · MARTES 17 JUN", "AYER · …" o la fecha.
 */
export const formatFamilyDaySeparator = (iso: string): string => {
  const postKey: string = dayKey(new Date(iso));
  const now: Date = new Date();
  const dateLabel: string = weekdayDateLabel(new Date(iso));

  //  -----  misma fecha que hoy  -----
  if (postKey === dayKey(now)) {
    return `HOY · ${dateLabel}`;
  }

  //  -----  misma fecha que ayer  -----
  const yesterday: Date = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (postKey === dayKey(yesterday)) {
    return `AYER · ${dateLabel}`;
  }

  //  -----  fecha anterior  -----
  return dateLabel;
};

/**
 * ----------------------------
 * -----  `formatToday()`  -----
 * ----------------------------
 * - Fecha de hoy en la zona de la guardería: "martes 17 jun".
 */
export const formatToday = (): string => {
  const label: string = new Intl.DateTimeFormat("es-AR", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(new Date());

  return label.replace(",", "").replace(/\.$/, "");
};

/**
 * ------------------------------------------------------
 * -----  `groupPostsByDay(posts, separatorFor)`  -----
 * ------------------------------------------------------
 * - Agrupa publicaciones consecutivas por día (el feed llega ordenado desc) con
 * - el formateador de separador indicado (staff por defecto, familia aparte).
 */
export const groupPostsByDay = <T extends FeedPost>(
  posts: T[],
  separatorFor: (iso: string) => string = formatDaySeparator,
): PostDayGroup<T>[] =>
  posts.reduce<PostDayGroup<T>[]>((groups, post) => {
    const label: string = separatorFor(post.publishedAt);
    const lastGroup: PostDayGroup<T> | undefined = groups[groups.length - 1];

    //  -----  mismo día que el grupo anterior: se agrega ahí  -----
    if (lastGroup && lastGroup.label === label) {
      lastGroup.posts.push(post);
      return groups;
    }

    //  -----  día nuevo: se abre un grupo  -----
    groups.push({ label, posts: [post] });
    return groups;
  }, []);

/**
 * ------------------------------
 * -----  `photoAlt(alt)`  -----
 * ------------------------------
 * - Texto alternativo de una foto: el del usuario o el genérico.
 */
export const photoAlt = (alt: string | null): string => (alt && alt.trim() !== "" ? alt : DEFAULT_PHOTO_ALT);
