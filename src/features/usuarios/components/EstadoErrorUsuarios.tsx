import { CircleAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/centralbv/Button";

/** Panel compacto de error del listado, con reintento. */
export default function EstadoErrorUsuarios({ onReintentar }: { onReintentar: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border-subtle bg-bg-surface px-6 py-8 text-center"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-accent-subtle text-accent-text">
        <CircleAlert size={20} strokeWidth={1.5} aria-hidden />
      </span>
      <h2 className="text-base font-semibold">No pudimos cargar los usuarios</h2>
      <p className="text-sm text-text-muted">Revisá tu conexión e intentá de nuevo.</p>
      <Button onClick={onReintentar} className="mt-1">
        <RotateCcw size={16} strokeWidth={1.5} aria-hidden />
        Reintentar
      </Button>
    </div>
  );
}
