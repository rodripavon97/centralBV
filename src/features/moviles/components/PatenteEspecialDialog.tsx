import { Button } from "@/components/centralbv/Button";
import { normalizarPatente } from "../domain/patente";
import Dialogo from "./Dialogo";

/** "US04 · Alta · patente con formato especial (confirmar)" de Figma. */
export default function PatenteEspecialDialog({
  abierto,
  patente,
  guardando,
  onRevisar,
  onGuardarIgual,
}: {
  abierto: boolean;
  patente: string;
  guardando: boolean;
  onRevisar: () => void;
  onGuardarIgual: () => void;
}) {
  return (
    <Dialogo
      abierto={abierto}
      titulo="Patente con formato especial"
      tituloId="patente-especial-titulo"
      onCerrar={() => !guardando && onRevisar()}
    >
      <p className="text-sm text-text-secondary">
        <span className="font-mono text-text-primary">{normalizarPatente(patente)}</span> no coincide con ningún
        formato argentino conocido (AB 123 CD, ABC 123, A 123 BCD, 123 ABC o B 1234567). Si es una patente oficial o un
        caso especial, podés guardarla igual.
      </p>
      <p className="text-xs text-text-muted">Revisá que esté bien escrita antes de guardar.</p>
      <div className="flex justify-end gap-3">
        <Button onClick={onRevisar} disabled={guardando} className="min-w-28">
          Revisar
        </Button>
        <Button variant="primary" onClick={onGuardarIgual} disabled={guardando} className="min-w-28">
          {guardando ? "Guardando…" : "Guardar igual"}
        </Button>
      </div>
    </Dialogo>
  );
}
