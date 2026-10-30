import { formatearPatente } from "../domain/patente";
import type { MovilFlota } from "../domain/movil";
import EstadoMovilBadge from "./EstadoMovilBadge";

/* Fleet card de Figma (S1 Dashboard): denominación y estado arriba, tipo y patente abajo.
   Los móviles que no están operativos llevan un borde más marcado para resaltar. */
export default function TarjetaMovil({ movil }: { movil: MovilFlota }) {
  const resaltada = movil.estado !== "operativo";
  return (
    <li
      className={`flex flex-col gap-3 rounded-lg border bg-bg-surface p-4 ${
        resaltada ? "border-border-strong" : "border-border-subtle"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="truncate font-mono text-sm">{movil.codigo}</h2>
        <EstadoMovilBadge estado={movil.estado} />
      </div>
      <p className="truncate text-sm text-text-secondary">{movil.tipo}</p>
      <p className="text-code text-text-muted">{formatearPatente(movil.patente)}</p>
    </li>
  );
}

/** Tarjeta vacía mientras carga la flota. */
export function TarjetaEsqueleto() {
  const barra = "h-3 animate-pulse rounded-sm bg-bg-raised";
  return (
    <li aria-hidden className="flex h-[7.75rem] flex-col justify-center gap-4 rounded-lg border border-border-subtle bg-bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className={`${barra} w-12`} />
        <span className={`${barra} w-20`} />
      </div>
      <span className={`${barra} w-28`} />
      <span className={`${barra} w-20`} />
    </li>
  );
}
