import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, Pencil, Plus } from "lucide-react";
import { focus } from "@/components/centralbv/estilos";

export interface OpcionCatalogo {
  id: string;
  nombre: string;
}

/**
 * Select de un catálogo (tipo, marca o modelo) con las acciones de Figma al pie:
 * "+ Agregar … nuevo" y "Gestionar …". Es un combobox de solo selección (ARIA 1.2):
 * no usa <select> nativo porque las acciones no pueden ir dentro de las opciones.
 */
export default function SelectorCatalogo({
  id,
  valor,
  opciones,
  placeholder,
  disabled,
  error,
  required,
  onCambiar,
  agregar,
  gestionar,
}: {
  id: string;
  valor: string;
  opciones: OpcionCatalogo[];
  placeholder: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  onCambiar: (id: string) => void;
  /** Texto y acción de "+ Agregar … nuevo". Sin esto no se muestra. */
  agregar?: { texto: string; onClick: () => void };
  gestionar?: { texto: string; onClick: () => void };
}) {
  const listaId = useId();
  const contenedor = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const pie = useRef<HTMLDivElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);

  const elegido = opciones.find((o) => o.id === valor);
  const opcionId = (i: number) => `${listaId}-opcion-${i}`;

  const abrir = () => {
    if (disabled) return;
    const i = opciones.findIndex((o) => o.id === valor);
    setActivo(i >= 0 ? i : 0);
    setAbierto(true);
  };

  const cerrar = (devolverFoco = true) => {
    setAbierto(false);
    if (devolverFoco) boton.current?.focus();
  };

  const elegir = (i: number) => {
    const opcion = opciones[i];
    if (opcion) onCambiar(opcion.id);
    cerrar();
  };

  // Al abrir, el foco pasa a la lista (las flechas recorren las opciones).
  // Sin opciones, pasa a la primera acción ("Agregar … nuevo").
  useEffect(() => {
    if (!abierto) return;
    if (lista.current) lista.current.focus();
    else pie.current?.querySelector("button")?.focus();
  }, [abierto]);

  // Mantener visible la opción activa al moverse con el teclado.
  useEffect(() => {
    if (!abierto) return;
    document.getElementById(opcionId(activo))?.scrollIntoView?.({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, abierto]);

  // Clic afuera cierra sin elegir.
  useEffect(() => {
    if (!abierto) return;
    const alClic = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", alClic);
    return () => document.removeEventListener("mousedown", alClic);
  }, [abierto]);

  const teclaBoton = (e: KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault();
      abrir();
    }
  };

  const teclaLista = (e: KeyboardEvent) => {
    const ultimo = opciones.length - 1;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActivo((i) => Math.min(i + 1, ultimo));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActivo((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActivo(0);
        break;
      case "End":
        e.preventDefault();
        setActivo(ultimo);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        elegir(activo);
        break;
      case "Escape":
        e.preventDefault();
        cerrar();
        break;
    }
  };

  const accion = (fn: () => void) => () => {
    setAbierto(false);
    fn();
  };

  return (
    <div
      ref={contenedor}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape" && abierto) {
          e.preventDefault();
          cerrar();
        }
      }}
      onBlur={(e) => {
        // Si el foco sale del selector (Tab), se cierra.
        if (abierto && !contenedor.current?.contains(e.relatedTarget as Node | null)) setAbierto(false);
      }}
    >
      <button
        ref={boton}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={abierto ? listaId : undefined}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        disabled={disabled}
        onClick={() => (abierto ? cerrar() : abrir())}
        onKeyDown={teclaBoton}
        className={`flex h-(--size-control) w-full items-center justify-between gap-2 rounded-md border border-border-input bg-bg-base px-3 text-left text-base md:text-sm aria-invalid:border-state-danger disabled:cursor-not-allowed disabled:opacity-60 ${focus}`}
      >
        <span className={`truncate ${elegido ? "text-text-primary" : "text-text-muted"}`}>
          {elegido?.nombre ?? placeholder}
        </span>
        <ChevronDown size={16} strokeWidth={1.5} aria-hidden className="shrink-0 text-text-muted" />
      </button>

      {abierto && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-border-strong bg-bg-surface py-1">
          {opciones.length > 0 ? (
            <ul
              ref={lista}
              id={listaId}
              role="listbox"
              tabIndex={-1}
              aria-activedescendant={opcionId(activo)}
              onKeyDown={teclaLista}
              className="max-h-72 overflow-y-auto outline-none"
            >
              {opciones.map((o, i) => {
                const seleccionada = o.id === valor;
                return (
                  <li
                    key={o.id}
                    id={opcionId(i)}
                    role="option"
                    aria-selected={seleccionada}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActivo(i)}
                    onClick={() => elegir(i)}
                    className={`flex h-10 cursor-pointer items-center justify-between gap-2 px-3 text-sm ${
                      i === activo ? "bg-bg-raised" : ""
                    }`}
                  >
                    <span className="truncate">{o.nombre}</span>
                    {seleccionada && (
                      <Check size={16} strokeWidth={1.5} aria-hidden className="shrink-0 text-state-ok" />
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-3 py-2.5 text-sm text-text-muted">Todavía no hay opciones.</p>
          )}

          <div ref={pie}>
          {(agregar || gestionar) && <div aria-hidden className="my-1 border-t border-border-subtle" />}
          {agregar && (
            <button
              type="button"
              onClick={accion(agregar.onClick)}
              className={`flex h-10 w-full items-center gap-2 px-3 text-left text-sm text-accent-text hover:bg-bg-raised ${focus}`}
            >
              <Plus size={16} strokeWidth={1.5} aria-hidden />
              {agregar.texto}
            </button>
          )}
          {gestionar && (
            <button
              type="button"
              onClick={accion(gestionar.onClick)}
              className={`flex h-10 w-full items-center gap-2 px-3 text-left text-sm text-text-secondary hover:bg-bg-raised ${focus}`}
            >
              <Pencil size={16} strokeWidth={1.5} aria-hidden />
              {gestionar.texto}
            </button>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
