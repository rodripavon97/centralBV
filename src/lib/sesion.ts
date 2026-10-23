/* Sesión del usuario: el token JWT que devuelve POST /auth/login.
   Se guarda en sessionStorage para que se cierre al cerrar el navegador
   de la PC de la guardia. */

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  roles: string[];
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}

const CLAVE = "centralbv.sesion";

/** Segundos de expiración ("exp") del JWT, o null si no se puede leer. */
function expiracion(token: string): number | null {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload)) as { exp?: number };
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

export function leerSesion(): Sesion | null {
  try {
    const guardada = sessionStorage.getItem(CLAVE);
    if (!guardada) return null;
    const sesion = JSON.parse(guardada) as Sesion;
    const exp = expiracion(sesion.token);
    if (exp !== null && exp * 1000 <= Date.now()) {
      cerrarSesion();
      return null;
    }
    return sesion;
  } catch {
    return null;
  }
}

export function guardarSesion(sesion: Sesion) {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(sesion));
  } catch {
    // Sin almacenamiento disponible la sesión dura lo que dure la pestaña.
  }
}

export function cerrarSesion() {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {
    // nada que limpiar
  }
}
