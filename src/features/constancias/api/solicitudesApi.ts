import axios, { type AxiosResponse } from "axios";
import type {
  DestinoConstancia,
  EstadoPago,
  EstadoSolicitud,
  MetodoPago,
  Solicitud,
  TipoSiniestro,
} from "@/types/dominio";
import { ErrorApi, aErrorApi, http } from "@/lib/http";
import type { DatosSolicitud } from "../domain/validacion";

/* Llamadas a /solicitudes de centralBV_back (US08 a US13).
   Acá se traducen los nombres del back (PENDIENTE, VIVIENDA, fechas ISO)
   a los del front, así las pantallas no dependen del formato de la API.
   El token lo agrega el interceptor de src/app/configurarHttp.ts. */

export const POR_PAGINA = 20;

/** Estados en los que el back permite generar y descargar el PDF. */
export const ESTADOS_CON_PDF: EstadoSolicitud[] = ["constancia_generada", "firmada", "entregada"];

export const puedeDescargarPdf = (estado: EstadoSolicitud) => ESTADOS_CON_PDF.includes(estado);

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

export interface PdfConstancia {
  blob: Blob;
  filename: string;
}

/* ---------- Traducción front ↔ back ---------- */

type EstadoApi = "PENDIENTE" | "REALIZADA" | "FIRMADA" | "RETIRADA" | "CANCELADA";
type TipoApi = "VIVIENDA" | "VEHICULAR";
type DestinoApi = "SEGURO" | "ACCION_SOCIAL";
type EstadoPagoApi = "PENDIENTE" | "ABONADO" | "EXENTO";
type MetodoPagoApi = "EFECTIVO" | "TRANSFERENCIA" | "DEBITO" | "CREDITO";

const ESTADO_A_API: Record<EstadoSolicitud, EstadoApi> = {
  pendiente: "PENDIENTE",
  constancia_generada: "REALIZADA",
  firmada: "FIRMADA",
  entregada: "RETIRADA",
  cancelada: "CANCELADA",
};

const TIPO_A_API: Record<TipoSiniestro, TipoApi> = {
  vivienda: "VIVIENDA",
  vehicular: "VEHICULAR",
};

const DESTINO_A_API: Record<DestinoConstancia, DestinoApi> = {
  seguro: "SEGURO",
  accion_social: "ACCION_SOCIAL",
};

const PAGO_A_API: Record<EstadoPago, EstadoPagoApi> = {
  pendiente: "PENDIENTE",
  abonado: "ABONADO",
  exento: "EXENTO",
};

const METODO_A_API: Record<MetodoPago, MetodoPagoApi> = {
  efectivo: "EFECTIVO",
  transferencia: "TRANSFERENCIA",
  debito: "DEBITO",
  credito: "CREDITO",
};

const invertir = <K extends string, V extends string>(r: Record<K, V>) =>
  Object.fromEntries(Object.entries(r).map(([k, v]) => [v, k])) as Record<V, K>;
const ESTADO_DESDE_API = invertir(ESTADO_A_API);
const TIPO_DESDE_API = invertir(TIPO_A_API);
const DESTINO_DESDE_API = invertir(DESTINO_A_API);
const PAGO_DESDE_API = invertir(PAGO_A_API);
const METODO_DESDE_API = invertir(METODO_A_API);

export interface SolicitudApi {
  id: string;
  numero: string;
  estado: EstadoApi;
  fechaAlta: string; // ISO 8601 con zona horaria
  damnificado: { nombre: string; dni: string; telefono: string | null };
  siniestro: {
    tipo: TipoApi;
    fecha: string; // "2026-10-11"
    hora: string; // "18:20"
    direccion: string;
    numeroParte: string;
    motivo: string;
    localidad: string;
    partido: string;
    perdidas: string;
    patenteVehiculo: string | null;
  };
  constancia: { destino: DestinoApi; razonSocial: string; numeroPoliza: string | null };
  abono: {
    estado: EstadoPagoApi;
    monto: number | null;
    metodoPago: MetodoPagoApi | null;
    fechaPago: string;
    motivoExento: string | null;
  } | null;
  observaciones: string | null;
  motivoCancelacion: string | null;
  canceladoEn: string | null;
  retiradoEn: string | null;
  retiradoPorNombre: string | null;
  retiradoPorDni: string | null;
}

/** Fecha local de Argentina ("2026-10-11") de un instante ISO. */
const fechaLocal = (iso: string) =>
  new Date(iso).toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });

export function desdeApi(s: SolicitudApi): Solicitud {
  return {
    id: s.id,
    numero: s.numero,
    fechaAlta: fechaLocal(s.fechaAlta),
    estado: ESTADO_DESDE_API[s.estado],
    damnificado: {
      nombre: s.damnificado.nombre,
      dni: s.damnificado.dni,
      telefono: s.damnificado.telefono ?? undefined,
    },
    siniestro: {
      tipo: TIPO_DESDE_API[s.siniestro.tipo],
      fecha: s.siniestro.fecha,
      hora: s.siniestro.hora.slice(0, 5),
      direccion: s.siniestro.direccion,
      numeroParte: s.siniestro.numeroParte,
      motivo: s.siniestro.motivo,
      localidad: s.siniestro.localidad,
      partido: s.siniestro.partido,
      perdidas: s.siniestro.perdidas,
      patenteVehiculo: s.siniestro.patenteVehiculo ?? undefined,
    },
    constancia: {
      destino: DESTINO_DESDE_API[s.constancia.destino],
      razonSocial: s.constancia.razonSocial,
      numeroPoliza: s.constancia.numeroPoliza ?? undefined,
    },
    abono: s.abono
      ? {
          estado: PAGO_DESDE_API[s.abono.estado],
          monto: s.abono.monto ?? undefined,
          metodoPago: s.abono.metodoPago ? METODO_DESDE_API[s.abono.metodoPago] : undefined,
          fechaPago: s.abono.fechaPago,
          motivoExento: s.abono.motivoExento ?? undefined,
        }
      : undefined,
    observaciones: s.observaciones ?? undefined,
    motivoCancelacion: s.motivoCancelacion ?? undefined,
    canceladoEn: s.canceladoEn ?? undefined,
    retiradoEn: s.retiradoEn ?? undefined,
    retiradoPorNombre: s.retiradoPorNombre ?? undefined,
    retiradoPorDni: s.retiradoPorDni ?? undefined,
  };
}

export const aApi = ({ damnificado: d, siniestro: s, constancia: c }: DatosSolicitud) => ({
  damnificado: {
    nombre: d.nombre,
    dni: d.dni,
    telefono: d.telefono ?? null,
  },
  siniestro: {
    tipo: TIPO_A_API[s.tipo],
    fecha: s.fecha,
    hora: s.hora,
    direccion: s.direccion,
    numeroParte: s.numeroParte,
    motivo: s.motivo,
    localidad: s.localidad,
    partido: s.partido,
    perdidas: s.perdidas,
    patenteVehiculo: s.tipo === "vehicular" ? (s.patenteVehiculo ?? null) : null,
  },
  constancia: {
    destino: DESTINO_A_API[c.destino],
    razonSocial: c.razonSocial,
    numeroPoliza: c.destino === "seguro" ? (c.numeroPoliza ?? null) : null,
  },
});

/** Espera la respuesta de axios y convierte cualquier error en ErrorApi. */
async function datosDe<T>(pedido: Promise<{ data: T }>): Promise<T> {
  try {
    return (await pedido).data;
  } catch (error) {
    throw aErrorApi(error);
  }
}

/** Nombre del archivo que manda el back en Content-Disposition. */
function nombreArchivo(headers: AxiosResponse["headers"]): string {
  const valor = typeof headers.get === "function" ? headers.get("content-disposition") : headers["content-disposition"];
  const match = typeof valor === "string" ? valor.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i) : null;
  return match ? decodeURIComponent(match[1]) : "constancia.pdf";
}

/** El back responde PDF; si falla, el error viene como Blob y hay que leerlo. */
async function respuestaPdf(pedido: Promise<AxiosResponse<Blob>>): Promise<PdfConstancia> {
  try {
    const respuesta = await pedido;
    return { blob: respuesta.data, filename: nombreArchivo(respuesta.headers) };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      try {
        error.response.data = JSON.parse(await error.response.data.text());
      } catch {
        // Si no es JSON, aErrorApi arma un mensaje genérico.
      }
    }
    throw aErrorApi(error);
  }
}

/* ---------- Endpoints ---------- */

export async function listarSolicitudes(filtro: FiltroSolicitudes): Promise<PaginaSolicitudes> {
  const r = await datosDe(
    http.get<{ items: SolicitudApi[]; total: number; pagina: number; paginas: number }>("/solicitudes", {
      params: {
        busqueda: filtro.busqueda?.trim() || undefined,
        estado: filtro.estado && ESTADO_A_API[filtro.estado],
        orden: filtro.orden ?? "desc",
        pagina: filtro.pagina ?? 1,
        porPagina: POR_PAGINA,
      },
    }),
  );
  return { items: r.items.map(desdeApi), total: r.total, pagina: r.pagina, paginas: r.paginas };
}

export async function obtenerSolicitud(id: string): Promise<Solicitud | null> {
  try {
    return desdeApi(await datosDe(http.get<SolicitudApi>(`/solicitudes/${encodeURIComponent(id)}`)));
  } catch (error) {
    // 404: no existe. 400: el id ni siquiera tiene formato válido.
    if (error instanceof ErrorApi && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
}

export async function crearSolicitud(datos: DatosSolicitud): Promise<Solicitud> {
  return desdeApi(await datosDe(http.post<SolicitudApi>("/solicitudes", aApi(datos))));
}

export async function actualizarSolicitud(id: string, datos: DatosSolicitud): Promise<Solicitud> {
  return desdeApi(await datosDe(http.put<SolicitudApi>(`/solicitudes/${encodeURIComponent(id)}`, aApi(datos))));
}

export async function cancelarSolicitud(id: string, motivo: string): Promise<Solicitud> {
  return desdeApi(
    await datosDe(http.patch<SolicitudApi>(`/solicitudes/${encodeURIComponent(id)}/cancelar`, { motivo: motivo.trim() })),
  );
}

/** PENDIENTE → REALIZADA, con el texto adicional opcional. Devuelve el PDF generado. */
export async function generarConstancia(id: string, observaciones: string): Promise<PdfConstancia> {
  return respuestaPdf(
    http.patch<Blob>(
      `/solicitudes/${encodeURIComponent(id)}/generar-constancia`,
      { observaciones: observaciones.trim() || null },
      { responseType: "blob" },
    ),
  );
}

/** Descarga el PDF de una solicitud ya generada (REALIZADA, FIRMADA o RETIRADA). */
export async function descargarConstanciaPdf(id: string): Promise<PdfConstancia> {
  return respuestaPdf(
    http.get<Blob>(`/solicitudes/${encodeURIComponent(id)}/pdf`, {
      responseType: "blob",
      headers: { Accept: "application/pdf" },
    }),
  );
}
