import { useRef, type KeyboardEvent } from "react";
import { CircleAlert, CircleCheck, CircleX, type LucideIcon } from "lucide-react";
import { focus } from "@/components/centralbv/estilos";
import { ETIQUETAS_VERIFICACION, type EstadoVerificacion as Estado } from "../domain/revision";

const OPCIONES: Estado[] = ["ok", "atencion", "critico"];

/* Nunca solo color: cada opción lleva glifo y texto (los mismos del badge de estado). */
const estilos: Record<Estado, { icon: LucideIcon; elegido: string }> = {
  ok: { icon: CircleCheck, elegido: "border-state-ok bg-state-ok-bg text-state-ok" },
  atencion: { icon: CircleAlert, elegido: "border-state-warn bg-state-warn-bg text-state-warn" },
  critico: { icon: CircleX, elegido: "border-state-danger bg-state-danger-bg text-state-danger" },
};

/**
 * Ok / Atención / Crítico de una verificación (Figma S6). Es un grupo de radio:
 * Tab entra al grupo y las flechas cambian la opción, como en un radio nativo.
 */
export default function EstadoVerificacion({
  nombre,
  valor,
  onCambiar,
  disabled,
}: {
  /** Nombre de la verificación, para el lector de pantalla. */
  nombre: string;
  valor?: Estado;
  onCambiar: (estado: Estado) => void;
  disabled?: boolean;
}) {
  const botones = useRef<Partial<Record<Estado, HTMLButtonElement | null>>>({});

  const tecla = (e: KeyboardEvent) => {
    // Parte de la opción con foco (sin valor marcado, el foco está en la primera).
    const enfocada = OPCIONES.find((o) => botones.current[o] === document.activeElement);
    const i = OPCIONES.indexOf(enfocada ?? valor ?? "ok");
    const ultima = OPCIONES.length - 1;
    const destino =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? (i >= ultima ? 0 : i + 1)
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i <= 0 ? ultima : i - 1)
      : undefined;
    if (destino === undefined) return;
    e.preventDefault();
    const opcion = OPCIONES[destino];
    onCambiar(opcion);
    botones.current[opcion]?.focus();
  };

  return (
    <div role="radiogroup" aria-label={nombre} onKeyDown={tecla} className="flex gap-2">
      {OPCIONES.map((o, i) => {
        const { icon: Icon, elegido } = estilos[o];
        const marcado = valor === o;
        // Sin valor, el primero es el que recibe el Tab.
        const enfocable = valor ? marcado : i === 0;
        return (
          <button
            key={o}
            ref={(b) => {
              botones.current[o] = b;
            }}
            type="button"
            role="radio"
            aria-checked={marcado}
            tabIndex={enfocable ? 0 : -1}
            disabled={disabled}
            onClick={() => onCambiar(o)}
            className={`inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md border px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none ${
              marcado ? elegido : "border-border-subtle text-text-secondary hover:bg-bg-raised hover:text-text-primary"
            } ${focus}`}
          >
            <Icon size={16} strokeWidth={1.5} aria-hidden className="shrink-0" />
            {ETIQUETAS_VERIFICACION[o]}
          </button>
        );
      })}
    </div>
  );
}
