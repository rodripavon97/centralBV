import type { EstadoVehiculo } from "@/types/dominio";
import { ETIQUETAS_ESTADO_MOVIL } from "./movil";

/* US05: dashboard con la disponibilidad de la flota. Filtros de la URL,
   estados que se cuentan y paginación (que se hace en el front, ver flotaApi). */

/** Estados activos en el orden de los contadores (Figma S1 Dashboard). La baja no se muestra. */
export const ESTADOS_MOVIL: EstadoVehiculo[] = ["operativo", "observaciones", "fuera_de_servicio", "mantenimiento"];

/** Móviles por página: 12 desde dos columnas (grilla de 3 o 4), 6 en mobile. */
export const POR_PAGINA_FLOTA = { ancho: 12, angosto: 6 } as const;

/** Parámetros de la URL del dashboard: /dashboard?estado=&tipo=&pagina= */
export interface BusquedaFlota {
  estado?: EstadoVehiculo;
  tipo?: string; // id del tipo de vehículo
  pagina?: number;
}

// El back pide un UUID para el tipo: otro valor daría error 400 en vez de "sin resultados".
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Valida lo que llega por la URL. Devuelve siempre todas las claves (undefined si el valor es
    inválido): TanStack Router combina el resultado con los parámetros crudos, y una clave
    omitida dejaría pasar el valor crudo. */
export function validarBusquedaFlota(search: Record<string, unknown>): BusquedaFlota {
  const tipo = typeof search.tipo === "string" ? search.tipo.trim() : "";
  const pagina = Number(search.pagina);
  return {
    // Object.hasOwn: con "in" pasarían nombres heredados como "toString".
    estado:
      typeof search.estado === "string" &&
      search.estado !== "baja_definitiva" &&
      Object.hasOwn(ETIQUETAS_ESTADO_MOVIL, search.estado)
        ? (search.estado as EstadoVehiculo)
        : undefined,
    tipo: UUID.test(tipo) ? tipo : undefined,
    pagina: Number.isInteger(pagina) && pagina > 1 ? pagina : undefined,
  };
}

/** Una página de la lista, con lo que muestra el pie ("7–12 de 16"). */
export interface Pagina<T> {
  items: T[];
  pagina: number; // ajustada: si la pedida no existe, la última
  paginas: number;
  desde: number;
  hasta: number;
  total: number;
}

/** Corta la lista en la página pedida. Una página que ya no existe pasa a ser la última. */
export function paginar<T>(lista: T[], pagina: number, porPagina: number): Pagina<T> {
  const total = lista.length;
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const actual = Math.min(Math.max(1, pagina), paginas);
  const inicio = (actual - 1) * porPagina;
  const items = lista.slice(inicio, inicio + porPagina);
  return { items, pagina: actual, paginas, desde: total ? inicio + 1 : 0, hasta: inicio + items.length, total };
}

/** Al cambiar la cantidad por página, la página donde queda el primer móvil que se veía. */
export function paginaEquivalente(pagina: number, porPaginaAntes: number, porPaginaAhora: number): number {
  const primero = (Math.max(1, pagina) - 1) * porPaginaAntes;
  return Math.floor(primero / porPaginaAhora) + 1;
}
