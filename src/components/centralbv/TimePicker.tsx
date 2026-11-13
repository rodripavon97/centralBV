import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Clock } from "lucide-react";
import { Input } from "./Field";
import { focus } from "./estilos";
import { parsearHora } from "@/lib/fecha";

const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTOS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

type InputProps = ComponentProps<typeof Input>;

export type TimePickerProps = {
  id: string;
  /** Hora en texto: "hh:mm". Vacío si todavía no se eligió. */
  value: string;
  onChange: (hora: string) => void;
  /**
   * Hora máxima elegible ("hh:mm"). El formulario la pasa cuando la fecha es hoy:
   * así no se puede registrar un accidente futuro.
   */
  max?: string;
  disabled?: boolean;
  className?: string;
} & Pick<InputProps, "name" | "required" | "aria-invalid" | "aria-describedby">;

/** Campo de hora: se puede escribir a mano o elegir hora y minutos de la lista. */
export function TimePicker({ id, value, onChange, max, disabled, className = "", ...props }: TimePickerProps) {
  const [abierto, setAbierto] = useState(false);
  const [hora, setHora] = useState<string | null>(null);
  const [minuto, setMinuto] = useState<string | null>(null);
  const contenedor = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const listaHoras = useRef<HTMLDivElement>(null);
  const listaMinutos = useRef<HTMLDivElement>(null);

  const [horaMax, minutoMax] = max ? max.split(":") : [null, null];

  const cerrar = (devolverFoco = true) => {
    setAbierto(false);
    if (devolverFoco) document.getElementById(id)?.focus();
  };

  const abrir = () => {
    const partes = parsearHora(value);
    setHora(partes ? partes.slice(0, 2) : null);
    setMinuto(partes ? partes.slice(3) : null);
    setAbierto(true);
  };

  useEffect(() => {
    if (!abierto) return;
    const moverAlSeleccionado = (lista: HTMLDivElement | null) => {
      const elegido = lista?.querySelector<HTMLElement>('[aria-pressed="true"]');
      elegido?.scrollIntoView?.({ block: "center" });
    };
    moverAlSeleccionado(listaHoras.current);
    moverAlSeleccionado(listaMinutos.current);

    const cerrarAfuera = (evento: PointerEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false);
    };
    const cerrarConEscape = (evento: KeyboardEvent) => {
      if (evento.key !== "Escape") return;
      setAbierto(false);
      boton.current?.focus();
    };
    document.addEventListener("pointerdown", cerrarAfuera);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("pointerdown", cerrarAfuera);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [abierto]);

  const elegirHora = (nueva: string) => {
    setHora(nueva);
    if (!minuto) return;
    // Si la hora elegida es la máxima, el minuto no puede pasarse del actual.
    const ajustado =
      horaMax !== null && nueva === horaMax && minutoMax !== null && minuto > minutoMax ? minutoMax : minuto;
    if (ajustado !== minuto) setMinuto(ajustado);
    onChange(`${nueva}:${ajustado}`);
  };

  const elegirMinuto = (nuevo: string) => {
    const elegida = hora ?? "00";
    setMinuto(nuevo);
    onChange(`${elegida}:${nuevo}`);
    cerrar();
  };

  return (
    <div className={`relative ${className}`} ref={contenedor}>
      <Input
        {...props}
        id={id}
        value={value}
        disabled={disabled}
        placeholder="hh:mm"
        autoComplete="off"
        inputMode="numeric"
        className="pr-11 font-mono"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        onChange={(evento) => onChange(evento.target.value)}
        onKeyDown={(evento) => {
          if (evento.key === "Escape" && abierto) setAbierto(false);
        }}
      />
      <button
        ref={boton}
        type="button"
        disabled={disabled}
        aria-label={abierto ? "Cerrar selector de hora" : "Abrir selector de hora"}
        aria-expanded={abierto}
        onClick={() => (abierto ? cerrar() : abrir())}
        className={`absolute right-0 top-0 flex h-(--size-control) w-10 items-center justify-center rounded-r-md text-text-muted transition-colors hover:text-text-primary disabled:text-text-disabled disabled:cursor-not-allowed ${focus}`}
      >
        <Clock size={16} strokeWidth={1.5} aria-hidden />
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Elegir hora"
          className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-52 rounded-lg border border-border-strong bg-bg-surface p-2"
        >
          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <p aria-hidden className="text-eyebrow px-1">
                Hora
              </p>
              <div ref={listaHoras} role="group" aria-label="Hora" className="max-h-64 overflow-y-auto">
                {HORAS.map((h) => {
                  const inhabilitada = horaMax !== null && h > horaMax;
                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={inhabilitada}
                      aria-pressed={h === hora}
                      onClick={() => elegirHora(h)}
                      className={`min-h-11 w-full rounded-sm px-2 py-1 text-center text-sm font-mono tabular-nums transition-colors md:min-h-8 ${
                        h === hora
                          ? "bg-accent-fill text-white"
                          : "text-text-secondary hover:bg-bg-raised hover:text-text-primary disabled:cursor-not-allowed disabled:bg-transparent disabled:text-text-disabled"
                      } ${focus}`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-1">
              <p aria-hidden className="text-eyebrow px-1">
                Min
              </p>
              <div ref={listaMinutos} role="group" aria-label="Minutos" className="max-h-64 overflow-y-auto">
                {MINUTOS.map((m) => {
                  // Sin hora elegida el minuto se combina con las 00.
                  const horaParaMinutos = hora ?? "00";
                  const inhabilitado =
                    horaMax !== null && horaParaMinutos === horaMax && minutoMax !== null && m > minutoMax;
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={inhabilitado}
                      aria-pressed={m === minuto}
                      onClick={() => elegirMinuto(m)}
                      className={`min-h-11 w-full rounded-sm px-2 py-1 text-center text-sm font-mono tabular-nums transition-colors md:min-h-8 ${
                        m === minuto
                          ? "bg-accent-fill text-white"
                          : "text-text-secondary hover:bg-bg-raised hover:text-text-primary disabled:cursor-not-allowed disabled:bg-transparent disabled:text-text-disabled"
                      } ${focus}`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
