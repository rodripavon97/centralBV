import { useCallback, useEffect, useRef, useState } from "react";
import { listarMarcas, listarModelos, listarTipos } from "../api/flotaApi";
import type { ItemCatalogo, ModeloCatalogo } from "../domain/movil";

export interface Catalogos {
  tipos: ItemCatalogo[];
  marcas: ItemCatalogo[];
  modelos: ModeloCatalogo[];
}

export type EstadoCatalogos =
  | { estado: "cargando" }
  | { estado: "error"; error: Error }
  | { estado: "listo"; datos: Catalogos };

const traer = async (): Promise<Catalogos> => {
  const [tipos, marcas, modelos] = await Promise.all([listarTipos(), listarMarcas(), listarModelos()]);
  return { tipos, marcas, modelos };
};

/**
 * Tipos, marcas y modelos activos. `recargar` (después de agregar, renombrar o
 * eliminar) no vacía la pantalla y se puede esperar: al terminar, el ítem nuevo
 * ya está en la lista y se puede dejar elegido.
 */
export function useCatalogos() {
  const [catalogos, setCatalogos] = useState<EstadoCatalogos>({ estado: "cargando" });
  const montado = useRef(true);

  const cargar = useCallback(async () => {
    try {
      const datos = await traer();
      if (montado.current) setCatalogos({ estado: "listo", datos });
    } catch (error) {
      if (montado.current) setCatalogos({ estado: "error", error: error as Error });
    }
  }, []);

  // Primera carga (mismo patrón que useConsulta: setState solo en el callback).
  useEffect(() => {
    montado.current = true;
    traer().then(
      (datos) => montado.current && setCatalogos({ estado: "listo", datos }),
      (error: Error) => montado.current && setCatalogos({ estado: "error", error }),
    );
    return () => {
      montado.current = false;
    };
  }, []);

  const reintentar = useCallback(() => {
    setCatalogos({ estado: "cargando" });
    void cargar();
  }, [cargar]);

  return { catalogos, recargar: cargar, reintentar };
}
