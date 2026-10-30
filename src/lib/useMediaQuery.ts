import { useSyncExternalStore } from "react";

/** true mientras la media query se cumple (p. ej. "(min-width: 40rem)").
    Sin matchMedia (tests en jsdom) devuelve false: se usa el diseño angosto. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (avisar) => {
      if (typeof window.matchMedia !== "function") return () => {};
      const lista = window.matchMedia(query);
      lista.addEventListener("change", avisar);
      return () => lista.removeEventListener("change", avisar);
    },
    () => (typeof window.matchMedia === "function" ? window.matchMedia(query).matches : false),
    () => false,
  );
}
