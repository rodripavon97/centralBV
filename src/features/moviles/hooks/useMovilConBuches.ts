import { useConsulta } from "@/features/constancias/hooks/useConsulta";
import { listarBuches, obtenerMovil } from "../api/flotaApi";

/** El móvil con sus buches, para Generar buches y Editar buches (US17). */
export function useMovilConBuches(id: string) {
  return useConsulta(`buches-movil:${id}`, async () => {
    const [movil, buches] = await Promise.all([obtenerMovil(id), listarBuches(id)]);
    return { movil, buches };
  });
}
