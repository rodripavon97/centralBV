import { useEffect, useRef, useState, type ComponentProps } from "react";
import Calendar from "react-calendar";
import { CalendarDays } from "lucide-react";
import { Input } from "./Field";
import { focus } from "./estilos";
import { fechaAISO, fechaDesdeISO, formatearFecha, parsearFecha } from "@/lib/fecha";

type InputProps = ComponentProps<typeof Input>;

export type DatePickerProps = {
  id: string;
  /** Fecha en texto: "dd/mm/aaaa". Vacío si todavía no se eligió. */
  value: string;
  onChange: (fecha: string) => void;
  /** Último día elegible. Por defecto, hoy: no se pueden cargar hechos futuros. */
  maxDate?: Date;
  disabled?: boolean;
  className?: string;
} & Pick<InputProps, "name" | "required" | "aria-invalid" | "aria-describedby">;

/** Campo de fecha con calendario. Se puede escribir a mano o elegir del calendario. */
export function DatePicker({ id, value, onChange, maxDate = new Date(), disabled, className = "", ...props }: DatePickerProps) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

  const iso = parsearFecha(value);
  const seleccionada = iso ? fechaDesdeISO(iso) : null;

  useEffect(() => {
    if (!abierto) return;
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

  return (
    <div className={`relative ${className}`} ref={contenedor}>
      <Input
        {...props}
        id={id}
        value={value}
        disabled={disabled}
        placeholder="dd/mm/aaaa"
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
        aria-label={abierto ? "Cerrar calendario" : "Abrir calendario"}
        aria-expanded={abierto}
        onClick={() => setAbierto((estaAbierto) => !estaAbierto)}
        className={`absolute right-0 top-0 flex h-(--size-control) w-10 items-center justify-center rounded-r-md text-text-muted transition-colors hover:text-text-primary disabled:text-text-disabled disabled:cursor-not-allowed ${focus}`}
      >
        <CalendarDays size={16} strokeWidth={1.5} aria-hidden />
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Elegir fecha"
          className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-[19rem] max-w-[calc(100vw-2rem)] rounded-lg border border-border-strong bg-bg-surface p-2"
        >
          <Calendar
            locale="es-AR"
            calendarType="gregory"
            value={seleccionada}
            maxDate={maxDate}
            minDetail="month"
            showNeighboringMonth={false}
            next2Label={null}
            prev2Label={null}
            nextAriaLabel="Mes siguiente"
            prevAriaLabel="Mes anterior"
            formatLongDate={(_, fecha) => formatearFecha(fechaAISO(fecha))}
            onChange={(valor) => {
              if (!(valor instanceof Date)) return;
              onChange(formatearFecha(fechaAISO(valor)));
              setAbierto(false);
              document.getElementById(id)?.focus();
            }}
          />
        </div>
      )}
    </div>
  );
}
