/* US17: buches (compartimentos) de un móvil · Figma S5 Buches.
   Las zonas arman el plano: cabina arriba, lado conductor a la izquierda, techo al centro,
   lado acompañante a la derecha y trasero abajo. Mientras no haya materiales, el estado de
   cada buche se cambia a mano y no afecta el estado del móvil. Son los 4 estados de Figma
   (S5 · leyenda del plano): Operativo, Con observaciones, Dañado y Fuera de uso. El back genera los mismos
   nombres que `planGeneracion`: si cambia uno, cambiar el otro. */

export const ZONAS = ["lado_conductor", "lado_acompanante", "trasero", "techo", "cabina"] as const;
export type Zona = (typeof ZONAS)[number];

export const ETIQUETA_ZONA: Record<Zona, string> = {
  lado_conductor: "Lado conductor",
  lado_acompanante: "Lado acompañante",
  trasero: "Trasero",
  techo: "Techo · escalas",
  cabina: "Cabina",
};

export const PREFIJO_ZONA: Record<Zona, string> = {
  lado_conductor: "LC",
  lado_acompanante: "LA",
  trasero: "TR",
  techo: "TE",
  cabina: "CB",
};

export const ESTADOS_BUCHE = ["operativo", "observaciones", "danado", "fuera_de_uso"] as const;
export type EstadoBuche = (typeof ESTADOS_BUCHE)[number];

export const ETIQUETA_ESTADO_BUCHE: Record<EstadoBuche, string> = {
  operativo: "Operativo",
  observaciones: "Con observaciones",
  danado: "Dañado",
  fuera_de_uso: "Fuera de uso",
};

export interface Buche {
  id: string;
  nombre: string;
  zona: Zona;
  /** Posición dentro de la zona (la pone el back). */
  orden: number;
  estado: EstadoBuche;
}

/** Lo que dibuja el plano: un buche guardado o uno de la vista previa (sin id). */
export type BucheEnPlano = Pick<Buche, "nombre" | "zona" | "estado"> & { id?: string };

/** Cantidades del generador (Figma · Generar buches). */
export interface CantidadesGeneracion {
  ladoConductor: number;
  ladoAcompanante: number;
  trasero: number;
  techo: boolean;
  cabina: boolean;
}

/** Valores de entrada del generador: el ejemplo de Figma (9 buches). */
export const CANTIDADES_INICIALES: CantidadesGeneracion = {
  ladoConductor: 5,
  ladoAcompanante: 2,
  trasero: 1,
  techo: true,
  cabina: false,
};

/** Límites decididos el 13/11 (el back valida lo mismo). */
export const LIMITES_GENERACION = { lado: 10, trasero: 3 } as const;

export const MAX_NOMBRE_BUCHE = 20;

function cantidadPorZona(c: CantidadesGeneracion): Record<Zona, number> {
  return {
    lado_conductor: c.ladoConductor,
    lado_acompanante: c.ladoAcompanante,
    trasero: c.trasero,
    techo: c.techo ? 1 : 0,
    cabina: c.cabina ? 1 : 0,
  };
}

/** Buches que crea el generador, en el orden del plano: LC-1…, LA-1…, TR-1…, TE-1, CB-1. */
export function planGeneracion(c: CantidadesGeneracion): BucheEnPlano[] {
  const porZona = cantidadPorZona(c);
  return ZONAS.flatMap((zona) =>
    Array.from({ length: porZona[zona] }, (_, i) => ({
      nombre: `${PREFIJO_ZONA[zona]}-${i + 1}`,
      zona,
      estado: "operativo" as const,
    })),
  );
}

/** "LC-1 a LC-5", "TR-1" o "" si la zona no tiene buches. */
export function rangoZona(zona: Zona, cantidad: number): string {
  const p = PREFIJO_ZONA[zona];
  if (cantidad <= 0) return "";
  return cantidad === 1 ? `${p}-1` : `${p}-1 a ${p}-${cantidad}`;
}

/** Ayuda de cada contador: "Buches LC-1 a LC-5", "Buche TR-1" o "Sin buches". */
export function ayudaContador(zona: Zona, cantidad: number): string {
  if (cantidad <= 0) return "Sin buches";
  return `${cantidad === 1 ? "Buche" : "Buches"} ${rangoZona(zona, cantidad)}`;
}

/** "a, b y c" */
function enumerar(partes: string[]): string {
  if (partes.length <= 1) return partes.join("");
  return `${partes.slice(0, -1).join(", ")} y ${partes.at(-1)}`;
}

/** Texto de Figma: "Se van a crear 9 buches: LC-1 a LC-5, LA-1 a LA-2, TR-1 y TE-1. Todos arrancan vacíos y Operativos." */
export function textoGeneracion(c: CantidadesGeneracion): string {
  const porZona = cantidadPorZona(c);
  const total = ZONAS.reduce((s, z) => s + porZona[z], 0);
  if (total === 0) return "Elegí al menos un buche para generar.";
  const rangos = ZONAS.map((z) => rangoZona(z, porZona[z])).filter(Boolean);
  const cuantos = total === 1 ? "1 buche" : `${total} buches`;
  const final = total === 1 ? "Arranca vacío y Operativo." : "Todos arrancan vacíos y Operativos.";
  return `Se va${total === 1 ? "" : "n"} a crear ${cuantos}: ${enumerar(rangos)}. ${final}`;
}

export function totalGeneracion(c: CantidadesGeneracion): number {
  return planGeneracion(c).length;
}

/** Buches agrupados por zona, cada grupo en su orden. */
export function porZona<T extends BucheEnPlano & { orden?: number }>(buches: T[]): Record<Zona, T[]> {
  const grupos = Object.fromEntries(ZONAS.map((z) => [z, [] as T[]])) as Record<Zona, T[]>;
  for (const b of buches) grupos[b.zona].push(b);
  for (const z of ZONAS) grupos[z].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  return grupos;
}

/** "  lc   6 " → "LC 6", como lo guarda el back. */
export function normalizarNombreBuche(nombre: string): string {
  return nombre.trim().replace(/\s+/g, " ").toUpperCase();
}

/** Error del nombre de un buche, o undefined si está bien. `otros` = los demás buches del móvil. */
export function validarNombreBuche(nombre: string, otros: Pick<Buche, "nombre">[]): string | undefined {
  const normalizado = normalizarNombreBuche(nombre);
  if (!normalizado) return "Indicá el nombre del buche";
  if (normalizado.length > MAX_NOMBRE_BUCHE) return `Hasta ${MAX_NOMBRE_BUCHE} caracteres`;
  if (otros.some((b) => b.nombre.toLowerCase() === normalizado.toLowerCase())) return "Ya existe un buche con ese nombre";
  return undefined;
}

/** Ejemplo de nombre para un buche nuevo de esa zona: el siguiente número libre ("LC-6"). */
export function sugerenciaNombre(zona: Zona, buches: Pick<Buche, "nombre">[]): string {
  const p = PREFIJO_ZONA[zona];
  const usados = new Set(buches.map((b) => b.nombre.toUpperCase()));
  let n = 1;
  while (usados.has(`${p}-${n}`)) n++;
  return `${p}-${n}`;
}

/** Aviso al cambiar el estado: "LC-2 quedó Fuera de uso." */
export function textoEstadoCambiado(nombre: string, estado: EstadoBuche): string {
  return `${nombre} quedó ${ETIQUETA_ESTADO_BUCHE[estado]}.`;
}
