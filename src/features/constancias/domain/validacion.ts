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

export function validarSolicitud(v: ValoresSolicitud): ErroresSolicitud {
  const e: ErroresSolicitud = {};

  if (!v.nombre.trim()) e.nombre = OBLIGATORIO;
  else if (!/^[\p{L}' -]+$/u.test(v.nombre.trim())) e.nombre = "Usá solo letras";

  if (!v.dni.trim()) e.dni = OBLIGATORIO;
  else if (!/^[\d.\s]+$/.test(v.dni) || !/^\d{7,8}$/.test(soloDigitos(v.dni)))
    e.dni = "Ingresá un DNI válido (7 u 8 dígitos)";

  if (v.telefono.trim() && (!/^[\d\s()+-]+$/.test(v.telefono) || soloDigitos(v.telefono).length < 6))
    e.telefono = "Ingresá un teléfono válido";

  if (!v.tipo) e.tipo = "Seleccioná una opción";

  if (!v.fecha.trim()) e.fecha = OBLIGATORIO;
  else {
    const fecha = parsearFecha(v.fecha);
    if (!fecha) e.fecha = "Usá el formato dd/mm/aaaa";
    else if (fecha > ahora().slice(0, 10)) e.fecha = "La fecha no puede ser posterior a hoy";
  }

  if (!v.hora.trim()) e.hora = OBLIGATORIO;
  else if (!parsearHora(v.hora)) e.hora = "Usá el formato hh:mm";

  for (const campo of ["direccion", "numeroParte", "motivo", "localidad", "partido", "perdidas"] as const) {
    if (!v[campo].trim()) e[campo] = OBLIGATORIO;
  }

  if (v.tipo === "vehicular") {
    if (!v.patenteVehiculo.trim()) e.patenteVehiculo = "La patente es obligatoria para un vehículo";
    else if (!/^[A-Za-z0-9 -]{5,10}$/.test(v.patenteVehiculo.trim())) e.patenteVehiculo = "Ingresá una patente válida";
  }

  if (!v.destino) e.destino = "Seleccioná una opción";

  if (!v.razonSocial.trim()) e.razonSocial = OBLIGATORIO;

  if (v.destino === "seguro" && !v.numeroPoliza.trim()) e.numeroPoliza = "El número de póliza es obligatorio";

  return e;
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
