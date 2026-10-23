import { cerrarSesion, leerSesion } from "./sesion";

/* Cliente HTTP del back (NestJS). La URL sale de VITE_API_URL
   (ver .env.example); por defecto, el back local en el puerto 3000. */
export const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

export class ErrorApi extends Error {
  readonly status: number;
  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.status = status;
  }
}

type Valor = string | number | undefined | null;

interface Opciones {
  metodo?: "GET" | "POST" | "PUT" | "PATCH";
  cuerpo?: unknown;
  query?: Record<string, Valor>;
  /** El login no manda token ni redirige ante un 401. */
  publico?: boolean;
}

/** Arma el mensaje a partir del error de Nest: { message: string | string[] }. */
function mensajeDeError(cuerpo: unknown, status: number): string {
  const message = (cuerpo as { message?: unknown } | null)?.message;
  const mensajes = (Array.isArray(message) ? message : [message])
    .filter((m): m is string => typeof m === "string" && m.length > 0)
    // Nest antepone el objeto anidado: "damnificado.El nombre es obligatorio".
    .map((m) => m.replace(/^\w+\./, ""));
  if (mensajes.length) return mensajes.join(". ");
  return status >= 500 ? "El servidor tuvo un problema. Intentá de nuevo." : "No se pudo completar la operación.";
}

export async function pedir<T>(ruta: string, { metodo = "GET", cuerpo, query, publico }: Opciones = {}): Promise<T> {
  const url = new URL(API_URL + ruta);
  for (const [clave, valor] of Object.entries(query ?? {})) {
    if (valor !== undefined && valor !== null && valor !== "") url.searchParams.set(clave, String(valor));
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (cuerpo !== undefined) headers["Content-Type"] = "application/json";
  const sesion = publico ? null : leerSesion();
  if (sesion) headers.Authorization = `Bearer ${sesion.token}`;

  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ErrorApi(0, "No se pudo conectar con el servidor. Revisá tu conexión.");
  }

  const texto = await respuesta.text();
  let datos: unknown = null;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    if (respuesta.ok) throw new ErrorApi(respuesta.status, "El servidor devolvió una respuesta inválida.");
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401 && !publico) {
      // Token vencido o inválido: volver al login avisando que expiró.
      cerrarSesion();
      const volver = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.assign(`/login?expirada=1&volver=${volver}`);
    }
    throw new ErrorApi(respuesta.status, mensajeDeError(datos, respuesta.status));
  }
  return datos as T;
}
