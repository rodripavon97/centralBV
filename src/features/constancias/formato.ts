import type { EstadoSolicitud, TipoSiniestro } from "@/types/dominio";

export const TIPOS_SINIESTRO: Record<TipoSiniestro, string> = {
  incendio_vivienda: "Incendio de vivienda",
  incendio_vehicular: "Incendio vehicular",
  accidente_transito: "Accidente de tránsito",
};

export const ESTADOS_SOLICITUD: Record<EstadoSolicitud, string> = {
  pendiente: "Pendiente",
  constancia_generada: "Constancia generada",
  firmada: "Firmada",
  cancelada: "Cancelada",
};

const dos = (n: number) => String(n).padStart(2, "0");

/** "30112456" → "30.112.456" */
export function formatearDni(dni: string) {
  return dni.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** "2026-10-11" → "11/10/2026" */
export function formatearFecha(fecha: string) {
  const [a, m, d] = fecha.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

/** "2026-10-11T18:20" → "11/10/2026 18:20" */
export function formatearFechaHora(fechaHora: string) {
  return `${formatearFecha(fechaHora)} ${fechaHora.slice(11, 16)}`;
}

/** "11/10/2026 18:20" → "2026-10-11T18:20", o null si no es una fecha válida. */
export function parsearFechaHora(texto: string): string | null {
  const m = texto.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const [d, mes, a, h, min] = m.slice(1).map(Number);
  const fecha = new Date(a, mes - 1, d, h, min);
  if (fecha.getDate() !== d || fecha.getMonth() !== mes - 1 || h > 23 || min > 59) return null;
  return `${a}-${dos(mes)}-${dos(d)}T${dos(h)}:${dos(min)}`;
}

/** Fecha local de hoy como "2026-10-22". */
export function hoy() {
  const d = new Date();
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

/** Fecha y hora local actual como "2026-10-22T09:15". */
export function ahora() {
  const d = new Date();
  return `${hoy()}T${dos(d.getHours())}:${dos(d.getMinutes())}`;
}
