/*
    *  -----------------------------------  *
    *  -----  roles.ts  --  /lib/roles.ts  -----  *
    *  -----------------------------------  *
*/

/** - `roles del enum user_role de la DB` */
export type UserRole = "staff" | "parent" | "admin";

/** - `etiquetas en español de los roles` */
export const ROLE_LABELS: Record<UserRole, string> = {
  staff: "Maestra",
  parent: "Familia",
  admin: "Administrador",
};

/** - `true si el rol es de guardería (staff o admin)` */
export const isStaffRole = (role: UserRole | null): boolean => role === "staff" || role === "admin";

/**
 * ----------------------------------
 * -----  `readRole(value)`  -----
 * ----------------------------------
 * - Normaliza un valor desconocido (claims o metadata) a un rol válido o null.
 */
export const readRole = (value: unknown): UserRole | null =>
  value === "staff" || value === "parent" || value === "admin" ? value : null;

/**
 * ----------------------------------
 * -----  `homeForRole(role)`  -----
 * ----------------------------------
 * - Home de la sección del rol: staff/admin → /staff; padre → /familia.
 */
export const homeForRole = (role: UserRole | null): "/staff" | "/familia" =>
  isStaffRole(role) ? "/staff" : "/familia";

/**
 * ------------------------------------------
 * -----  `sectionForPath(pathname)`  -----
 * ------------------------------------------
 * - Sección a la que pertenece una ruta: /staff, /familia o null (fuera de sección).
 */
export const sectionForPath = (pathname: string): "staff" | "familia" | null => {
  if (pathname === "/staff" || pathname.startsWith("/staff/")) {
    return "staff";
  }
  if (pathname === "/familia" || pathname.startsWith("/familia/")) {
    return "familia";
  }
  return null;
};

/**
 * ------------------------------------------------------------
 * -----  `isPathAllowedForRole(pathname, role)`  -----
 * ------------------------------------------------------------
 * - true si el rol puede navegar la ruta; fuera de las secciones no aplica.
 */
export const isPathAllowedForRole = (pathname: string, role: UserRole | null): boolean => {
  const section = sectionForPath(pathname);

  //  -----  ruta fuera de /staff y /familia (o rol sin resolver): no bloquea  -----
  if (!section || !role) {
    return true;
  }

  return section === "staff" ? isStaffRole(role) : role === "parent";
};

/**
 * ------------------------------------
 * -----  `isInternalPath(path)`  -----
 * ------------------------------------
 * - Solo se aceptan rutas internas como destino next (sin `//`, sin esquema).
 */
export const isInternalPath = (path: string): boolean =>
  path.startsWith("/") && !path.startsWith("//") && !path.includes(":");

/**
 * ---------------------------------------------------
 * -----  `resolvePostAuthPath(role, next)`  -----
 * ---------------------------------------------------
 * - Destino tras autenticarse: `next` solo si es de la sección del rol; si no,
 * - el home del rol.
 */
export const resolvePostAuthPath = (role: UserRole | null, next: string | null): string => {
  if (next && isInternalPath(next) && isPathAllowedForRole(next, role)) {
    return next;
  }

  return homeForRole(role);
};
