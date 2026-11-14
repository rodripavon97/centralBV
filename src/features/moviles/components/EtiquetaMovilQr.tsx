import { QRCodeSVG } from "qrcode.react";
import { formatearPatente } from "../domain/patente";
import { urlRevisionMovil } from "../domain/enlaceRevision";
import type { MovilFlota } from "../domain/movil";

/** Contenido visual de la etiqueta (pantalla e impresión). */
export default function EtiquetaMovilQr({
  movil,
  size = 160,
  className = "",
}: {
  movil: MovilFlota;
  size?: number;
  className?: string;
}) {
  const url = urlRevisionMovil(movil.id);

  return (
    <div className={`flex flex-col items-center gap-3 text-center ${className}`}>
      <QRCodeSVG value={url} size={size} level="M" marginSize={1} title={`QR de revisión de ${movil.codigo}`} />
      <div className="flex flex-col gap-0.5">
        <p className="text-base font-semibold">{movil.codigo}</p>
        <p className="font-mono text-sm">{formatearPatente(movil.patente)}</p>
      </div>
    </div>
  );
}
