export interface Credenciales {
  email: string;
  password: string;
}

export type CampoCredenciales = keyof Credenciales;
export type ErroresCredenciales = Partial<Record<CampoCredenciales, string>>;

const email_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizarCredenciales(credenciales: Credenciales): Credenciales {
  return {
    email: credenciales.email.trim().toLowerCase(),
    password: credenciales.password,
  };
}

export function validarCredenciales(credenciales: Credenciales): ErroresCredenciales {
  const { email, password } = normalizarCredenciales(credenciales);
  const errores: ErroresCredenciales = {};

  if (!email) {
    errores.email = "Ingresá tu email.";
  } else if (!email_VALIDO.test(email)) {
    errores.email = "Ingresá un email válido.";
  }

  if (!password) {
    errores.password = "Ingresá tu contraseña.";
  }

  return errores;
}

export function tieneErrores(errores: ErroresCredenciales): boolean {
  return Object.keys(errores).length > 0;
}
