import axios from "axios";
import { ErrorApi, http } from "@/lib/http";
import type { Credenciales } from "@/features/auth/domain/credenciales";

export interface RespuestaLogin {
  token: string;
}

export interface RespuestaMensaje {
  message: string;
}

export interface DatosRestablecerContrasena {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// Lo que devuelve POST /auth/login en centralBV_back (AuthService.login).
interface RespuestaLoginApi {
  access_token: string;
  user: { id: string; nombre: string; email: string; roles: string[] };
}

export async function iniciarSesion(credenciales: Credenciales): Promise<RespuestaLogin> {
  const { data } = await http.post<RespuestaLoginApi>("/auth/login", {
    email: credenciales.email,
    password: credenciales.password,
  });

  return { token: data.access_token };
}

export function esErrorDeCredenciales(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;

  const status = error.response?.status;
  return status === 400 || status === 401 || status === 403;
}

/** US03: pide el enlace de recuperación. El back responde igual exista o no el correo. */
export async function solicitarEnlaceRecuperacion(email: string): Promise<RespuestaMensaje> {
  const { data } = await http.post<RespuestaMensaje>("/auth/forgot-password", { email });
  return data;
}

/** US03: restablece la contraseña con el token que vino en el enlace del correo. */
export async function restablecerContrasena(
  datos: DatosRestablecerContrasena,
): Promise<RespuestaMensaje> {
  const { data } = await http.post<RespuestaMensaje>("/auth/reset-password", {
    token: datos.token,
    newPassword: datos.newPassword,
    confirmPassword: datos.confirmPassword,
  });

  return data;
}

/** El enlace venció (2 horas) o ya se usó: el back responde 400 con ese aviso. */
export function esErrorDeEnlace(error: unknown): boolean {
  return (
    error instanceof ErrorApi &&
    (error.status === 400 || error.status === 401) &&
    /enlace|expirado|utilizado/i.test(error.message)
  );
}

/** La contraseña nueva es igual a la anterior (lo valida Supabase Auth). */
export function esErrorDeContrasenaIgual(error: unknown): boolean {
  return error instanceof ErrorApi && /igual a la anterior/i.test(error.message);
}

/** El back también valida que las dos contraseñas coincidan. */
export function esErrorDeConfirmacion(error: unknown): boolean {
  return error instanceof ErrorApi && /no coinciden/i.test(error.message);
}
