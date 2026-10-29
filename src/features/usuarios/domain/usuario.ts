/* Datos de usuarios y roles. El back devuelve los roles en mayúsculas
   (ADMIN, ADMINISTRATIVO, AUTOMOTORES, COMUN), pero al crear un usuario
   espera el nombre en minúsculas. */

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  activo: boolean;
  roles: string[];
}

export interface PaginaUsuarios {
  items: Usuario[];
  total: number;
}

/** Roles que se pueden asignar desde el formulario de alta. */
export const ROLES_USUARIO = [
  { valor: "admin", etiqueta: "Administrador general" },
  { valor: "administrativo", etiqueta: "Administrativo" },
  { valor: "automotores", etiqueta: "Administrador de móviles" },
  { valor: "comun", etiqueta: "Inspector" },
] as const;

export type RolUsuario = (typeof ROLES_USUARIO)[number]["valor"];

const ETIQUETAS_POR_ROL: Record<string, string> = Object.fromEntries(
  ROLES_USUARIO.map(({ valor, etiqueta }) => [valor.toUpperCase(), etiqueta]),
);

/* Prioridad para elegir el rol que se muestra en la tabla. Un administrativo
   también hereda COMUN en el back, pero en la lista debe verse "Administrativo". */
const PRIORIDAD_ROLES = ["ADMIN", "ADMINISTRATIVO", "AUTOMOTORES", "COMUN"];

export function rolPrincipal(roles: string[]): string {
  return PRIORIDAD_ROLES.find((rol) => roles.includes(rol)) ?? roles[0] ?? "";
}

/** Etiqueta visible del rol principal de un usuario. */
export function etiquetaRol(roles: string[]): string {
  const principal = rolPrincipal(roles);
  if (!principal) return "Sin rol";
  return ETIQUETAS_POR_ROL[principal.toUpperCase()] ?? principal;
}
