import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
});

/** Error de la API con el código HTTP y un mensaje listo para mostrar. */
export class ErrorApi extends Error {
  readonly status: number;
  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.status = status;
  }
}

/** Convierte un error de axios (cuerpo de Nest: { message: string | string[] }) en ErrorApi. */
export function aErrorApi(error: unknown): ErrorApi {
  if (!axios.isAxiosError(error)) {
    return new ErrorApi(0, error instanceof Error ? error.message : "Ocurrió un error inesperado.");
  }
  if (!error.response) {
    return new ErrorApi(0, "No pudimos conectarnos con el servidor. Intentá de nuevo.");
  }
  const { status, data } = error.response;
  const message = (data as { message?: unknown } | null)?.message;
  const mensajes = (Array.isArray(message) ? message : [message])
    .filter((m): m is string => typeof m === "string" && m.length > 0)
    // Nest antepone el objeto anidado: "damnificado.El nombre es obligatorio".
    .map((m) => m.replace(/^\w+\./, ""));
  if (mensajes.length) return new ErrorApi(status, mensajes.join(". "));
  return new ErrorApi(
    status,
    status >= 500 ? "El servidor tuvo un problema. Intentá de nuevo." : "No se pudo completar la operación.",
  );
}
