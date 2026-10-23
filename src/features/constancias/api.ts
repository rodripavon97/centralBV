import type { EstadoSolicitud, Solicitud, TipoSiniestro } from "@/types/dominio";
import { ErrorApi, pedir } from "@/lib/http";
import type { DatosSolicitud } from "./validacion";

/* Capa de datos de solicitudes: llama a /solicitudes del back (NestJS).
   Acá se traducen los nombres del back (PENDIENTE, VIVIENDA, fechas ISO)
   a los del front, así las pantallas no dependen del formato de la API. */

export const POR_PAGINA = 20;

export interface FiltroSolicitudes {
  busqueda?: string;
  estado?: EstadoSolicitud;
  orden?: "desc" | "asc"; // por fecha de alta; por defecto la más reciente primero
  pagina?: number; // empieza en 1
}

export interface PaginaSolicitudes {
  items: Solicitud[];
  total: number;
  pagina: number;
  paginas: number;
}

/* ---------- Traducción front ↔ back ---------- */

type EstadoApi = "PENDIENTE" | "REALIZADA" | "FIRMADA" | "RETIRADA" | "CANCELADA";
type TipoApi = "VIVIENDA" | "VEHICULAR" | "ACCIDENTE_TRANSITO";

const ESTADO_A_API: Record<EstadoSolicitud, EstadoApi> = {
  pendiente: "PENDIENTE",
  constancia_generada: "REALIZADA",
  firmada: "FIRMADA",
  entregada: "RETIRADA",
  cancelada: "CANCELADA",
};

const TIPO_A_API: Record<TipoSiniestro, TipoApi> = {
  incendio_vivienda: "VIVIENDA",
  incendio_vehicular: "VEHICULAR",
  accidente_transito: "ACCIDENTE_TRANSITO",
};

const invertir = <K extends string, V extends string>(r: Record<K, V>) =>
  Object.fromEntries(Object.entries(r).map(([k, v]) => [v, k])) as Record<V, K>;
const ESTADO_DESDE_API = invertir(ESTADO_A_API);
const TIPO_DESDE_API = invertir(TIPO_A_API);

interface SolicitudApi {
  id: string;
  numero: string;
  estado: EstadoApi;
  fechaAlta: string; // ISO 8601 con zona horaria
  damnificado: { nombre: string; apellido: string; dni: string; telefono: string | null; domicilio: string | null };
  siniestro: { tipo: TipoApi; fechaHora: string; lugar: string; descripcion: string };
  motivoCancelacion: string | null;
}

/** Fecha local de Argentina ("2026-10-11") de un instante ISO. */
const fechaLocal = (iso: string) =>
  new Date(iso).toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });

function desdeApi(s: SolicitudApi): Solicitud {
  return {
    id: s.id,
    numero: s.numero,
    fechaAlta: fechaLocal(s.fechaAlta),
    estado: ESTADO_DESDE_API[s.estado],
    damnificado: {
      nombre: s.damnificado.nombre,
      apellido: s.damnificado.apellido,
      dni: s.damnificado.dni,
      telefono: s.damnificado.telefono ?? undefined,
      domicilio: s.damnificado.domicilio ?? undefined,
    },
    siniestro: {
      tipo: TIPO_DESDE_API[s.siniestro.tipo],
      fechaHora: s.siniestro.fechaHora,
      lugar: s.siniestro.lugar,
      descripcion: s.siniestro.descripcion,
    },
    motivoCancelacion: s.motivoCancelacion ?? undefined,
  };
}

const aApi = ({ damnificado, siniestro }: DatosSolicitud) => ({
  damnificado,
  siniestro: { ...siniestro, tipo: TIPO_A_API[siniestro.tipo] },
});

/* ---------- Endpoints ---------- */

export async function listarSolicitudes(filtro: FiltroSolicitudes): Promise<PaginaSolicitudes> {
  const r = await pedir<{ items: SolicitudApi[]; total: number; pagina: number; paginas: number }>("/solicitudes", {
    query: {
      busqueda: filtro.busqueda?.trim(),
      estado: filtro.estado && ESTADO_A_API[filtro.estado],
      orden: filtro.orden ?? "desc",
      pagina: filtro.pagina ?? 1,
      porPagina: POR_PAGINA,
    },
  });
  return { items: r.items.map(desdeApi), total: r.total, pagina: r.pagina, paginas: r.paginas };
}

export async function obtenerSolicitud(id: string): Promise<Solicitud | null> {
  try {
    return desdeApi(await pedir<SolicitudApi>(`/solicitudes/${encodeURIComponent(id)}`));
  } catch (err) {
    // 404: no existe. 400: el id ni siquiera tiene formato válido.
    if (err instanceof ErrorApi && (err.status === 404 || err.status === 400)) return null;
    throw err;
  }
}

export async function crearSolicitud(datos: DatosSolicitud): Promise<Solicitud> {
  return desdeApi(await pedir<SolicitudApi>("/solicitudes", { metodo: "POST", cuerpo: aApi(datos) }));
}

export async function actualizarSolicitud(id: string, datos: DatosSolicitud): Promise<Solicitud> {
  return desdeApi(await pedir<SolicitudApi>(`/solicitudes/${encodeURIComponent(id)}`, { metodo: "PUT", cuerpo: aApi(datos) }));
}

export async function cancelarSolicitud(id: string, motivo: string): Promise<Solicitud> {
  return desdeApi(
    await pedir<SolicitudApi>(`/solicitudes/${encodeURIComponent(id)}/cancelar`, {
      metodo: "PATCH",
      cuerpo: { motivo: motivo.trim() },
    }),
  );
}
