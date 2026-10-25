import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import { Button } from "@/components/centralbv/Button";
import { Select } from "@/components/centralbv/Field";
import type { Solicitud } from "@/types/dominio";
import HojaConstancia from "./HojaConstancia";
import { HojaMiniatura } from "./HojaEscalada";

const HOJAS = [
  { numero: 1, etiqueta: "Hoja 1 · Archivo del cuartel" },
  { numero: 2, etiqueta: "Hoja 2 · Domiciliado" },
  { numero: 3, etiqueta: "Hoja 3 · Domiciliado (copia)" },
];

/** Modal de impresión + las 3 hojas que se mandan a la impresora. */
export default function ImprimirConstanciaDialog({
  solicitud,
  observaciones,
  abierto,
  onCerrar,
}: {
  solicitud: Solicitud;
  observaciones?: string;
  abierto: boolean;
  onCerrar: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  // <dialog> nativo: atrapa el foco, cierra con Escape y pone el fondo.
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  const imprimir = () => {
    onCerrar();
    // Dejar que el diálogo se cierre antes de abrir el diálogo del sistema.
    window.setTimeout(() => window.print(), 100);
  };

  return (
    <>
      <dialog
        ref={ref}
        aria-labelledby="imprimir-titulo"
        onCancel={(e) => {
          e.preventDefault();
          onCerrar();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-4xl rounded-xl border border-border-strong bg-bg-surface p-6 text-text-primary backdrop:bg-black/70"
      >
        <div className="flex flex-col gap-6">
          <h2 id="imprimir-titulo" className="text-xl font-semibold">
            Imprimir
          </h2>

          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_15rem]">
            <div className="flex flex-col gap-3 rounded-lg bg-bg-raised p-4">
              <div className="flex items-start justify-center gap-2">
                {HOJAS.map(({ numero, etiqueta }) => (
                  <figure key={numero} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <div className="w-full max-w-[7.5rem] overflow-hidden border border-border-strong">
                      <HojaMiniatura ancho={120}>
                        <HojaConstancia
                          solicitud={solicitud}
                          observaciones={observaciones}
                          conFirmas={numero === 1}
                        />
                      </HojaMiniatura>
                    </div>
                    <figcaption className="text-center text-xs text-text-secondary">{etiqueta}</figcaption>
                  </figure>
                ))}
              </div>
              <p className="text-center text-xs text-text-muted">3 páginas · A4 · 210 × 297 mm</p>
            </div>

            <div className="flex flex-col gap-4">
              <Campo id="impresora" label="Destino">
                <Select id="impresora" defaultValue="cuartel">
                  <option value="cuartel">Impresora del cuartel</option>
                  <option value="sistema">Diálogo del sistema</option>
                </Select>
              </Campo>
              <Campo id="paginas" label="Páginas">
                <Select id="paginas" defaultValue="todas">
                  <option value="todas">Todas (3)</option>
                </Select>
              </Campo>
              <Campo id="papel" label="Tamaño de papel">
                <Select id="papel" defaultValue="a4">
                  <option value="a4">A4 (210 × 297 mm)</option>
                </Select>
              </Campo>
              <Campo id="margenes" label="Márgenes">
                <Select id="margenes" defaultValue="predeterminados">
                  <option value="predeterminados">Predeterminados</option>
                </Select>
              </Campo>
              <Campo id="escala" label="Escala">
                <Select id="escala" defaultValue="ajustar">
                  <option value="ajustar">Ajustar a la página</option>
                </Select>
              </Campo>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-sm text-xs text-text-muted">
              La hoja 1 queda en el cuartel. Las hojas 2 y 3 se entregan a damnificados.
            </p>
            <div className="flex gap-3">
              <Button onClick={onCerrar}>Cancelar</Button>
              <Button variant="primary" onClick={imprimir}>
                <Printer size={16} strokeWidth={1.5} aria-hidden />
                Imprimir
              </Button>
            </div>
          </div>
        </div>
      </dialog>

      {createPortal(
        <div id="constancia-impresion" aria-hidden>
          {HOJAS.map(({ numero }) => (
            <HojaConstancia
              key={numero}
              solicitud={solicitud}
              observaciones={observaciones}
              conFirmas={numero === 1}
            />
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

function Campo({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-text-secondary">
        {label}
      </label>
      {children}
    </div>
  );
}
