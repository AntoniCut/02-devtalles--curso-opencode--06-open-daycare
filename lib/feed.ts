/*
    *  ---------------------------------------  *
    *  -----  feed.ts  --  /lib/feed.ts  -----  *
    *  ---------------------------------------  *
*/

/** - `tipos de publicación del feed, con su badge asociado` */
export type PostType = "achievement" | "activity" | "announcement";

/** - `avatar circular con la inicial del niño` */
export interface PostAvatar {
  initial: string;
  background: string;
  color: string;
}

/** - `publicación del feed de la sala` */
export interface Post {
  id: string;
  type: PostType;
  avatar?: PostAvatar; // announcement usa icono en su lugar
  title: string;
  time: string;
  authorLabel: string;
  recipient: string;
  text: string;
  photoAlt?: string; // si existe, se muestra el placeholder de foto
  likes: number;
  comments: number;
}

/** - `maestra conectada (mock de sesión sin autenticación)` */
export interface CurrentUser {
  name: string;
  initials: string;
  role: string;
}

/** - `datos de la cabecera del home` */
export interface ClassroomInfo {
  label: string;
  childrenCount: number;
  date: string;
}

/** - `maestra conectada` */
export const currentUser: CurrentUser = {
  name: "Caro Giménez",
  initials: "C",
  role: "Maestra · Sala Soles",
};

/** - `información de la sala para el encabezado` */
export const classroom: ClassroomInfo = {
  label: "GUARDERÍA · SALA SOLES",
  childrenCount: 12,
  date: "martes 17 jun",
};

/** - `publicaciones del feed (los 3 posts del mockup)` */
export const posts: Post[] = [
  {
    id: "post-1",
    type: "achievement",
    avatar: { initial: "M", background: "#A9D9E8", color: "#1F7A93" },
    title: "Mateo",
    time: "14:20",
    authorLabel: "publicado por vos",
    recipient: "familia de Mateo",
    text: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    likes: 3,
    comments: 1,
  },
  {
    id: "post-2",
    type: "activity",
    avatar: { initial: "M", background: "#A9D9E8", color: "#1F7A93" },
    title: "Mateo",
    time: "09:40",
    authorLabel: "publicado por vos",
    recipient: "familia de Mateo",
    text: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    photoAlt: "Foto · pintando con témperas",
    likes: 5,
    comments: 2,
  },
  {
    id: "post-3",
    type: "announcement",
    title: "Anuncio general",
    time: "07:50",
    authorLabel: "publicado por vos",
    recipient: "toda la sala",
    text: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    likes: 8,
    comments: 0,
  },
];

/*
    *  -------------------------------------------------------------  *
    *  -----  Crear publicación (pantalla /crear-publicacion)  -----  *
    *  -------------------------------------------------------------  *
*/

/** - `id de los tipos de la pantalla de crear publicación` */
export type CreatePostTypeId = "meal" | "nap" | "activity" | "achievement" | "mood" | "photo" | "announcement";

/** - `opción de tipo de publicación del formulario de crear publicación` */
export interface CreatePostTypeOption {
  id: CreatePostTypeId;
  label: string; // texto del chip, ej. "Comida"
  background: string; // color fijo del chip
  color: string; // color del texto del chip
}

/** - `tipos del formulario de nueva publicación (los 7 del mockup, con colores exactos)` */
export const postTypeOptions: CreatePostTypeOption[] = [
  { id: "meal", label: "Comida", background: "#9A7B1E", color: "#FFFFFF" },
  { id: "nap", label: "Siesta", background: "#E7DCF6", color: "#7B5FC0" },
  { id: "activity", label: "Actividad", background: "#2E89A6", color: "#FFFFFF" },
  { id: "achievement", label: "Logro", background: "#CFEBD8", color: "#3E9B6C" },
  { id: "mood", label: "Ánimo", background: "#F9D2DE", color: "#C56486" },
  { id: "photo", label: "Foto", background: "#FBD8CC", color: "#D9684A" },
  { id: "announcement", label: "Anuncio", background: "#CCD8F4", color: "#4E72C8" },
];
