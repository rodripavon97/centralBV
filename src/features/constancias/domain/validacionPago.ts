import type { EstadoPago, MetodoPago, Solicitud } from "@/types/dominio";
import { METODOS_PAGO, formatearImporte } from "./formato";

export type CampoPago = "monto" | "metodoPago" | "motivoExento";

/** Valores del formulario tal como los escribe la persona (todo texto). */
export interface ValoresPago {
  estado: EstadoPago;
  monto: string;
  metodoPago: MetodoPago | "";
  motivoExento: string;
}

export type ErroresPago = Partial<Record<CampoPago, string>>;

export interface DatosPago {
  estado: EstadoPago;
  monto?: number;
  metodoPago?: MetodoPago;
  motivoExento?: string;
}

// Orden en que aparecen en el formulario: el foco va al primer error.
export const CAMPOS_PAGO: CampoPago[] = ["monto", "metodoPago", "motivoExento"];

export const MOTIVO_MAX = 500;

export const VALORES_PAGO_VACIOS: ValoresPago = { estado: "abonado", monto: "", metodoPago: "", motivoExento: "" };

/** "12000", "12.000" o "12.000,50" → número; null si no es un importe. */
export function parsearMonto(texto: string): number | null {
  const limpio = texto.replace(/[\s$]/g, "");
  const normal = limpio.includes(",")
    ? limpio.replace(/\./g, "").replace(",", ".")
    : /^\d{1,3}(\.\d{3})+$/.test(limpio)
      ? limpio.replace(/\./g, "")
      : limpio;
  return /^\d+(\.\d{1,2})?$/.test(normal) ? Number(normal) : null;
}

export function validarPago(v: ValoresPago): ErroresPago {
  const errores: ErroresPago = {};
  if (v.estado === "abonado") {
    if (!v.monto.trim()) errores.monto = "Ingresá el monto abonado";
    else if (!((parsearMonto(v.monto) ?? 0) > 0)) errores.monto = "Ingresá un monto mayor a 0, con hasta 2 decimales";
    if (!v.metodoPago) errores.metodoPago = "Elegí el método de pago";
  }
  if (v.estado === "exento") {
    if (!v.motivoExento.trim()) errores.motivoExento = "Ingresá el motivo de la exención";
    else if (v.motivoExento.trim().length > MOTIVO_MAX) errores.motivoExento = `El motivo admite hasta ${MOTIVO_MAX} caracteres`;
  }
  return errores;
}

/** Datos para enviar al back; supone que `validarPago` no encontró errores. */
export function datosPagoDesdeValores(v: ValoresPago): DatosPago {
  if (v.estado === "abonado") {
    return { estado: "abonado", monto: parsearMonto(v.monto) ?? undefined, metodoPago: v.metodoPago || undefined };
  }
  if (v.estado === "exento") return { estado: "exento", motivoExento: v.motivoExento.trim() };
  return { estado: "pendiente" };
}

/** Precarga el formulario con el pago ya registrado (para modificarlo). */
export function valoresPagoDesdeSolicitud(s: Pick<Solicitud, "abono">): ValoresPago {
  const a = s.abono;
  if (!a || a.estado === "pendiente") return { ...VALORES_PAGO_VACIOS };
  return {
    estado: a.estado,
    monto: a.monto != null ? formatearImporte(a.monto) : "",
    metodoPago: a.metodoPago ?? "",
    motivoExento: a.motivoExento ?? "",
  };
}

export const OPCIONES_METODO = Object.entries(METODOS_PAGO) as [MetodoPago, string][];
