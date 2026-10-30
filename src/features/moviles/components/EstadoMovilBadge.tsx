import { Ban, CircleAlert, CircleCheck, CircleX, Wrench, type LucideIcon } from "lucide-react";
import { ETIQUETAS_ESTADO_MOVIL, type EstadoMovil } from "../domain/movil";

/* Badge/Móvil de Figma: píldora sin borde, como EstadoBadge de solicitudes.
   Nunca solo color: cada estado lleva glifo y texto. */
const estilos: Record<EstadoMovil, { icon: LucideIcon; color: string }> = {
  operativo: { icon: CircleCheck, color: "bg-state-ok-bg text-state-ok" },
  observaciones: { icon: CircleAlert, color: "bg-state-warn-bg text-state-warn" },
  fuera_de_servicio: { icon: CircleX, color: "bg-state-danger-bg text-state-danger" },
  mantenimiento: { icon: Wrench, color: "bg-state-info-bg text-state-info" },
  baja_definitiva: { icon: Ban, color: "bg-bg-raised text-text-secondary" },
};

export default function EstadoMovilBadge({ estado }: { estado: EstadoMovil }) {
  const { icon: Icon, color } = estilos[estado];
  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}
    >
      <Icon size={14} strokeWidth={1.5} aria-hidden />
      {ETIQUETAS_ESTADO_MOVIL[estado]}
    </span>
  );
}
