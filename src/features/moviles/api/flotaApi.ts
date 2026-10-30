import type { AxiosResponse } from "axios";
import { aErrorApi, http } from "@/lib/http";
import type { EstadoVehiculo } from "@/types/dominio";
import { ordenarPorDenominacion, type Catalogo, type EstadoMovil, type ItemCatalogo, type ModeloCatalogo, type MovilFlota, type ValoresMovil } from "../domain/movil";

/* Llamadas a /flota de centralBV_back (US04, US05, US45, US46).
   Acá se traducen los nombres del back (OPERATIVO, denominacion, valor)
   a los del front, así las pantallas no dependen del formato de la API.
   El token lo agrega el interceptor de src/app/configurarHttp.ts. */

type EstadoApi = "OPERATIVO" | "OBSERVACIONES" | "FUERA_SERVICIO" | "MANTENIMIENTO" | "BAJA_DEFINITIVA";

const ESTADO_DESDE_API: Record<EstadoApi, EstadoMovil> = {
  OPERATIVO: "operativo",
  OBSERVACIONES: "observaciones",
  FUERA_SERVICIO: "fuera_de_servicio",
  MANTENIMIENTO: "mantenimiento",
  BAJA_DEFINITIVA: "baja_definitiva",
};

const ESTADO_A_API: Record<EstadoVehiculo, Exclude<EstadoApi, "BAJA_DEFINITIVA">> = {
  operativo: "OPERATIVO",
  observaciones: "OBSERVACIONES",
  fuera_de_servicio: "FUERA_SERVICIO",
  mantenimiento: "MANTENIMIENTO",
};

interface ItemCatalogoApi {
  id: string;
  valor: string;
  enUso?: number;
}

interface ModeloApi extends ItemCatalogoApi {
  marcaId: string;
}

export interface MovilApi {
  id: string;
  estado: EstadoApi;
  patente: string;
  denominacion: string;
  tipo: ItemCatalogoApi;
  marca: ItemCatalogoApi;
  modelo: ModeloApi;
}

export function movilDesdeApi(m: MovilApi): MovilFlota {
  return {
    id: m.id,
    codigo: m.denominacion,
    patente: m.patente,
    tipo: m.tipo.valor,
    marca: m.marca.valor,
    modelo: m.modelo.valor,
    estado: ESTADO_DESDE_API[m.estado],
  };
}

const itemDesdeApi = (i: ItemCatalogoApi): ItemCatalogo => ({ id: i.id, nombre: i.valor, enUso: i.enUso ?? 0 });
const modeloDesdeApi = (m: ModeloApi): ModeloCatalogo => ({ ...itemDesdeApi(m), marcaId: m.marcaId });

async function datosDe<T>(pedido: Promise<AxiosResponse<T>>): Promise<T> {
  try {
    return (await pedido).data;
  } catch (error) {
    throw aErrorApi(error);
  }
}

/* ---------- Móviles ---------- */

/** Cuántos móviles trae la lista de una vez (el back admite hasta 100). */
export const POR_PAGINA_MOVILES = 100;

export interface PaginaMoviles {
  items: MovilFlota[];
  total: number;
}

/** Móviles activos (sin los dados de baja). `busqueda` filtra por número interno o
    patente (US06): el back normaliza la patente y la denominación ("m1" encuentra M-1). */
export async function listarMoviles(filtro: { busqueda?: string } = {}): Promise<PaginaMoviles> {
  const busqueda = filtro.busqueda?.trim();
  const r = await datosDe(
    http.get<{ items: MovilApi[]; total: number }>("/flota/vehiculos", {
      params: {
        ...(busqueda && { busqueda }),
        ordenPor: "denominacion",
        orden: "asc",
        pagina: 1,
        porPagina: POR_PAGINA_MOVILES,
      },
    }),
  );
  return { items: r.items.map(movilDesdeApi), total: r.total };
}

/** Un móvil por id, también si está dado de baja (ficha, US06).
    404 si no existe y 400 si el id no es válido: la ficha muestra "Móvil no encontrado". */
export async function obtenerMovil(id: string): Promise<MovilFlota> {
  return movilDesdeApi(await datosDe(http.get<MovilApi>(`/flota/vehiculos/${encodeURIComponent(id)}`)));
}

/** Alta de un móvil (queda Operativo). La patente y la denominación las normaliza el back.
    `confirmarPatenteEspecial` guarda una patente que no sigue ningún formato conocido. */
export async function crearMovil(
  valores: ValoresMovil,
  opciones: { confirmarPatenteEspecial?: boolean } = {},
): Promise<MovilFlota> {
  const r = await datosDe(
    http.post<MovilApi>("/flota/vehiculos", {
      denominacion: valores.denominacion.trim(),
      patente: valores.patente.trim(),
      tipoId: valores.tipoId,
      marcaId: valores.marcaId,
      modeloId: valores.modeloId,
      ...(opciones.confirmarPatenteEspecial && { confirmarPatenteEspecial: true }),
    }),
  );
  return movilDesdeApi(r);
}

/* ---------- Dashboard de flota (US05) ---------- */

/** Filtros del dashboard. El back filtra; el orden y la paginación los hace el front. */
export interface FiltroFlota {
  estado?: EstadoVehiculo;
  tipoId?: string;
}

/** Móviles activos que cumplen los filtros, en orden natural (M-2 antes que M-10).
    El back ordena como texto ("M-10" antes que "M-2"), por eso se trae toda la flota
    (hasta 100 móviles) y se ordena y pagina acá. */
export async function listarFlota(filtro: FiltroFlota = {}): Promise<MovilFlota[]> {
  const r = await datosDe(
    http.get<{ items: MovilApi[]; total: number }>("/flota/vehiculos", {
      params: {
        ...(filtro.estado && { estado: ESTADO_A_API[filtro.estado] }),
        ...(filtro.tipoId && { tipoId: filtro.tipoId }),
        pagina: 1,
        porPagina: POR_PAGINA_MOVILES,
      },
    }),
  );
  return ordenarPorDenominacion(r.items.map(movilDesdeApi));
}

/** Cantidad de móviles activos por estado (contadores del dashboard). */
export interface ResumenFlota {
  total: number;
  porEstado: Record<EstadoVehiculo, number>;
}

export async function obtenerResumenFlota(): Promise<ResumenFlota> {
  const r = await datosDe(
    http.get<{ total: number; porEstado: Partial<Record<EstadoApi, number>> }>("/flota/vehiculos/resumen"),
  );
  const porEstado = Object.fromEntries(
    Object.entries(ESTADO_A_API).map(([estado, api]) => [estado, r.porEstado[api] ?? 0]),
  ) as Record<EstadoVehiculo, number>;
  return { total: r.total, porEstado };
}

/* ---------- Catálogos (tipos, marcas y modelos) ---------- */

const ruta = (catalogo: Catalogo) => `/flota/catalogos/${catalogo}`;

export async function listarTipos(): Promise<ItemCatalogo[]> {
  return (await datosDe(http.get<ItemCatalogoApi[]>(ruta("tipos")))).map(itemDesdeApi);
}

export async function listarMarcas(): Promise<ItemCatalogo[]> {
  return (await datosDe(http.get<ItemCatalogoApi[]>(ruta("marcas")))).map(itemDesdeApi);
}

export async function listarModelos(): Promise<ModeloCatalogo[]> {
  return (await datosDe(http.get<ModeloApi[]>(ruta("modelos")))).map(modeloDesdeApi);
}

/** Crea un tipo o una marca. Para modelos usar `crearModelo`. */
export async function crearItem(catalogo: "tipos" | "marcas", nombre: string): Promise<ItemCatalogo> {
  return itemDesdeApi(await datosDe(http.post<ItemCatalogoApi>(ruta(catalogo), { valor: nombre.trim() })));
}

export async function crearModelo(nombre: string, marcaId: string): Promise<ModeloCatalogo> {
  return modeloDesdeApi(
    await datosDe(http.post<ModeloApi>(ruta("modelos"), { valor: nombre.trim(), marcaId })),
  );
}

export async function renombrarItem(catalogo: Catalogo, id: string, nombre: string): Promise<void> {
  await datosDe(http.patch(`${ruta(catalogo)}/${id}`, { valor: nombre.trim() }));
}

/** "Eliminar" en Figma: el back lo desactiva. Falla con 409 si algún móvil activo lo usa. */
export async function eliminarItem(catalogo: Catalogo, id: string): Promise<void> {
  await datosDe(http.patch(`${ruta(catalogo)}/${id}/desactivar`));
}
