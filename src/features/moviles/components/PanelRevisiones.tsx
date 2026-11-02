import { useEffect, useRef, useState } from "react";
import { ClipboardList, CircleX, RotateCcw, SearchX } from "lucide-react";
import { Button } from "@/components/centralbv/Button";
import { EmptyState } from "@/components/centralbv/EmptyState";
import { focus } from "@/components/centralbv/estilos";
import { useConsulta } from "@/features/constancias/hooks/useConsulta";
import { ErrorApi } from "@/lib/http";
import { listarRevisiones, obtenerRevision } from "../api/flotaApi";
import { formatearInstante, resumenRevision, type PaginaRevisiones, type RevisionMovil } from "../domain/revision";
import EstadoMovilBadge from "./EstadoMovilBadge";
import { DetalleRevision } from "./PanelesFicha";

/**
 * Pestaña Revisiones de la ficha (US07 · T48): el historial de revisiones del móvil, de la más
 * nueva a la más vieja, de a 10 con "Ver más", y el detalle de la elegida. Sin elegir, se ve la
 * más nueva. La elegida va en la URL (?revision=), así un link abre esa revisión aunque no esté
 * en las páginas cargadas. En desktop, lista y detalle van lado a lado; en mobile, uno abajo del otro.
 */
export default function PanelRevisiones({
  movilId,
  seleccion,
  onSeleccionar,
}: {
  movilId: string;
  /** Revisión elegida (de la URL); sin ella, la más nueva. */
  seleccion?: string;
  onSeleccionar: (revisionId: string) => void;
}) {
  const [hasta, setHasta] = useState(1); // última página pedida
  const [paginas, setPaginas] = useState<Record<number, PaginaRevisiones>>({});
  const [paginaConError, setPaginaConError] = useState<number>();
  const [intento, setIntento] = useState(0);
  const detalle = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let vigente = true;
    listarRevisiones(movilId, hasta).then(
      (p) => vigente && setPaginas((prev) => ({ ...prev, [hasta]: p })),
      () => vigente && setPaginaConError(hasta),
    );
    return () => {
      vigente = false;
    };
  }, [movilId, hasta, intento]);

  const reintentar = () => {
    setPaginaConError(undefined);
    setIntento((n) => n + 1);
  };

  const cargadas: RevisionMovil[] = [];
  for (let n = 1; n <= hasta; n++) cargadas.push(...(paginas[n]?.items ?? []));
  const total = paginas[1]?.total ?? 0;
  const cargando = !paginas[hasta] && paginaConError !== hasta;

  const idElegida = seleccion ?? cargadas[0]?.id;
  const enLista = cargadas.find((r) => r.id === idElegida);
  // Una revisión que llegó por link y no está en las páginas cargadas se pide sola.
  const buscarAparte = Boolean(seleccion && paginas[1] && !enLista);
  const aparte = useConsulta(`revision:${movilId}:${buscarAparte ? seleccion : "-"}`, () =>
    buscarAparte && seleccion ? obtenerRevision(movilId, seleccion) : Promise.resolve(null),
  );

  if (!paginas[1]) {
    if (paginaConError === 1) {
      return (
        <EmptyState
          compacto
          tone="danger"
          icon={CircleX}
          title="No pudimos cargar las revisiones"
          description="Revisá tu conexión e intentá de nuevo."
          action={
            <Button onClick={reintentar}>
              <RotateCcw size={16} strokeWidth={1.5} aria-hidden />
              Reintentar
            </Button>
          }
        />
      );
    }
    return (
      <div role="status" aria-label="Cargando revisiones" className="h-64 animate-pulse rounded-lg border border-border-subtle bg-bg-surface" />
    );
  }

  if (total === 0) {
    return (
      <EmptyState
        compacto
        icon={ClipboardList}
        title="Todavía no hay revisiones"
        description="Registrá la primera revisión del móvil con el botón Registrar revisión."
      />
    );
  }

  const elegir = (id: string) => {
    onSeleccionar(id);
    // En mobile el detalle queda abajo de la lista: lo acercamos.
    if (window.matchMedia?.("(max-width: 1023px)").matches) {
      detalle.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
  };

  let contenidoDetalle;
  if (enLista) {
    contenidoDetalle = <DetalleRevision revision={enLista} />;
  } else if (aparte.consulta.estado === "listo" && aparte.consulta.datos) {
    contenidoDetalle = <DetalleRevision revision={aparte.consulta.datos} />;
  } else if (aparte.consulta.estado === "error") {
    const noExiste = aparte.consulta.error instanceof ErrorApi && [400, 404].includes(aparte.consulta.error.status);
    contenidoDetalle = noExiste ? (
      <EmptyState compacto icon={SearchX} title="Revisión no encontrada" description="La revisión del enlace no existe o es de otro móvil." />
    ) : (
      <EmptyState
        compacto
        tone="danger"
        icon={CircleX}
        title="No pudimos cargar la revisión"
        description="Revisá tu conexión e intentá de nuevo."
        action={
          <Button onClick={aparte.reintentar}>
            <RotateCcw size={16} strokeWidth={1.5} aria-hidden />
            Reintentar
          </Button>
        }
      />
    );
  } else {
    contenidoDetalle = <div aria-hidden className="h-64 animate-pulse rounded-lg border border-border-subtle bg-bg-surface" />;
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <section aria-labelledby="historial-titulo" className="flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-bg-surface">
        <header className="flex items-baseline justify-between gap-2 border-b border-border-subtle px-4 py-3">
          <h2 id="historial-titulo" className="text-sm font-semibold">
            Historial
          </h2>
          <p className="text-xs text-text-muted">
            {total} {total === 1 ? "revisión" : "revisiones"}
          </p>
        </header>
        <ul aria-label="Revisiones del móvil" className="flex flex-col">
          {cargadas.map((r) => {
            const elegida = r.id === idElegida;
            return (
              <li key={r.id} className="border-b border-border-subtle last:border-b-0">
                <button
                  type="button"
                  aria-current={elegida ? "true" : undefined}
                  onClick={() => elegir(r.id)}
                  className={`flex w-full flex-col gap-1.5 border-l-2 px-4 py-3 text-left transition-colors ${
                    elegida ? "border-accent-fill bg-bg-raised" : "border-transparent hover:bg-bg-raised"
                  } ${focus}`}
                >
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm tabular-nums">{formatearInstante(r.realizadaEn)}</span>
                    <EstadoMovilBadge estado={r.resultado} />
                  </span>
                  <span className="text-xs text-text-secondary">{resumenRevision(r.items)}</span>
                  {r.revisadoPor && <span className="text-xs text-text-muted">Por {r.revisadoPor}</span>}
                </button>
              </li>
            );
          })}
        </ul>
        {(cargadas.length < total || cargando || paginaConError) && (
          <div className="flex flex-col items-stretch gap-2 border-t border-border-subtle p-3">
            {paginaConError && paginaConError > 1 ? (
              <p className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-secondary" role="alert">
                No pudimos cargar más revisiones.
                <Button onClick={reintentar}>Reintentar</Button>
              </p>
            ) : (
              <Button onClick={() => setHasta((n) => n + 1)} disabled={cargando} aria-busy={cargando}>
                {cargando ? "Cargando…" : "Ver más"}
              </Button>
            )}
          </div>
        )}
      </section>

      <div ref={detalle} className="scroll-mt-4">
        {contenidoDetalle}
      </div>
    </div>
  );
}
