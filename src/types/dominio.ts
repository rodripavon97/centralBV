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

/* Solicitudes de constancia (US08, US09, US13). En el back el estado es
   PENDIENTE → REALIZADA → FIRMADA → RETIRADA, o CANCELADA (ver constancias/api.ts). */
export type EstadoSolicitud = "pendiente" | "constancia_generada" | "firmada" | "entregada" | "cancelada";

export type TipoSiniestro = "incendio_vivienda" | "incendio_vehicular" | "accidente_transito";

export interface Damnificado {
  nombre: string;
  apellido: string;
  dni: string; // solo dígitos: "30112456"
  telefono?: string;
  domicilio?: string;
}

export interface Siniestro {
  tipo: TipoSiniestro;
  fechaHora: string; // hora local, "2026-10-11T18:20"
  lugar: string;
  descripcion: string;
}

export interface Solicitud {
  id: string;
  numero: string; // "SOL-0147"
  fechaAlta: string; // "2026-10-11", fecha local de Argentina
  estado: EstadoSolicitud;
  damnificado: Damnificado;
  siniestro: Siniestro;
  motivoCancelacion?: string;
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