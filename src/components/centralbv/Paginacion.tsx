import { Button } from "./Button";

/** Pie de una lista paginada: "13–24 de 31" y los botones Anterior / Siguiente.
    Lo usan las solicitudes (US09) y el dashboard de flota (US05). */
export function Paginacion({
  pagina,
  paginas,
  desde,
  hasta,
  total,
  onPagina,
  className = "",
}: {
  pagina: number;
  paginas: number;
  desde: number;
  hasta: number;
  total: number;
  onPagina: (pagina: number) => void;
  className?: string;
}) {
  return (
    <nav aria-label="Paginación" className={`flex items-center justify-between gap-4 ${className}`}>
      <p className="text-code text-text-muted tabular-nums">
        {desde}–{hasta} de {total}
      </p>
      <div className="flex gap-2">
        <Button disabled={pagina <= 1} onClick={() => onPagina(pagina - 1)}>
          Anterior
        </Button>
        <Button disabled={pagina >= paginas} onClick={() => onPagina(pagina + 1)}>
          Siguiente
        </Button>
      </div>
    </nav>
  );
}
