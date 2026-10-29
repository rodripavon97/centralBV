/** Roles del back (vienen en el token). ADMIN tiene control total. */
export type Rol = "ADMIN" | "ADMINISTRATIVO" | "AUTOMOTORES" | "COMUN";

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

/* Solicitudes de constancia (US08 a US13). En el back el estado es
   PENDIENTE → REALIZADA → FIRMADA → RETIRADA, o CANCELADA (ver api/solicitudesApi.ts). */
export type EstadoSolicitud = "pendiente" | "constancia_generada" | "firmada" | "entregada" | "cancelada";

export type TipoSiniestro = "vivienda" | "vehicular";

export type DestinoConstancia = "seguro" | "accion_social";

export type EstadoPago = "pendiente" | "abonado" | "exento";

export type MetodoPago = "efectivo" | "transferencia" | "debito" | "credito";

export interface Damnificado {
  /** Nombre completo: el back guarda nombre y apellido juntos. */
  nombre: string;
  dni: string; // solo dígitos: "30112456"
  telefono?: string;
}

export interface Siniestro {
  tipo: TipoSiniestro;
  fecha: string; // fecha local de Argentina, "2026-10-11"
  hora: string; // hora local de Argentina, "18:20"
  direccion: string; // domicilio del hecho
  numeroParte: string;
  motivo: string;
  localidad: string;
  partido: string;
  perdidas: string;
  /** Solo para siniestros vehiculares. */
  patenteVehiculo?: string;
}

export interface Constancia {
  destino: DestinoConstancia;
  /** Seguro o acción social a la que se presenta la constancia. */
  razonSocial: string;
  /** Solo para destino seguro. */
  numeroPoliza?: string;
}

export interface Abono {
  estado: EstadoPago;
  monto?: number;
  metodoPago?: MetodoPago;
  fechaPago: string; // ISO 8601
  motivoExento?: string;
}

export interface Solicitud {
  id: string;
  numero: string; // "SOL-0147"
  fechaAlta: string; // "2026-10-11", fecha local de Argentina
  estado: EstadoSolicitud;
  damnificado: Damnificado;
  siniestro: Siniestro;
  constancia: Constancia;
  abono?: Abono;
  /** Texto adicional que se imprime en la constancia. */
  observaciones?: string;
  motivoCancelacion?: string;
  canceladoEn?: string;
  retiradoEn?: string;
  retiradoPorNombre?: string;
  retiradoPorDni?: string;
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