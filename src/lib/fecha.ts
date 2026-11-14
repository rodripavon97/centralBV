import { format, isValid, parse, parseISO } from "date-fns";

/* Utilidades de fecha y hora compartidas basadas en date-fns.
   El formulario trabaja con texto (dd/mm/aaaa y hh:mm) y el back con ISO. */

/** "2026-10-11" → "11/10/2026" */
export function formatearFecha(fecha: string): string {
  const parsed = parseISO(fecha.slice(0, 10));
  return isValid(parsed) ? format(parsed, "dd/MM/yyyy") : "";
}

/** "18:20" → "18:20" (recorta los segundos si el back los manda). */
export function formatearHora(hora: string): string {
  return hora.slice(0, 5);
}

/** Fecha local de hoy como "2026-10-22". */
export function hoy(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/** Fecha y hora local actual como "2026-10-22T09:15". */
export function ahora(): string {
  return format(new Date(), "yyyy-MM-dd'T'HH:mm");
}

/** Hora local actual como "09:15". */
export function horaActual(): string {
  return format(new Date(), "HH:mm");
}

/** "11/10/2026" → "2026-10-11", o null si la fecha no existe. */
export function parsearFecha(texto: string): string | null {
  const trimmed = texto.trim();
  if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) return null;
  const parsed = parse(trimmed, "d/M/yyyy", new Date());
  if (!isValid(parsed)) return null;
  return format(parsed, "yyyy-MM-dd");
}

/** "18:20" → "18:20", o null si la hora no existe. */
export function parsearHora(texto: string): string | null {
  const trimmed = texto.trim();
  if (!/^\d{1,2}:\d{2}$/.test(trimmed)) return null;
  const parsed = parse(trimmed, "H:mm", new Date());
  if (!isValid(parsed)) return null;
  return format(parsed, "HH:mm");
}

/** "2026-10-11" → Date local a las 00:00. */
export function fechaDesdeISO(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const parsed = parse(iso, "yyyy-MM-dd", base);
  return isValid(parsed) ? parsed : null;
}

/** Date local → "2026-10-11". */
export function fechaAISO(fecha: Date): string {
  return format(fecha, "yyyy-MM-dd");
}
