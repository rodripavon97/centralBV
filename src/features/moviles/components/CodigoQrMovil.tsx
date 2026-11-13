import { useState } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/centralbv/Button";
import type { MovilFlota } from "../domain/movil";
import EtiquetaMovilQr from "./EtiquetaMovilQr";
import ImprimirEtiquetaMovilDialog from "./ImprimirEtiquetaMovilDialog";

/** Sección de la ficha: QR de revisión + botón para imprimir la etiqueta. */
export default function CodigoQrMovil({ movil }: { movil: MovilFlota }) {
  const [imprimiendo, setImprimiendo] = useState(false);

  return (
    <>
      <div className="grid flex-1 grid-cols-1 items-center gap-6 sm:grid-cols-2">
        <div className="flex flex-col items-center gap-4 text-center sm:items-start sm:text-left">
          <p className="text-sm text-text-secondary">
            Escaneá el código para abrir el formulario de revisión de este
            móvil.
          </p>
          <Button onClick={() => setImprimiendo(true)}>
            <Printer size={16} strokeWidth={1.5} aria-hidden />
            Imprimir
          </Button>
        </div>
        <EtiquetaMovilQr movil={movil} size={220} />
      </div>

      <ImprimirEtiquetaMovilDialog
        movil={movil}
        abierto={imprimiendo}
        onCerrar={() => setImprimiendo(false)}
      />
    </>
  );
}
