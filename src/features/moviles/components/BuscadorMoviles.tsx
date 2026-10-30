import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/centralbv/Field";
import { focus } from "@/components/centralbv/estilos";
import { MAX_BUSQUEDA } from "../domain/busquedaMoviles";

/** Espera antes de buscar mientras se escribe. */
export const DEMORA_BUSQUEDA_MS = 300;

/**
 * Buscador de la lista de móviles (Figma S2): "Buscá por número interno o patente".
 * El texto se escribe en un estado local y se manda con un pequeño retraso; `valor`
 * viene de la URL, así el Atrás o un link compartido muestran la misma búsqueda.
 */
export default function BuscadorMoviles({ valor, onBuscar }: { valor: string; onBuscar: (texto: string) => void }) {
  const [texto, setTexto] = useState(valor);
  const [valorPrevio, setValorPrevio] = useState(valor);
  if (valor !== valorPrevio) {
    setValorPrevio(valor);
    setTexto(valor);
  }

  useEffect(() => {
    if (texto.trim() === valor) return;
    const t = setTimeout(() => onBuscar(texto.trim()), DEMORA_BUSQUEDA_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto, valor]);

  const limpiar = () => {
    setTexto("");
    onBuscar("");
  };

  return (
    <div className="relative w-full max-w-[26rem]">
      <Search
        size={16}
        strokeWidth={1.5}
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
      />
      <Input
        type="search"
        aria-label="Buscar móviles por número interno o patente"
        placeholder="Buscá por número interno o patente"
        maxLength={MAX_BUSQUEDA}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onBuscar(texto.trim());
          if (e.key === "Escape" && texto) {
            e.preventDefault();
            limpiar();
          }
        }}
        className="pl-9 pr-10 [&::-webkit-search-cancel-button]:hidden"
      />
      {texto && (
        <button
          type="button"
          onClick={limpiar}
          aria-label="Borrar el texto de búsqueda"
          className={`absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-text-muted hover:bg-bg-raised hover:text-text-primary ${focus}`}
        >
          <X size={16} strokeWidth={1.5} aria-hidden />
        </button>
      )}
    </div>
  );
}
