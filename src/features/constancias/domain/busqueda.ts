import type { EstadoSolicitud } from "@/types/dominio";
import { ESTADOS_SOLICITUD } from "./formato";

/** Parámetros de la URL del listado (US09): /solicitudes?q=&estado=&orden=&pagina= */
export interface BusquedaSolicitudes {
  q?: string;
  estado?: EstadoSolicitud;
  orden?: "asc";
  pagina?: number;
}

/** Valida lo que llega por la URL y descarta lo que no corresponde. */
export function validarBusquedaSolicitudes(search: Record<string, unknown>): BusquedaSolicitudes {
  const resultado: BusquedaSolicitudes = {};
  if (typeof search.q === "string" && search.q.trim()) resultado.q = search.q.trim();
  if (typeof search.estado === "string" && search.estado in ESTADOS_SOLICITUD) {
    resultado.estado = search.estado as EstadoSolicitud;
  }
  if (search.orden === "asc") resultado.orden = "asc";
  const pagina = Number(search.pagina);
  if (Number.isInteger(pagina) && pagina > 1) resultado.pagina = pagina;
  return resultado;
}
