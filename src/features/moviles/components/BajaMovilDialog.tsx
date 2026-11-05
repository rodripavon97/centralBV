import { useState, type FormEvent } from "react";
import { CircleX } from "lucide-react";
import { Alert } from "@/components/centralbv/Alert";
import { Button } from "@/components/centralbv/Button";
import { Field, Textarea } from "@/components/centralbv/Field";
import Dialogo from "./Dialogo";

/** Confirmación de baja definitiva con motivo obligatorio (solo ADMIN). */
export default function BajaMovilDialog({
  codigo,
  abierto,
  onCerrar,
  onConfirmar,
}: {
  codigo: string;
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: (motivo: string) => Promise<void>;
}) {
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string>();

  const cerrar = () => {
    if (enviando) return;
    setMotivo("");
    setError(undefined);
    onCerrar();
  };

  const confirmar = async (e: FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) return;
    setEnviando(true);
    setError(undefined);
    try {
      await onConfirmar(motivo.trim());
      setMotivo("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo dar de baja el móvil");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialogo
      abierto={abierto}
      titulo={
        <>
          ¿Dar de baja definitiva a <span className="font-mono">{codigo}</span>?
        </>
      }
      tituloId="baja-movil-titulo"
      onCerrar={cerrar}
      ancho="max-w-md"
    >
      <form onSubmit={confirmar} className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">
          El móvil queda fuera de la flota activa. Indicá el motivo para dejarlo registrado. Esta acción no se puede
          revertir desde la aplicación.
        </p>
        <Field id="motivo-baja" label="Motivo de la baja" required>
          <Textarea
            id="motivo-baja"
            name="motivo"
            required
            autoFocus
            placeholder="Ej.: fin de vida útil"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </Field>
        {error && (
          <Alert tone="danger" icon={CircleX} role="alert">
            {error}
          </Alert>
        )}
        <div className="flex justify-end gap-3">
          <Button onClick={cerrar} disabled={enviando}>
            Volver
          </Button>
          <Button type="submit" variant="danger" disabled={!motivo.trim() || enviando}>
            {enviando ? "Dando de baja…" : "Sí, dar de baja"}
          </Button>
        </div>
      </form>
    </Dialogo>
  );
}
