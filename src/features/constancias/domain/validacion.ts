import type { Damnificado, Siniestro, Solicitud, TipoSiniestro } from "@/types/dominio";
import { TIPOS_SINIESTRO, ahora, formatearDni, formatearFechaHora, parsearFechaHora } from "./formato";

export type CampoSolicitud =
  | "nombre"
  | "apellido"
  | "dni"
  | "telefono"
  | "domicilio"
  | "tipo"
  | "fechaHora"
  | "lugar"
  | "descripcion";

/** Valores del formulario tal como los escribe la persona (todo texto). */
export type ValoresSolicitud = Record<CampoSolicitud, string>;
export type ErroresSolicitud = Partial<Record<CampoSolicitud, string>>;
export type DatosSolicitud = { damnificado: Damnificado; siniestro: Siniestro };

// Orden en que aparecen en el formulario: el foco va al primer error.
export const CAMPOS: CampoSolicitud[] = [
  "nombre",
  "apellido",
  "dni",
  "telefono",
  "domicilio",
  "tipo",
  "fechaHora",
  "lugar",
  "descripcion",
];

export const VALORES_VACIOS: ValoresSolicitud = {
  nombre: "",
  apellido: "",
  dni: "",
  telefono: "",
  domicilio: "",
  tipo: "",
  fechaHora: "",
  lugar: "",
  descripcion: "",
};

const OBLIGATORIO = "Este campo es obligatorio";
const soloDigitos = (s: string) => s.replace(/\D/g, "");

export function validarSolicitud(v: ValoresSolicitud): ErroresSolicitud {
  const e: ErroresSolicitud = {};

  for (const campo of ["nombre", "apellido"] as const) {
    if (!v[campo].trim()) e[campo] = OBLIGATORIO;
    else if (!/^[\p{L}' -]+$/u.test(v[campo].trim())) e[campo] = "Usá solo letras";
  }

  if (!v.dni.trim()) e.dni = OBLIGATORIO;
  else if (!/^[\d.\s]+$/.test(v.dni) || !/^\d{7,8}$/.test(soloDigitos(v.dni)))
    e.dni = "Ingresá un DNI válido (7 u 8 dígitos)";

  if (v.telefono.trim() && (!/^[\d\s()+-]+$/.test(v.telefono) || soloDigitos(v.telefono).length < 6))
    e.telefono = "Ingresá un teléfono válido";

  if (!v.tipo) e.tipo = "Seleccioná una opción";

  if (!v.fechaHora.trim()) e.fechaHora = OBLIGATORIO;
  else {
    const fecha = parsearFechaHora(v.fechaHora);
    if (!fecha) e.fechaHora = "Usá el formato dd/mm/aaaa hh:mm";
    else if (fecha > ahora()) e.fechaHora = "La fecha no puede ser posterior a hoy";
  }

  if (!v.lugar.trim()) e.lugar = OBLIGATORIO;
  if (!v.descripcion.trim()) e.descripcion = OBLIGATORIO;

  return e;
}

/** Llamar solo con valores ya validados. */
export function datosDesdeValores(v: ValoresSolicitud): DatosSolicitud {
  return {
    damnificado: {
      nombre: v.nombre.trim(),
      apellido: v.apellido.trim(),
      dni: soloDigitos(v.dni),
      telefono: v.telefono.trim() || undefined,
      domicilio: v.domicilio.trim() || undefined,
    },
    siniestro: {
      tipo: v.tipo as TipoSiniestro,
      fechaHora: parsearFechaHora(v.fechaHora)!,
      lugar: v.lugar.trim(),
      descripcion: v.descripcion.trim(),
    },
  };
}

export function valoresDesdeSolicitud({ damnificado: d, siniestro: s }: Solicitud): ValoresSolicitud {
  return {
    nombre: d.nombre,
    apellido: d.apellido,
    dni: formatearDni(d.dni),
    telefono: d.telefono ?? "",
    domicilio: d.domicilio ?? "",
    tipo: s.tipo in TIPOS_SINIESTRO ? s.tipo : "",
    fechaHora: formatearFechaHora(s.fechaHora),
    lugar: s.lugar,
    descripcion: s.descripcion,
  };
}
