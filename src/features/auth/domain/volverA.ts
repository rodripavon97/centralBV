/**
 * Destino post-login guardado en el historial al redirigir a /login.
 * Solo acepta rutas internas (path + search + hash) para evitar open redirect.
 */
export function rutaInternaSegura(ruta: unknown): string | undefined {
  if (typeof ruta !== "string" || ruta.length === 0) return undefined;
  if (!ruta.startsWith("/") || ruta.startsWith("//")) return undefined;
  if (ruta.includes("://") || ruta.includes("\\")) return undefined;
  if (/[\u0000-\u001f]/.test(ruta)) return undefined;
  return ruta;
}
