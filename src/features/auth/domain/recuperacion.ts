/* US03: reglas puras de la recuperación de contraseña.
   Los requisitos de la contraseña son los mismos de US01. */

export interface SolicitudRecuperacion {
  email: string;
}

export type ErroresSolicitudRecuperacion = Partial<Record<keyof SolicitudRecuperacion, string>>;

export interface NuevaContrasena {
  nueva: string;
  confirmar: string;
}

export type CampoNuevaContrasena = keyof NuevaContrasena;
export type ErroresNuevaContrasena = Partial<Record<CampoNuevaContrasena, string>>;

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Texto exacto que pide US03 cuando la contraseña nueva repite la anterior. */
export const MENSAJE_CONTRASENA_IGUAL = "La contraseña nueva no puede ser igual a la anterior";

export const MENSAJE_CONTRASENAS_DISTINTAS = "Las contraseñas no coinciden.";

export const TEXTO_REQUISITOS_CONTRASENA =
  "Mínimo 8 caracteres, con al menos una mayúscula, una minúscula y un número.";

export interface ReglaContrasena {
  id: string;
  etiqueta: string;
  cumple: (password: string) => boolean;
}

/** Mismas reglas que US01 y que ResetPasswordDto en centralBV_Back. */
export const REGLAS_CONTRASENA: ReglaContrasena[] = [
  { id: "longitud", etiqueta: "8 o más caracteres", cumple: (password) => password.length >= 8 },
  { id: "mayuscula", etiqueta: "Una mayúscula", cumple: (password) => /[A-Z]/.test(password) },
  { id: "minuscula", etiqueta: "Una minúscula", cumple: (password) => /[a-z]/.test(password) },
  { id: "numero", etiqueta: "Un número", cumple: (password) => /\d/.test(password) },
];

export function cumpleRequisitosContrasena(password: string): boolean {
  return REGLAS_CONTRASENA.every((regla) => regla.cumple(password));
}

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validarSolicitudRecuperacion(
  valores: SolicitudRecuperacion,
): ErroresSolicitudRecuperacion {
  const email = normalizarEmail(valores.email);

  if (!email) return { email: "Ingresá tu correo electrónico." };
  if (!EMAIL_VALIDO.test(email)) return { email: "Ingresá un correo válido." };

  return {};
}

export function validarNuevaContrasena(valores: NuevaContrasena): ErroresNuevaContrasena {
  const errores: ErroresNuevaContrasena = {};

  if (!valores.nueva) {
    errores.nueva = "Ingresá una contraseña nueva.";
  } else if (!cumpleRequisitosContrasena(valores.nueva)) {
    errores.nueva =
      "La contraseña debe tener 8 caracteres o más, una mayúscula, una minúscula y un número.";
  }

  if (!valores.confirmar) {
    errores.confirmar = "Confirmá la nueva contraseña.";
  } else if (valores.confirmar !== valores.nueva) {
    errores.confirmar = MENSAJE_CONTRASENAS_DISTINTAS;
  }

  return errores;
}

export function tieneErroresRecuperacion(errores: object): boolean {
  return Object.keys(errores).length > 0;
}
