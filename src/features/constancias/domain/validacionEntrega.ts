import type { Solicitud } from "@/types/dominio";
import { formatearDni } from "./formato";

export type CampoEntrega = "nombreCompleto" | "dni";

/** Valores del formulario tal como los escribe la persona. */
export type ValoresEntrega = Record<CampoEntrega, string>;

export type ErroresEntrega = Partial<Record<CampoEntrega, string>>;

/** Lo que espera PATCH /solicitudes/:id/entregar. */
export type DatosEntrega = Record<CampoEntrega, string>;

// Orden en que aparecen en el formulario: el foco va al primer error.
export const CAMPOS_ENTREGA: CampoEntrega[] = ["nombreCompleto", "dni"];

export const NOMBRE_MAX = 160;

const soloDigitos = (s: string) => s.replace(/\D/g, "");

/** Normalmente retira el damnificado: se precarga con sus datos y se puede cambiar. */
export const valoresEntregaDesdeSolicitud = ({ damnificado: d }: Pick<Solicitud, "damnificado">): ValoresEntrega => ({
  nombreCompleto: d.nombre,
  dni: formatearDni(d.dni),
});

/** Mismas reglas que valida el back: los dos datos son obligatorios. */
export function validarEntrega(v: ValoresEntrega): ErroresEntrega {
  const e: ErroresEntrega = {};
  const nombre = v.nombreCompleto.trim();

  if (!nombre) e.nombreCompleto = "Ingresá el nombre de quien retira";
  else if (!/^[\p{L}' -]+$/u.test(nombre)) e.nombreCompleto = "Usá solo letras";
  else if (nombre.length > NOMBRE_MAX) e.nombreCompleto = `El nombre admite hasta ${NOMBRE_MAX} caracteres`;

  if (!v.dni.trim()) e.dni = "Ingresá el DNI de quien retira";
  else if (!/^[\d.\s]+$/.test(v.dni) || !/^\d{7,8}$/.test(soloDigitos(v.dni)))
    e.dni = "Ingresá un DNI válido (7 u 8 dígitos)";

  return e;
}

/** Datos para enviar al back; supone que `validarEntrega` no encontró errores. */
export const datosEntregaDesdeValores = (v: ValoresEntrega): DatosEntrega => ({
  nombreCompleto: v.nombreCompleto.trim().replace(/\s+/g, " "),
  dni: soloDigitos(v.dni),
});
