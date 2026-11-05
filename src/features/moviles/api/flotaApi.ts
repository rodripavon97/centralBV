import type { AxiosResponse } from "axios";
import { aErrorApi, http } from "@/lib/http";
import type { EstadoVehiculo } from "@/types/dominio";
import type { CodigoVerificacion, EstadoVerificacion, PaginaRevisiones, RevisionMovil, ValoresRevision } from "../domain/revision";
import { REVISIONES_POR_PAGINA, VERIFICACIONES, resultadoRevision } from "../domain/revision";
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
  motivoBaja?: string | null;
}

export function movilDesdeApi(m: MovilApi): MovilFlota {
  return {
    id: m.id,
    codigo: m.denominacion,
    patente: m.patente,
    tipo: m.tipo.valor,
    marca: m.marca.valor,
    modelo: m.modelo.valor,
    tipoId: m.tipo.id,
    marcaId: m.marca.id,
    modeloId: m.modelo.id,
    estado: ESTADO_DESDE_API[m.estado],
    ...(m.motivoBaja ? { motivoBaja: m.motivoBaja } : {}),
  };
}

function cuerpoMovil(valores: ValoresMovil, opciones: { confirmarPatenteEspecial?: boolean } = {}) {
  return {
    denominacion: valores.denominacion.trim(),
    patente: valores.patente.trim(),
    tipoId: valores.tipoId,
    marcaId: valores.marcaId,
    modeloId: valores.modeloId,
    ...(opciones.confirmarPatenteEspecial && { confirmarPatenteEspecial: true }),
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
  return movilDesdeApi(await datosDe(http.post<MovilApi>("/flota/vehiculos", cuerpoMovil(valores, opciones))));
}

/** Actualiza los datos generales del móvil (US48). No cambia el estado. */
export async function actualizarMovil(
  id: string,
  valores: ValoresMovil,
  opciones: { confirmarPatenteEspecial?: boolean } = {},
): Promise<MovilFlota> {
  return movilDesdeApi(
    await datosDe(http.patch<MovilApi>(`/flota/vehiculos/${encodeURIComponent(id)}`, cuerpoMovil(valores, opciones))),
  );
}

/** Baja definitiva (solo ADMIN). Exige motivo; el móvil queda fuera de la lista activa. */
export async function darDeBajaMovil(id: string, motivo: string): Promise<MovilFlota> {
  return movilDesdeApi(
    await datosDe(
      http.patch<MovilApi>(`/flota/vehiculos/${encodeURIComponent(id)}/baja`, { motivo: motivo.trim() }),
    ),
  );
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

/* ---------- Revisiones (US07 · T44, back de Luca Barneto) ----------
   POST /flota/vehiculos/:id/revisiones
     { nivelAceite: { estado: "OK" | "ADVERTENCIA" | "CRITICO", comentario: string | null },
       frenos, refrigerante, bateria, presionNeumaticos, lucesYBalizas, sirenaYComunicaciones,
       comentarioGeneral: string | null }   (comentario obligatorio si el estado no es OK)
     → 201 RevisionApi. Guarda quién la registró (del token) y actualiza el estado del móvil,
     en una transacción, con la misma regla que el front. 409 si el móvil está dado de baja;
     400 { campo: "comentarioGeneral" } si estaba En mantenimiento y no se contó qué se hizo.
   GET /flota/vehiculos/:id/revisiones?pagina=&porPagina= → { items: RevisionApi[], total, pagina, paginas }
     (más nueva primero)
   GET /flota/vehiculos/:id/revisiones/:revisionId → RevisionApi, o 404. */

type EstadoVerificacionApi = "OK" | "ADVERTENCIA" | "CRITICO";

type ClaveItemApi =
  | "nivelAceite"
  | "refrigerante"
  | "frenos"
  | "bateria"
  | "presionNeumaticos"
  | "lucesYBalizas"
  | "sirenaYComunicaciones";

const CLAVE_API: Record<CodigoVerificacion, ClaveItemApi> = {
  ACEITE: "nivelAceite",
  REFRIGERANTE: "refrigerante",
  FRENOS: "frenos",
  BATERIA: "bateria",
  NEUMATICOS: "presionNeumaticos",
  LUCES: "lucesYBalizas",
  SIRENA: "sirenaYComunicaciones",
};

const VERIFICACION_A_API: Record<EstadoVerificacion, EstadoVerificacionApi> = {
  ok: "OK",
  atencion: "ADVERTENCIA",
  critico: "CRITICO",
};
const VERIFICACION_DESDE_API: Record<EstadoVerificacionApi, EstadoVerificacion> = {
  OK: "ok",
  ADVERTENCIA: "atencion",
  CRITICO: "critico",
};

interface ItemRevisionApi {
  estado: EstadoVerificacionApi;
  comentario: string | null;
}

export type RevisionApi = Record<ClaveItemApi, ItemRevisionApi> & {
  id: string;
  vehiculoId: string;
  comentarioGeneral: string | null;
  revisadoPor: { id: string; nombre: string } | null;
  creadoEn: string;
};

interface PaginaRevisionesApi {
  items: RevisionApi[];
  total: number;
  pagina: number;
  paginas: number;
}

export function revisionDesdeApi(r: RevisionApi): RevisionMovil {
  const items = VERIFICACIONES.map(({ codigo }) => {
    const item = r[CLAVE_API[codigo]];
    return {
      codigo,
      estado: VERIFICACION_DESDE_API[item?.estado] ?? "ok",
      ...(item?.comentario && { detalle: item.comentario }),
    };
  });
  return {
    id: r.id,
    realizadaEn: r.creadoEn,
    // El back no devuelve el resultado: se calcula con la misma regla con la que actualizó el móvil.
    resultado: resultadoRevision(items.map((i) => i.estado)),
    ...(r.revisadoPor?.nombre && { revisadoPor: r.revisadoPor.nombre }),
    ...(r.comentarioGeneral && { comentario: r.comentarioGeneral }),
    items,
  };
}

/** Registra una revisión del móvil. El back recalcula y guarda el estado nuevo del móvil. */
export async function registrarRevision(id: string, v: ValoresRevision): Promise<RevisionMovil> {
  const cuerpo: Record<string, unknown> = { comentarioGeneral: v.comentario.trim() || null };
  for (const { codigo } of VERIFICACIONES) {
    const item = v.items[codigo];
    const estado = item?.estado ?? "ok";
    cuerpo[CLAVE_API[codigo]] = {
      estado: VERIFICACION_A_API[estado],
      comentario: estado === "ok" ? null : item?.detalle.trim() || null,
    };
  }
  const r = await datosDe(http.post<RevisionApi>(`/flota/vehiculos/${encodeURIComponent(id)}/revisiones`, cuerpo));
  return revisionDesdeApi(r);
}

/** Una página del historial de revisiones del móvil, de la más nueva a la más vieja. */
export async function listarRevisiones(id: string, pagina = 1): Promise<PaginaRevisiones> {
  const r = await datosDe(
    http.get<PaginaRevisionesApi>(`/flota/vehiculos/${encodeURIComponent(id)}/revisiones`, {
      params: { pagina, porPagina: REVISIONES_POR_PAGINA },
    }),
  );
  return { items: r.items.map(revisionDesdeApi), total: r.total, pagina: r.pagina, paginas: r.paginas };
}

/** Una revisión puntual del móvil (para abrirla desde un link). 404 si no existe o es de otro móvil. */
export async function obtenerRevision(id: string, revisionId: string): Promise<RevisionMovil> {
  return revisionDesdeApi(
    await datosDe(
      http.get<RevisionApi>(`/flota/vehiculos/${encodeURIComponent(id)}/revisiones/${encodeURIComponent(revisionId)}`),
    ),
  );
}
