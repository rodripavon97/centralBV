import type { EstadoSolicitud } from "@/types/dominio";
import { ESTADOS_SOLICITUD } from "./formato";

/** Parámetros de la URL del listado (US09): /solicitudes?q=&estado=&orden=&pagina= */
export interface BusquedaSolicitudes {
  q?: string;
  estado?: EstadoSolicitud;
  orden?: "asc";
  pagina?: number;
}

/** Valida lo que llega por la URL y descarta lo que no corresponde.
    Devuelve siempre todas las claves (undefined si el valor es inválido): TanStack Router
    combina el resultado con los parámetros crudos, y una clave omitida dejaría pasar el valor crudo. */
export function validarBusquedaSolicitudes(search: Record<string, unknown>): BusquedaSolicitudes {
  const q = typeof search.q === "string" ? search.q.trim() : "";
  const pagina = Number(search.pagina);
  return {
    q: q || undefined,
    // Object.hasOwn: con "in" pasarían nombres heredados como "toString".
    estado:
      typeof search.estado === "string" && Object.hasOwn(ESTADOS_SOLICITUD, search.estado)
        ? (search.estado as EstadoSolicitud)
        : undefined,
    orden: search.orden === "asc" ? "asc" : undefined,
    pagina: Number.isInteger(pagina) && pagina > 1 ? pagina : undefined,
  };
}
