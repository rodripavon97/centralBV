import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import { Button } from "@/components/centralbv/Button";
import type { MovilFlota } from "../domain/movil";
import EtiquetaMovilQr from "./EtiquetaMovilQr";

/** Preview + portal de impresión de la etiqueta QR del móvil. */
export default function ImprimirEtiquetaMovilDialog({
  movil,
  abierto,
  onCerrar,
}: {
  movil: MovilFlota;
  abierto: boolean;
  onCerrar: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    // jsdom no implementa showModal: en tests alcanza con el atributo open.
    if (abierto && !d.open) {
      if (typeof d.showModal === "function") d.showModal();
      else d.setAttribute("open", "");
    }
    if (!abierto && d.open) {
      if (typeof d.close === "function") d.close();
      else d.removeAttribute("open");
    }
  }, [abierto]);

  const imprimir = () => {
    onCerrar();
    window.setTimeout(() => window.print(), 100);
  };

  return (
    <>
      <dialog
        ref={ref}
        aria-labelledby="imprimir-etiqueta-titulo"
        onCancel={(e) => {
          e.preventDefault();
          onCerrar();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border-strong bg-bg-surface p-6 text-text-primary backdrop:bg-black/70"
      >
        <div className="flex flex-col gap-6">
          <h2 id="imprimir-etiqueta-titulo" className="text-xl font-semibold">
            Imprimir etiqueta
          </h2>

          <div className="flex justify-center rounded-lg bg-bg-raised p-6">
            <EtiquetaMovilQr movil={movil} size={180} />
          </div>

          <p className="text-center text-xs text-text-muted">
            Al escanear el código se abre el formulario de revisión de este móvil.
          </p>

          <div className="flex justify-end gap-3">
            <Button onClick={onCerrar}>Cancelar</Button>
            <Button variant="primary" onClick={imprimir}>
              <Printer size={16} strokeWidth={1.5} aria-hidden />
              Imprimir
            </Button>
          </div>
        </div>
      </dialog>

      {createPortal(
        <div id="etiqueta-movil-impresion" aria-hidden>
          <div className="etiqueta-movil-hoja">
            <EtiquetaMovilQr movil={movil} size={220} />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
