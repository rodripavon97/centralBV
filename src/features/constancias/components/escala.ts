import { useEffect, useRef, useState } from "react";

/** Medidas de una A4 a 96 dpi: solo se usan para calcular la escala en pantalla. */
export const ANCHO_A4 = 794;
export const ALTO_A4 = 1123;

/** Ancho actual de un elemento, actualizado cuando cambia el tamaño de la ventana. */
export function useAnchoElemento<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [ancho, setAncho] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => setAncho(el.clientWidth);
    medir();
    // jsdom no implementa ResizeObserver: en tests alcanza con la primera medición.
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(medir);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, ancho };
}
