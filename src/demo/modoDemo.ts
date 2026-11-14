import { borrarToken, guardarToken } from "@/features/auth/session";
import { TODOS_LOS_ROLES, tokenSimulado, type EstadoBackend } from "./backSimulado";
import { datosDeEjemplo, USUARIO_DEMO } from "./datosEjemplo";

/* Modo demo (US58): se entra por /demo, no pide login y no toca el back real.
   Todo lo que se crea o edita queda en localStorage de este navegador. */

export const CLAVE_DEMO = "centralbv.demo";
export const CLAVE_DATOS_DEMO = "centralbv.demo.datos";
export const MENSAJE_SIN_MAILS = "En modo demo no se envían mails.";

/** Si cambia la forma de los datos, subir la versión descarta lo guardado y vuelve a los de ejemplo. */
const VERSION_DATOS = 1;

/** La sesión demo dura 30 días: no vence en medio de la presentación. */
const VIDA_SESION_DEMO_S = 30 * 24 * 60 * 60;

function leer(clave: string): string | null {
  try {
    return window.localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function escribir(clave: string, valor: string): void {
  try {
    window.localStorage.setItem(clave, valor);
  } catch {
    // Sin espacio o storage bloqueado: la demo sigue en memoria hasta recargar.
  }
}

export function esModoDemo(): boolean {
  return leer(CLAVE_DEMO) === "1";
}

export function tokenDemo(): string {
  return tokenSimulado(TODOS_LOS_ROLES, VIDA_SESION_DEMO_S, { sub: USUARIO_DEMO.id, nombre: USUARIO_DEMO.nombre });
}

const esLista = (valor: unknown) => Array.isArray(valor);
const esObjeto = (valor: unknown) => typeof valor === "object" && valor !== null && !Array.isArray(valor);

/** Chequeo de forma: si algo no cierra, se descartan los datos guardados. */
function esEstadoValido(valor: unknown): valor is EstadoBackend {
  if (!esObjeto(valor)) return false;
  const e = valor as Record<string, unknown>;
  return (
    ["moviles", "tipos", "marcas", "modelos", "solicitudes", "usuarios", "rolesDeLogin"].every((clave) => esLista(e[clave])) &&
    ["revisiones", "compartimentos", "usuarioActual"].every((clave) => esObjeto(e[clave])) &&
    ["siguienteCompartimento", "siguienteMovil", "siguienteSolicitud"].every((clave) => typeof e[clave] === "number")
  );
}

export function guardarEstadoDemo(estado: EstadoBackend): void {
  escribir(CLAVE_DATOS_DEMO, JSON.stringify({ version: VERSION_DATOS, estado }));
}

/** Datos de la demo. Si no hay o no se pueden leer, carga (y guarda) los de ejemplo. */
export function cargarEstadoDemo(): EstadoBackend {
  const guardado = leer(CLAVE_DATOS_DEMO);
  if (guardado) {
    try {
      const { version, estado } = JSON.parse(guardado) as { version?: unknown; estado?: unknown };
      if (version === VERSION_DATOS && esEstadoValido(estado)) return estado;
    } catch {
      // JSON roto: se reemplaza por los datos de ejemplo.
    }
  }
  const nuevo = datosDeEjemplo();
  guardarEstadoDemo(nuevo);
  return nuevo;
}

/** Entra al modo demo: flag, sesión del usuario demo con todos los roles y datos de ejemplo si no hay. */
export function activarModoDemo(): void {
  escribir(CLAVE_DEMO, "1");
  guardarToken(tokenDemo());
  cargarEstadoDemo();
}

/** Acciones del navegador que los tests reemplazan (jsdom no recarga la página). */
export const navegador = {
  recargar: () => window.location.reload(),
};

/** Vuelve a los datos de ejemplo. */
export function reiniciarDatosDemo(): void {
  guardarEstadoDemo(datosDeEjemplo());
}

/** Sale del modo demo: borra el flag, la sesión y los datos. */
export function salirModoDemo(): void {
  try {
    window.localStorage.removeItem(CLAVE_DEMO);
    window.localStorage.removeItem(CLAVE_DATOS_DEMO);
    borrarToken();
  } catch {
    // Storage bloqueado: no hay nada que borrar.
  }
}
