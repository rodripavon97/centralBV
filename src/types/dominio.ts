export type Rol = "admin_general" | "administrativo" | "inspector" | "admin_moviles";

export type EstadoVehiculo = "operativo" | "observaciones" | "fuera_de_servicio" | "mantenimiento";

export type TipoZona = "cabina" | "lateral_izq" | "lateral_der" | "techo" | "trasero" | "interior";

export interface Item {
  id: string;
  nombre: string;
  cantidad: number;
}

export interface Compartimento {
  id: string;
  codigo: string; // "BL-1"
  nombre: string;
  fila: number;
  columna: number;
  span: number;
  items: Item[];
}

export interface Zona {
  id: string;
  tipo: TipoZona;
  compartimentos: Compartimento[];
}

export interface Vehiculo {
  id: string;
  codigo: string; // "AB-03"
  tipo: string;
  kilometraje: number;
  proximoAceiteKm: number;
  estado: EstadoVehiculo;
  zonas: Zona[];
}

export type EstadoInspeccion = "en_curso" | "pausada" | "enviada" | "descartada" | "incompleta";
export type Respuesta = "pendiente" | "ok" | "falta" | "danado";

export interface RespuestaItem {
  itemId: string;
  valor: Respuesta;
  cantidadAfectada?: number; // solo si cantidad > 1 y valor es falta o danado
  nota?: string;
}

export interface Inspeccion {
  id: string;
  vehiculoId: string;
  estado: EstadoInspeccion;
  iniciadaPor: string;
  iniciadaEn: string;
  respuestas: RespuestaItem[];
  observacionGeneral?: string;
}