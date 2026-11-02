import type { EstadoVehiculo } from "@/types/dominio";

/* US07: revisión del móvil (Figma S6). Las 7 verificaciones del back (T44), la regla que
   define el estado del móvil al guardar y la validación del formulario. VTV, seguro, service,
   kilometraje y combustible quedaron fuera del MVP. El back aplica la misma regla
   (estadoDesdeRevision): si cambia, cambiarla en los dos lados. */

export type EstadoVerificacion = "ok" | "atencion" | "critico";

export const ETIQUETAS_VERIFICACION: Record<EstadoVerificacion, string> = {
  ok: "Ok",
  atencion: "Atención",
  critico: "Crítico",
};

export type CodigoVerificacion = "ACEITE" | "REFRIGERANTE" | "FRENOS" | "BATERIA" | "NEUMATICOS" | "LUCES" | "SIRENA";

export interface Verificacion {
  codigo: CodigoVerificacion;
  nombre: string;
  /** Verificación de seguridad: se resalta con la etiqueta CRÍTICO. La regla es la misma. */
  seguridad?: boolean;
}

/** Secciones con verificaciones, en el orden de Figma. */
export const SECCIONES_VERIFICACION: { titulo: string; verificaciones: Verificacion[] }[] = [
  {
    titulo: "Mecánica y fluidos",
    verificaciones: [
      { codigo: "ACEITE", nombre: "Nivel de aceite" },
      { codigo: "REFRIGERANTE", nombre: "Refrigerante" },
      { codigo: "FRENOS", nombre: "Frenos", seguridad: true },
      { codigo: "BATERIA", nombre: "Batería" },
    ],
  },
  {
    titulo: "Neumáticos",
    verificaciones: [{ codigo: "NEUMATICOS", nombre: "Presión de neumáticos (aire en ruedas)" }],
  },
  {
    titulo: "Equipamiento",
    verificaciones: [
      { codigo: "LUCES", nombre: "Luces y balizas" },
      { codigo: "SIRENA", nombre: "Sirena y comunicaciones" },
    ],
  },
];

export const VERIFICACIONES: Verificacion[] = SECCIONES_VERIFICACION.flatMap((s) => s.verificaciones);

export const NOMBRE_VERIFICACION = Object.fromEntries(VERIFICACIONES.map((v) => [v.codigo, v.nombre])) as Record<
  CodigoVerificacion,
  string
>;

/** El estado en que queda el móvil después de una revisión (nunca En mantenimiento). */
export type ResultadoRevision = Exclude<EstadoVehiculo, "mantenimiento">;

export interface ItemRevision {
  codigo: CodigoVerificacion;
  estado: EstadoVerificacion;
  detalle?: string;
}

/** Una revisión guardada, como la devuelve el back (ya traducida). */
export interface RevisionMovil {
  id: string;
  realizadaEn: string; // ISO 8601
  /** Calculado con `resultadoRevision`: el back no lo devuelve, pero aplica la misma regla. */
  resultado: ResultadoRevision;
  /** Nombre de quien la registró; no está en revisiones anteriores a que se guardara. */
  revisadoPor?: string;
  comentario?: string;
  items: ItemRevision[];
}

/** Una página del historial (más nueva primero). */
export interface PaginaRevisiones {
  items: RevisionMovil[];
  total: number;
  pagina: number;
  paginas: number;
}

/** Revisiones por página en el historial. */
export const REVISIONES_POR_PAGINA = 10;

/** Lo que se escribe en el formulario. */
export interface ValoresRevision {
  comentario: string;
  items: Partial<Record<CodigoVerificacion, { estado?: EstadoVerificacion; detalle: string }>>;
}

export const VALORES_REVISION_VACIOS: ValoresRevision = { comentario: "", items: {} };

/** Cuántas de las 7 verificaciones ya tienen estado ("3 de 7"). */
export function verificacionesMarcadas(v: ValoresRevision): number {
  return VERIFICACIONES.filter((x) => v.items[x.codigo]?.estado).length;
}

/**
 * Regla de estado (decidida el 30/10): algún Crítico → Fuera de servicio;
 * alguna Atención → Con observaciones; todo Ok → Operativo.
 */
export function resultadoRevision(estados: (EstadoVerificacion | undefined)[]): ResultadoRevision {
  if (estados.includes("critico")) return "fuera_de_servicio";
  if (estados.includes("atencion")) return "observaciones";
  return "operativo";
}

export function resultadoDeValores(v: ValoresRevision): ResultadoRevision {
  return resultadoRevision(VERIFICACIONES.map((x) => v.items[x.codigo]?.estado));
}

/** Por debajo de los máximos del back (500 por ítem, 1000 el comentario general). */
export const LIMITES_REVISION = { detalle: 200, comentario: 500 } as const;

export type CampoRevision = "comentario" | `detalle-${CodigoVerificacion}`;

const formatoInstante = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Buenos_Aires",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** "2026-10-24T02:50:00Z" → "23/10/2026 23:50" (hora de Argentina). */
export function formatearInstante(iso: string): string {
  return formatoInstante.format(new Date(iso)).replace(",", "");
}

/**
 * Validación del formulario: Atención o Crítico piden el detalle. Si el móvil estaba
 * En mantenimiento, el comentario general es obligatorio: hay que contar qué se hizo.
 */
export function validarRevision(
  v: ValoresRevision,
  { enMantenimiento = false }: { enMantenimiento?: boolean } = {},
): Partial<Record<CampoRevision, string>> {
  const errores: Partial<Record<CampoRevision, string>> = {};
  for (const { codigo } of VERIFICACIONES) {
    const item = v.items[codigo];
    const detalle = item?.detalle.trim() ?? "";
    if (item?.estado && item.estado !== "ok" && !detalle) errores[`detalle-${codigo}`] = "Contá qué se encontró";
    else if (detalle.length > LIMITES_REVISION.detalle) errores[`detalle-${codigo}`] = `Máximo ${LIMITES_REVISION.detalle} caracteres`;
  }
  if (enMantenimiento && !v.comentario.trim()) {
    errores.comentario = "Contá qué se hizo en el mantenimiento";
  } else if (v.comentario.length > LIMITES_REVISION.comentario) {
    errores.comentario = `Máximo ${LIMITES_REVISION.comentario} caracteres`;
  }
  return errores;
}

/** Orden de los campos en pantalla: el foco va al primero con error. */
export const CAMPOS_REVISION: CampoRevision[] = [...VERIFICACIONES.map((x) => `detalle-${x.codigo}` as const), "comentario"];

/** Texto del aviso de Figma según el resultado ("al guardar, R-01 pasa a Fuera de servicio."). */
export function avisoResultado(codigo: string, v: ValoresRevision, estadoActual: EstadoVehiculo | "baja_definitiva") {
  const resultado = resultadoDeValores(v);
  if (resultado === "fuera_de_servicio") {
    const criticos = VERIFICACIONES.filter((x) => v.items[x.codigo]?.estado === "critico").map((x) =>
      NOMBRE_VERIFICACION[x.codigo].toLowerCase(),
    );
    const plural = criticos.length > 1 ? "Fallas críticas" : "Falla crítica";
    return { tono: "danger" as const, texto: `${plural} (${criticos.join(", ")}): al guardar, ${codigo} pasa a Fuera de servicio.` };
  }
  if (resultado === "observaciones") {
    return { tono: "warn" as const, texto: `Hay verificaciones en Atención: al guardar, ${codigo} queda Con observaciones.` };
  }
  if (verificacionesMarcadas(v) === VERIFICACIONES.length && estadoActual !== "operativo") {
    return { tono: "ok" as const, texto: `Todo en Ok: al guardar, ${codigo} vuelve a Operativo.` };
  }
  return null;
}

/** Aviso al volver a la ficha (Figma "Revisión guardada…"). */
export function textoRevisionGuardada(codigo: string, resultado: ResultadoRevision): string {
  if (resultado === "fuera_de_servicio") return `Revisión guardada. ${codigo} pasó a Fuera de servicio por falla crítica.`;
  if (resultado === "observaciones") return `Revisión guardada. ${codigo} queda Con observaciones.`;
  return `Revisión guardada. ${codigo} queda Operativo.`;
}

/**
 * Resumen de una revisión para el historial: "Todo en Ok", o qué no estuvo en Ok
 * ("1 crítica: Frenos · 1 en Atención: Sirena y comunicaciones").
 */
export function resumenRevision(items: ItemRevision[]): string {
  const nombres = (estado: EstadoVerificacion) =>
    VERIFICACIONES.filter((v) => items.some((i) => i.codigo === v.codigo && i.estado === estado)).map((v) => v.nombre);
  const criticas = nombres("critico");
  const atencion = nombres("atencion");
  const partes: string[] = [];
  if (criticas.length) partes.push(`${criticas.length} ${criticas.length > 1 ? "críticas" : "crítica"}: ${criticas.join(", ")}`);
  if (atencion.length) partes.push(`${atencion.length} en Atención: ${atencion.join(", ")}`);
  return partes.length ? partes.join(" · ") : "Todo en Ok";
}
