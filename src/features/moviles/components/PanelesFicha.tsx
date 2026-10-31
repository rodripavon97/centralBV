import type { ReactNode } from "react";
import { ClipboardList, PanelsTopLeft } from "lucide-react";
import { EmptyState } from "@/components/centralbv/EmptyState";
import { formatearPatente } from "../domain/patente";
import type { MovilFlota } from "../domain/movil";

/* Contenido de cada pestaña de la ficha (Figma S4). Inventario llega con US17 y
   Última revisión con US07: mientras tanto se ven sus estados vacíos. */

function Tarjeta({ titulo, nota, children }: { titulo: string; nota?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-bg-surface p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">{titulo}</h2>
        {nota && <p className="text-xs text-text-muted">{nota}</p>}
      </header>
      {children}
    </section>
  );
}

function Dato({ etiqueta, children, mono }: { etiqueta: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs text-text-muted">{etiqueta}</dt>
      <dd className={`truncate text-sm ${mono ? "font-mono" : ""}`}>{children}</dd>
    </div>
  );
}

const GRILLA_DATOS = "grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4";

/** Datos generales: datos del móvil + mantenimiento y documentación (de la última revisión, US07). */
export function PanelDatosGenerales({ movil }: { movil: MovilFlota }) {
  return (
    <div className="flex flex-col gap-4">
      <Tarjeta titulo="Datos del móvil">
        <dl className={GRILLA_DATOS}>
          <Dato etiqueta="N.º interno">{movil.codigo}</Dato>
          <Dato etiqueta="Patente" mono>
            {formatearPatente(movil.patente)}
          </Dato>
          <Dato etiqueta="Tipo">{movil.tipo}</Dato>
          <Dato etiqueta="Marca">{movil.marca}</Dato>
          <Dato etiqueta="Modelo">{movil.modelo}</Dato>
        </dl>
      </Tarjeta>
      <Tarjeta titulo="Mantenimiento y documentación">
        <p className="text-sm text-text-secondary">
          Vencimiento de VTV y seguro, último service y kilometraje se completan con la última revisión del móvil.
          Todavía no hay revisiones registradas.
        </p>
      </Tarjeta>
    </div>
  );
}

export function PanelInventario() {
  return (
    <EmptyState
      compacto
      icon={PanelsTopLeft}
      title="Este móvil todavía no tiene buches"
      description="Cuando se generen los buches según la distribución del móvil, vas a ver acá el inventario asignado."
    />
  );
}

export function PanelUltimaRevision() {
  return (
    <EmptyState
      compacto
      icon={ClipboardList}
      title="Todavía no hay revisiones"
      description="Cuando se registre la primera revisión del móvil o del inventario, vas a ver acá su resultado."
    />
  );
}
