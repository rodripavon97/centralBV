import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
});

/** Error de la API con el código HTTP y un mensaje listo para mostrar.
    `campo` y `codigo` vienen en los errores por campo del back
    (por ejemplo { campo: "patente", code: "PATENTE_DUPLICADA" }). */
export class ErrorApi extends Error {
  readonly status: number;
  readonly campo?: string;
  readonly codigo?: string;
  constructor(status: number, mensaje: string, detalle: { campo?: string; codigo?: string } = {}) {
    super(mensaje);
    this.status = status;
    this.campo = detalle.campo;
    this.codigo = detalle.codigo;
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
  const cuerpo = data as { message?: unknown; campo?: unknown; code?: unknown } | null;
  const message = cuerpo?.message;
  const detalle = {
    campo: typeof cuerpo?.campo === "string" ? cuerpo.campo : undefined,
    codigo: typeof cuerpo?.code === "string" ? cuerpo.code : undefined,
  };
  const mensajes = (Array.isArray(message) ? message : [message])
    .filter((m): m is string => typeof m === "string" && m.length > 0)
    // Nest antepone el objeto anidado: "damnificado.El nombre es obligatorio".
    .map((m) => m.replace(/^\w+\./, ""));
  if (mensajes.length) return new ErrorApi(status, mensajes.join(". "), detalle);
  return new ErrorApi(
    status,
    status >= 500 ? "El servidor tuvo un problema. Intentá de nuevo." : "No se pudo completar la operación.",
  );
}
