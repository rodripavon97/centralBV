import type { ReactNode } from "react";
import { ALTO_A4, ANCHO_A4, useAnchoElemento } from "./escala";

/** Escala una hoja A4 al ancho disponible del contenedor. */
export default function HojaEscalada({ children }: { children: ReactNode }) {
  const { ref, ancho } = useAnchoElemento<HTMLDivElement>();
  const escala = ancho > 0 ? ancho / ANCHO_A4 : 0;

  return (
    <div ref={ref} className="w-full" style={{ height: ALTO_A4 * escala }}>
      <div style={{ width: ANCHO_A4, transform: `scale(${escala})`, transformOrigin: "top left" }}>{children}</div>
    </div>
  );
}

/** Miniatura de una hoja A4 con un ancho fijo (para el riel de hojas). */
export function HojaMiniatura({ children, ancho = 132 }: { children: ReactNode; ancho?: number }) {
  const escala = ancho / ANCHO_A4;
  return (
    <div className="overflow-hidden bg-white" style={{ width: ancho, height: ALTO_A4 * escala }}>
      <div style={{ width: ANCHO_A4, transform: `scale(${escala})`, transformOrigin: "top left" }}>{children}</div>
    </div>
  );
}
