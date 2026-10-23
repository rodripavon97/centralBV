import { pedir } from "@/lib/http";
import type { Sesion, Usuario } from "@/lib/sesion";

/** POST /auth/login del back (US02). */
export async function iniciarSesion(email: string, password: string): Promise<Sesion> {
  const { access_token, user } = await pedir<{ access_token: string; user: Usuario }>("/auth/login", {
    metodo: "POST",
    cuerpo: { email, password },
    publico: true,
  });
  return { token: access_token, usuario: user };
}

/** Por ahora el front solo tiene el módulo de constancias (rol ADMINISTRATIVO). */
export const ROL_CONSTANCIAS = "ADMINISTRATIVO";
