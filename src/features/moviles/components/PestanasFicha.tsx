import { useRef, type KeyboardEvent } from "react";
import { focus } from "@/components/centralbv/estilos";
import { ETIQUETAS_PESTANA, PESTANAS_FICHA, idPanel, idPestana, type PestanaFicha } from "../domain/busquedaMoviles";

/**
 * Pestañas de la ficha (Figma S4): Datos generales · Inventario · Última revisión.
 * Patrón ARIA de pestañas: ← → (y Inicio / Fin) cambian de pestaña y mueven el foco;
 * solo la activa entra en el orden de Tab. La activa lleva el subrayado rojo.
 */
export default function PestanasFicha({ activa, onCambiar }: { activa: PestanaFicha; onCambiar: (p: PestanaFicha) => void }) {
  const botones = useRef<Partial<Record<PestanaFicha, HTMLButtonElement | null>>>({});

  const ir = (p: PestanaFicha) => {
    onCambiar(p);
    botones.current[p]?.focus();
  };

  const tecla = (e: KeyboardEvent) => {
    const i = PESTANAS_FICHA.indexOf(activa);
    const ultima = PESTANAS_FICHA.length - 1;
    const destino =
      e.key === "ArrowRight" ? (i === ultima ? 0 : i + 1)
      : e.key === "ArrowLeft" ? (i === 0 ? ultima : i - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? ultima
      : undefined;
    if (destino === undefined) return;
    e.preventDefault();
    ir(PESTANAS_FICHA[destino]);
  };

  return (
    <div role="tablist" aria-label="Secciones de la ficha" onKeyDown={tecla} className="flex gap-5 overflow-x-auto overflow-y-hidden border-b border-border-subtle [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden">
      {PESTANAS_FICHA.map((p) => {
        const seleccionada = p === activa;
        return (
          <button
            key={p}
            ref={(b) => {
              botones.current[p] = b;
            }}
            id={idPestana(p)}
            type="button"
            role="tab"
            aria-selected={seleccionada}
            aria-controls={idPanel(p)}
            tabIndex={seleccionada ? 0 : -1}
            onClick={() => onCambiar(p)}
            className={`shrink-0 whitespace-nowrap rounded-t-sm border-b-2 pb-3 pt-1 text-sm transition-colors ${
              seleccionada ? "border-accent-fill text-text-primary" : "border-transparent text-text-muted hover:text-text-secondary"
            } ${focus}`}
          >
            {ETIQUETAS_PESTANA[p]}
          </button>
        );
      })}
    </div>
  );
}
