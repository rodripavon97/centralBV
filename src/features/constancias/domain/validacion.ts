import type { Constancia, Damnificado, DestinoConstancia, Siniestro, Solicitud, TipoSiniestro } from "@/types/dominio";
import {
  DESTINOS_CONSTANCIA,
  TIPOS_SINIESTRO,
  ahora,
  formatearDni,
  formatearFecha,
  formatearHora,
  parsearFecha,
  parsearHora,
} from "./formato";

export type CampoSolicitud =
  | "nombre"
  | "dni"
  | "telefono"
  | "tipo"
  | "fecha"
  | "hora"
  | "direccion"
  | "numeroParte"
  | "motivo"
  | "localidad"
  | "partido"
  | "perdidas"
  | "patenteVehiculo"
  | "destino"
  | "razonSocial"
  | "numeroPoliza";

/** Valores del formulario tal como los escribe la persona (todo texto). */
export type ValoresSolicitud = Record<CampoSolicitud, string>;
export type ErroresSolicitud = Partial<Record<CampoSolicitud, string>>;
export type DatosSolicitud = { damnificado: Damnificado; siniestro: Siniestro; constancia: Constancia };

// Orden en que aparecen en el formulario: el foco va al primer error.
export const CAMPOS: CampoSolicitud[] = [
  "nombre",
  "dni",
  "telefono",
  "tipo",
  "fecha",
  "hora",
  "direccion",
  "numeroParte",
  "motivo",
  "localidad",
  "partido",
  "perdidas",
  "patenteVehiculo",
  "destino",
  "razonSocial",
  "numeroPoliza",
];

export const VALORES_VACIOS: ValoresSolicitud = {
  nombre: "",
  dni: "",
  telefono: "",
  tipo: "",
  fecha: "",
  hora: "",
  direccion: "",
  numeroParte: "",
  motivo: "",
  localidad: "",
  partido: "",
  perdidas: "",
  patenteVehiculo: "",
  destino: "",
  razonSocial: "",
  numeroPoliza: "",
};

const OBLIGATORIO = "Este campo es obligatorio";
const soloDigitos = (s: string) => s.replace(/\D/g, "");

/**
 * Strategy: interfaz funcional para la estrategia de validación de un campo.
 * Recibe el valor del campo y la totalidad de valores para validaciones contextuales o condicionales.
 */
export type EstrategiaValidacion = (valor: string, todos: ValoresSolicitud) => string | undefined;

// --- Estrategias de validación ---

export const validarNombre: EstrategiaValidacion = (valor) => {
  if (!valor.trim()) return OBLIGATORIO;
  if (!/^[\p{L}' -]+$/u.test(valor.trim())) return "Usá solo letras";
};

export const validarDni: EstrategiaValidacion = (valor) => {
  if (!valor.trim()) return OBLIGATORIO;
  if (!/^[\d.\s]+$/.test(valor) || !/^\d{7,8}$/.test(soloDigitos(valor))) {
    return "Ingresá un DNI válido (7 u 8 dígitos)";
  }
};

export const validarTelefono: EstrategiaValidacion = (valor) => {
  if (!valor.trim()) return undefined;
  if (!/^[\d\s()+-]+$/.test(valor) || soloDigitos(valor).length !== 10) {
    return "Ingresá un teléfono válido (10 dígitos)";
  }
};

export const validarSeleccionObligatoria: EstrategiaValidacion = (valor) => {
  if (!valor) return "Seleccioná una opción";
};

export const validarTextoObligatorio: EstrategiaValidacion = (valor) => {
  if (!valor.trim()) return OBLIGATORIO;
};

export const validarFecha: EstrategiaValidacion = (valor) => {
  if (!valor.trim()) return OBLIGATORIO;
  const fecha = parsearFecha(valor);
  if (!fecha) return "Usá el formato dd/mm/aaaa";
  if (fecha > ahora().slice(0, 10)) return "La fecha no puede ser posterior a hoy";
};

export const validarHora: EstrategiaValidacion = (valor) => {
  if (!valor.trim()) return OBLIGATORIO;
  if (!parsearHora(valor)) return "Usá el formato hh:mm";
};

export const validarPatenteVehiculo: EstrategiaValidacion = (valor, todos) => {
  if (todos.tipo !== "vehicular") return undefined;
  if (!valor.trim()) return "La patente es obligatoria para un vehículo";
  if (!/^[A-Za-z0-9 -]{5,10}$/.test(valor.trim())) return "Ingresá una patente válida";
};

export const validarNumeroPoliza: EstrategiaValidacion = (valor, todos) => {
  if (todos.destino !== "seguro") return undefined;
  if (!valor.trim()) return "El número de póliza es obligatorio";
};

/**
 * Registry: administra el mapeo de cada campo con su estrategia de validación correspondiente.
 */
export class RegistroValidadores {
  private readonly estrategias = new Map<CampoSolicitud, EstrategiaValidacion>();

  registrar(campo: CampoSolicitud, estrategia: EstrategiaValidacion): this {
    this.estrategias.set(campo, estrategia);
    return this;
  }

  obtener(campo: CampoSolicitud): EstrategiaValidacion | undefined {
    return this.estrategias.get(campo);
  }

  validarCampo(campo: CampoSolicitud, valores: ValoresSolicitud): string | undefined {
    const estrategia = this.estrategias.get(campo);
    return estrategia ? estrategia(valores[campo], valores) : undefined;
  }

  validarTodo(valores: ValoresSolicitud): ErroresSolicitud {
    const errores: ErroresSolicitud = {};
    for (const [campo, estrategia] of this.estrategias) {
      const error = estrategia(valores[campo], valores);
      if (error) errores[campo] = error;
    }
    return errores;
  }
}

/** Construye y configura el registro de validadores por defecto de la solicitud. */
export function crearRegistroSolicitud(): RegistroValidadores {
  const registro = new RegistroValidadores();

  registro
    .registrar("nombre", validarNombre)
    .registrar("dni", validarDni)
    .registrar("telefono", validarTelefono)
    .registrar("tipo", validarSeleccionObligatoria)
    .registrar("fecha", validarFecha)
    .registrar("hora", validarHora)
    .registrar("direccion", validarTextoObligatorio)
    .registrar("numeroParte", validarTextoObligatorio)
    .registrar("motivo", validarTextoObligatorio)
    .registrar("localidad", validarTextoObligatorio)
    .registrar("partido", validarTextoObligatorio)
    .registrar("perdidas", validarTextoObligatorio)
    .registrar("patenteVehiculo", validarPatenteVehiculo)
    .registrar("destino", validarSeleccionObligatoria)
    .registrar("razonSocial", validarTextoObligatorio)
    .registrar("numeroPoliza", validarNumeroPoliza);

  return registro;
}

export const registroValidadores = crearRegistroSolicitud();

export function validarSolicitud(v: ValoresSolicitud): ErroresSolicitud {
  return registroValidadores.validarTodo(v);
}

/** Llamar solo con valores ya validados. */
export function datosDesdeValores(v: ValoresSolicitud): DatosSolicitud {
  const tipo = v.tipo as TipoSiniestro;
  const destino = v.destino as DestinoConstancia;
  return {
    damnificado: {
      nombre: v.nombre.trim().replace(/\s+/g, " "),
      dni: soloDigitos(v.dni),
      telefono: v.telefono.trim() || undefined,
    },
    siniestro: {
      tipo,
      fecha: parsearFecha(v.fecha)!,
      hora: parsearHora(v.hora)!,
      direccion: v.direccion.trim(),
      numeroParte: v.numeroParte.trim(),
      motivo: v.motivo.trim(),
      localidad: v.localidad.trim(),
      partido: v.partido.trim(),
      perdidas: v.perdidas.trim(),
      patenteVehiculo: tipo === "vehicular" ? v.patenteVehiculo.trim().toUpperCase() : undefined,
    },
    constancia: {
      destino,
      razonSocial: v.razonSocial.trim(),
      numeroPoliza: destino === "seguro" ? v.numeroPoliza.trim() : undefined,
    },
  };
}

export function valoresDesdeSolicitud({ damnificado: d, siniestro: s, constancia: c }: Solicitud): ValoresSolicitud {
  return {
    nombre: d.nombre,
    dni: formatearDni(d.dni),
    telefono: d.telefono ?? "",
    tipo: s.tipo in TIPOS_SINIESTRO ? s.tipo : "",
    fecha: formatearFecha(s.fecha),
    hora: formatearHora(s.hora),
    direccion: s.direccion,
    numeroParte: s.numeroParte,
    motivo: s.motivo,
    localidad: s.localidad,
    partido: s.partido,
    perdidas: s.perdidas,
    patenteVehiculo: s.patenteVehiculo ?? "",
    destino: c.destino in DESTINOS_CONSTANCIA ? c.destino : "",
    razonSocial: c.razonSocial,
    numeroPoliza: c.numeroPoliza ?? "",
  };
}
