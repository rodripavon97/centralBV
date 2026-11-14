import axios, { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { formatearDni, formatearFecha, formatearHora } from "@/features/constancias/domain/formato";
import { INSTITUCION_DEMO } from "@/features/constancias/institucion";
import { generarPdfConstancia, type DatosPdfConstancia } from "@/features/constancias/pdf/pdfConstancia";
import { esEscritura, resolverPedido, type SolicitudApi } from "./backSimulado";
import { cargarEstadoDemo, esModoDemo, guardarEstadoDemo, MENSAJE_SIN_MAILS } from "./modoDemo";

/** Base ficticia para armar la URL: en modo demo ningún pedido sale a la red. */
const BASE_DEMO = "http://demo.centralbv.local";

function cuerpoDelPedido(data: unknown): unknown {
  if (typeof data !== "string" || data === "") return data ?? undefined;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

/** Misma regla que el mapper del back: dominio solo si es vehicular, póliza solo si va al seguro. */
export function datosPdfDesdeApi(s: SolicitudApi): DatosPdfConstancia {
  return {
    solicitante: s.damnificado.nombre,
    dni: formatearDni(s.damnificado.dni),
    domicilio: s.siniestro.direccion,
    localidad: s.siniestro.localidad,
    partido: s.siniestro.partido,
    motivo: s.siniestro.motivo,
    perdidas: s.siniestro.perdidas,
    presentadoA: s.constancia.razonSocial,
    numeroParte: s.siniestro.numeroParte,
    fecha: formatearFecha(s.siniestro.fecha),
    hora: formatearHora(s.siniestro.hora),
    patente: s.siniestro.tipo === "VEHICULAR" ? s.siniestro.patenteVehiculo : null,
    numeroPoliza: s.constancia.destino === "SEGURO" ? s.constancia.numeroPoliza : null,
    observaciones: s.observaciones?.trim() || null,
  };
}

/** Adapter de axios del modo demo: cada pedido lo resuelve el back simulado con los datos de localStorage. */
export const adaptadorDemo: AxiosAdapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  const metodo = (config.method ?? "get").toUpperCase();
  const url = new URL(axios.getUri({ ...config, baseURL: BASE_DEMO }), BASE_DEMO);
  const estado = cargarEstadoDemo();
  const respuesta = resolverPedido(estado, { metodo, url, cuerpo: cuerpoDelPedido(config.data) }, { mensajeMails: MENSAJE_SIN_MAILS });
  if (esEscritura(metodo) && respuesta.status < 400) guardarEstadoDemo(estado);

  const headers = new AxiosHeaders();
  let data: unknown;
  if (respuesta.pdf) {
    data = await generarPdfConstancia(datosPdfDesdeApi(respuesta.pdf.solicitud), INSTITUCION_DEMO);
    headers.set("content-type", "application/pdf");
    headers.set("content-disposition", `attachment; filename="${respuesta.pdf.nombre}"`);
  } else if (respuesta.cuerpo !== undefined) {
    // Copia: la pantalla no puede modificar el estado guardado.
    data = structuredClone(respuesta.cuerpo);
    headers.set("content-type", "application/json");
  }

  const response: AxiosResponse = {
    data,
    status: respuesta.status,
    statusText: respuesta.status < 400 ? "OK" : "Error",
    headers,
    config,
    request: { demo: true },
  };
  if (!config.validateStatus || config.validateStatus(respuesta.status)) return response;
  throw new AxiosError(
    `Request failed with status code ${respuesta.status}`,
    respuesta.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
    config,
    response.request,
    response,
  );
};

/** Adapter de `http`: con el flag de demo responde el back simulado; si no, axios sale a la red como siempre. */
export function crearAdaptador(adaptadorReal: AxiosAdapter = axios.getAdapter(axios.defaults.adapter)): AxiosAdapter {
  return (config) => (esModoDemo() ? adaptadorDemo(config) : adaptadorReal(config));
}
