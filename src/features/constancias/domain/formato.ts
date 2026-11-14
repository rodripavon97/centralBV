import type { DestinoConstancia, EstadoPago, EstadoSolicitud, MetodoPago, TipoSiniestro } from "@/types/dominio";
import { formatearFecha, formatearHora } from "@/lib/fecha";

export {
  ahora,
  fechaAISO,
  fechaDesdeISO,
  formatearFecha,
  formatearHora,
  hoy,
  horaActual,
  parsearFecha,
  parsearHora,
} from "@/lib/fecha";

export const TIPOS_SINIESTRO: Record<TipoSiniestro, string> = {
  vivienda: "Vivienda",
  vehicular: "Vehículo",
};

export const DESTINOS_CONSTANCIA: Record<DestinoConstancia, string> = {
  seguro: "Seguro",
  accion_social: "Acción social",
};

export const ESTADOS_SOLICITUD: Record<EstadoSolicitud, string> = {
  pendiente: "Pendiente",
  constancia_generada: "Constancia generada",
  firmada: "Firmada",
  entregada: "Entregada",
  cancelada: "Cancelada",
};

export const ESTADOS_PAGO: Record<EstadoPago, string> = {
  pendiente: "Pendiente",
  abonado: "Abonado",
  exento: "Exento",
};

export const METODOS_PAGO: Record<MetodoPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  debito: "Débito",
  credito: "Crédito",
};

const MESES = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
] as const;

/** "30112456" → "30.112.456" */
export function formatearDni(dni: string) {
  return dni.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** 12000 → "12.000", 1500.5 → "1.500,50" (sin el signo, para los campos de importe). */
export function formatearImporte(monto: number) {
  const [entero, decimales] = monto.toFixed(2).split(".");
  const miles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${miles}${decimales === "00" ? "" : `,${decimales}`}`;
}

/** 12000 → "$ 12.000", 1500.5 → "$ 1.500,50" */
export function formatearMonto(monto: number) {
  return `$ ${formatearImporte(monto)}`;
}

/** "2026-10-11", "18:20" → "11/10/2026 18:20" */
export function formatearFechaHora(fecha: string, hora: string) {
  return `${formatearFecha(fecha)} ${formatearHora(hora)}`;
}

/** Instante ISO del back → "17/10/2026 11:05" en hora de Argentina. */
export function formatearInstante(iso: string) {
  const fecha = new Date(iso).toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });
  const hora = new Date(iso).toLocaleTimeString("sv-SE", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
  });
  return formatearFechaHora(fecha, hora);
}

/** "JOSÉ C. PAZ, 12 DE OCTUBRE DE 2026." con la fecha de hoy en Argentina. */
export function fechaEmision(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(fecha);
  const valor = (tipo: Intl.DateTimeFormatPartTypes) => Number(partes.find((p) => p.type === tipo)?.value);
  return `JOSÉ C. PAZ, ${valor("day")} DE ${MESES[valor("month") - 1]} DE ${valor("year")}.`;
}
