import axios from "axios";
import { http } from "@/lib/http";
import type { Credenciales } from "@/features/auth/domain/credenciales";

export interface RespuestaLogin {
  token: string;
}

export async function iniciarSesion(credenciales: Credenciales): Promise<RespuestaLogin> {
  const { data } = await http.post<RespuestaLogin>("/auth/login", {
    email: credenciales.email,
    password: credenciales.password,
  });

  return data;
}

export function esErrorDeCredenciales(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;

  const status = error.response?.status;
  return status === 400 || status === 401 || status === 403;
}
