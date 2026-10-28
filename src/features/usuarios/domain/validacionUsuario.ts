import type { RolUsuario } from "./usuario";

export interface ValoresUsuario {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol: RolUsuario | "";
}

export interface DatosUsuario {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  /** Nombre del rol como lo espera el back, en minúsculas. */
  roleName: RolUsuario;
}

export type CampoUsuario = keyof ValoresUsuario;
export type ErroresUsuario = Partial<Record<CampoUsuario, string>>;

export const CAMPOS_USUARIO: CampoUsuario[] = ["nombre", "apellido", "email", "password", "rol"];

export const VALORES_VACIOS: ValoresUsuario = {
  nombre: "",
  apellido: "",
  email: "",
  password: "",
  rol: "",
};

// Mismas reglas que CreateUserDto en centralBV_Back.
const SOLO_LETRAS = /^[A-Za-záéíóúÁÉÍÓÚñÑüÜ\s]+$/;
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ReglaContrasena {
  id: string;
  etiqueta: string;
  cumple: (password: string) => boolean;
}

/** Requisitos de la contraseña temporal, evaluados en vivo en el formulario. */
export const REGLAS_CONTRASENA: ReglaContrasena[] = [
  { id: "longitud", etiqueta: "8 o más caracteres", cumple: (password) => password.length >= 8 },
  { id: "mayuscula", etiqueta: "Una mayúscula", cumple: (password) => /[A-Z]/.test(password) },
  { id: "minuscula", etiqueta: "Una minúscula", cumple: (password) => /[a-z]/.test(password) },
  { id: "numero", etiqueta: "Un número", cumple: (password) => /\d/.test(password) },
];

export const cumpleContrasena = (password: string): boolean =>
  REGLAS_CONTRASENA.every((regla) => regla.cumple(password));

export function validarUsuario(valores: ValoresUsuario): ErroresUsuario {
  const errores: ErroresUsuario = {};
  const nombre = valores.nombre.trim();
  const apellido = valores.apellido.trim();
  const email = valores.email.trim();

  if (!nombre) errores.nombre = "Ingresá el nombre.";
  else if (!SOLO_LETRAS.test(nombre)) errores.nombre = "El nombre solo puede contener letras y espacios.";

  if (!apellido) errores.apellido = "Ingresá el apellido.";
  else if (!SOLO_LETRAS.test(apellido)) errores.apellido = "El apellido solo puede contener letras y espacios.";

  if (!email) errores.email = "Ingresá el correo electrónico.";
  else if (!EMAIL_VALIDO.test(email)) errores.email = "Ingresá un correo electrónico válido.";

  if (!valores.password) {
    errores.password = "Ingresá una contraseña temporal.";
  } else if (!cumpleContrasena(valores.password)) {
    errores.password = "La contraseña debe tener 8 caracteres o más, una mayúscula, una minúscula y un número.";
  }

  if (!valores.rol) errores.rol = "Seleccioná un rol.";

  return errores;
}

/** Normaliza los valores del formulario al cuerpo que espera POST /users. */
export function datosDesdeValores(valores: ValoresUsuario): DatosUsuario {
  return {
    nombre: valores.nombre.trim(),
    apellido: valores.apellido.trim(),
    email: valores.email.trim().toLowerCase(),
    password: valores.password,
    roleName: valores.rol as RolUsuario,
  };
}
