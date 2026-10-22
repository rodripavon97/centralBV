import { useEffect, useRef, useState, type FormEvent } from "react";
import { CircleX } from "lucide-react";
import { Button } from "@/components/centralbv/Button";
import { Field, Textarea } from "@/components/centralbv/Field";
import { Alert } from "@/components/centralbv/Feedback";

/** Confirmación de cancelación con motivo obligatorio (US13 y T19). */
export default function CancelarSolicitudDialog({
  numero,
  abierto,
  onCerrar,
  onConfirmar,
}: {
  numero: string;
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: (motivo: string) => Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string>();

  // <dialog> nativo: atrapa el foco, cierra con Escape y pone el fondo.
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

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
      setError(err instanceof Error ? err.message : "No se pudo cancelar la solicitud");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby="cancelar-titulo"
      onCancel={(e) => {
        e.preventDefault();
        cerrar();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border-strong bg-bg-surface p-6 text-text-primary backdrop:bg-black/70"
    >
      <form onSubmit={confirmar} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 id="cancelar-titulo" className="text-lg font-semibold">
            ¿Cancelar la solicitud <span className="font-mono">{numero}</span>?
          </h2>
          <p className="text-sm text-text-secondary">
            La solicitud queda como Cancelada. Indicá el motivo para dejarlo registrado.
          </p>
        </div>
        <Field id="motivo" label="Motivo de la cancelación" required>
          <Textarea
            id="motivo"
            name="motivo"
            required
            autoFocus
            placeholder="Ej.: el pedido no corresponde"
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
          <Button type="submit" variant="primary" disabled={!motivo.trim() || enviando}>
            {enviando ? "Cancelando…" : "Sí, cancelar solicitud"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
