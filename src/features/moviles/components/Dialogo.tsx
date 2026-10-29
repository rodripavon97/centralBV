import { useEffect, useRef, type ReactNode } from "react";

/**
 * Modal de Figma (S3 Alta): <dialog> nativo, que atrapa el foco, cierra con
 * Escape y pone el fondo. `onCerrar` se llama con Escape; el padre decide.
 */
export default function Dialogo({
  abierto,
  titulo,
  tituloId,
  onCerrar,
  ancho = "max-w-[35rem]",
  children,
}: {
  abierto: boolean;
  titulo: ReactNode;
  tituloId: string;
  onCerrar: () => void;
  ancho?: string;
  children: ReactNode;
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

  return (
    <dialog
      ref={ref}
      aria-labelledby={tituloId}
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
      className={`m-auto w-[calc(100%-2rem)] ${ancho} rounded-xl border border-border-strong bg-bg-surface p-8 text-text-primary backdrop:bg-black/70`}
    >
      {abierto && (
        <div className="flex flex-col gap-5">
          <h2 id={tituloId} className="text-lg font-semibold">
            {titulo}
          </h2>
          {children}
        </div>
      )}
    </dialog>
  );
}
