/* US06: parámetros de la URL de la lista de móviles y de la ficha.
   Devuelven siempre todas las claves (undefined si el valor es inválido): TanStack Router
   combina el resultado con los parámetros crudos, y una clave omitida dejaría pasar el valor crudo. */

/** Máximo de la búsqueda: el back rechaza más de 80 caracteres. */
export const MAX_BUSQUEDA = 80;

/** Móviles por página en la lista. */
export const POR_PAGINA_LISTA = 20;

/** /moviles?q=&pagina= */
export interface BusquedaMoviles {
  q?: string;
  pagina?: number;
}

export function validarBusquedaMoviles(search: Record<string, unknown>): BusquedaMoviles {
  const q = typeof search.q === "string" ? search.q.trim() : "";
  const pagina = Number(search.pagina);
  return {
    q: q && q.length <= MAX_BUSQUEDA ? q : undefined,
    pagina: Number.isInteger(pagina) && pagina > 1 ? pagina : undefined,
  };
}

/** Pestañas de la ficha, en el orden de Figma. */
export const PESTANAS_FICHA = ["datos", "inventario", "revision"] as const;
export type PestanaFicha = (typeof PESTANAS_FICHA)[number];

export const ETIQUETAS_PESTANA: Record<PestanaFicha, string> = {
  datos: "Datos generales",
  inventario: "Inventario",
  revision: "Última revisión",
};

/** ids que conectan cada pestaña con su panel (aria-controls / aria-labelledby). */
export const idPestana = (p: PestanaFicha) => `ficha-pestana-${p}`;
export const idPanel = (p: PestanaFicha) => `ficha-panel-${p}`;

/** /moviles/$id?pestana=  ·  sin pestana (o con una desconocida) se ve "Datos generales". */
export interface BusquedaFicha {
  pestana?: PestanaFicha;
}

export function validarBusquedaFicha(search: Record<string, unknown>): BusquedaFicha {
  const pestana = search.pestana;
  return {
    // "datos" es la de siempre: no hace falta en la URL.
    pestana:
      typeof pestana === "string" && pestana !== "datos" && (PESTANAS_FICHA as readonly string[]).includes(pestana)
        ? (pestana as PestanaFicha)
        : undefined,
  };
}
