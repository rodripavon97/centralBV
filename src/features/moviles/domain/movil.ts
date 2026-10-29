import type { EstadoVehiculo } from "@/types/dominio";
import { normalizarPatente } from "./patente";

/* US04: alta de móviles. Tipos y validación del formulario. */

/** Estado de un móvil en el front (incluye la baja, que solo se ve en la ficha). */
export type EstadoMovil = EstadoVehiculo | "baja_definitiva";

export const ETIQUETAS_ESTADO_MOVIL: Record<EstadoMovil, string> = {
  operativo: "Operativo",
  observaciones: "Con observaciones",
  fuera_de_servicio: "Fuera de servicio",
  mantenimiento: "En mantenimiento",
  baja_definitiva: "Baja definitiva",
};

/** Una fila de la lista de móviles. */
export interface MovilFlota {
  id: string;
  codigo: string; // denominación: "M-1"
  patente: string; // forma canónica: "AB123CD"
  tipo: string;
  marca: string;
  modelo: string;
  estado: EstadoMovil;
}

/* Orden natural: compara los números como números, así "M-2" va antes que
   "M-17" (en orden de texto, "M-17" quedaba segundo). Sin importar mayúsculas. */
const ordenNatural = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

/** Móviles ordenados por denominación: AB-04, M-1, M-2, …, M-10, M-17. */
export function ordenarPorDenominacion(moviles: MovilFlota[]): MovilFlota[] {
  return [...moviles].sort((a, b) => ordenNatural.compare(a.codigo, b.codigo));
}

/** Ítem de un catálogo (tipo o marca) con la cantidad de móviles activos que lo usan. */
export interface ItemCatalogo {
  id: string;
  nombre: string;
  enUso: number;
}

export interface ModeloCatalogo extends ItemCatalogo {
  marcaId: string;
}

export type Catalogo = "tipos" | "marcas" | "modelos";

/** Lo que se escribe en el formulario de alta (y de edición, US48). */
export interface ValoresMovil {
  denominacion: string;
  patente: string;
  tipoId: string;
  marcaId: string;
  modeloId: string;
}

export type CampoMovil = keyof ValoresMovil;

/** Orden de los campos en pantalla: el foco va al primero con error. */
export const CAMPOS_MOVIL: CampoMovil[] = ["denominacion", "patente", "tipoId", "marcaId", "modeloId"];

export const VALORES_MOVIL_VACIOS: ValoresMovil = {
  denominacion: "",
  patente: "",
  tipoId: "",
  marcaId: "",
  modeloId: "",
};

/** Textos de error de Figma (US04 · Alta · campos obligatorios y duplicado). */
export const MENSAJES_MOVIL = {
  obligatorio: "Este campo es obligatorio",
  tipo: "Seleccioná un tipo",
  marca: "Seleccioná una marca",
  modelo: "Seleccioná o agregá un modelo",
} as const;

/** Campos obligatorios. La patente vacía después de normalizar cuenta como vacía. */
export function validarMovil(v: ValoresMovil): Partial<Record<CampoMovil, string>> {
  const errores: Partial<Record<CampoMovil, string>> = {};
  if (!v.denominacion.trim()) errores.denominacion = MENSAJES_MOVIL.obligatorio;
  if (!normalizarPatente(v.patente)) errores.patente = MENSAJES_MOVIL.obligatorio;
  if (!v.tipoId) errores.tipoId = MENSAJES_MOVIL.tipo;
  if (!v.marcaId) errores.marcaId = MENSAJES_MOVIL.marca;
  if (!v.modeloId) errores.modeloId = MENSAJES_MOVIL.modelo;
  return errores;
}

/** Campo del formulario al que apunta un error por campo del back. */
export function campoDesdeApi(campo: string | undefined): CampoMovil | undefined {
  return campo === "patente" || campo === "denominacion" ? campo : undefined;
}

/** Códigos de error del back (src/fleet/fleet.service.ts → FLEET_ERROR_CODES). */
export const CODIGO_PATENTE_ESPECIAL = "PATENTE_FORMATO_DESCONOCIDO";

/** "1 móvil", "2 móviles", "Sin móviles". */
export function textoEnUso(n: number): string {
  if (n === 0) return "Sin móviles";
  return n === 1 ? "1 móvil" : `${n} móviles`;
}
