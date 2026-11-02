import type { ReactNode } from "react";

/** Tarjeta de una sección de la revisión, con el título en mono mayúsculas como en Figma. */
export default function SeccionRevision({ titulo, children }: { titulo: string; children: ReactNode }) {
  const id = `seccion-${titulo.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <section aria-labelledby={id} className="overflow-hidden rounded-lg border border-border-subtle bg-bg-surface">
      <h2 id={id} className="border-b border-border-subtle bg-bg-raised px-5 py-2.5 text-eyebrow">
        {titulo}
      </h2>
      <div className="divide-y divide-border-subtle">{children}</div>
    </section>
  );
}

/** Una fila: nombre (y ayuda) a la izquierda, el control a la derecha; en mobile, uno debajo del otro. */
export function FilaRevision({
  etiqueta,
  ayuda,
  htmlFor,
  children,
}: {
  etiqueta: ReactNode;
  ayuda?: ReactNode;
  /** id del control, si es un campo con <label>. */
  htmlFor?: string;
  children: ReactNode;
}) {
  const Etiqueta = htmlFor ? "label" : "div";
  return (
    <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-start md:gap-6">
      <div className="flex min-w-0 flex-col gap-0.5 md:w-56 md:shrink-0 md:pt-2.5">
        <Etiqueta {...(htmlFor ? { htmlFor } : {})} className="flex flex-wrap items-center gap-2 text-sm">
          {etiqueta}
        </Etiqueta>
        {ayuda && <p className="text-xs text-text-muted">{ayuda}</p>}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-start">{children}</div>
    </div>
  );
}
