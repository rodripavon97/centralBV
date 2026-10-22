import { CircleDashed, CircleX, FileText, PenLine, type LucideIcon } from "lucide-react";
import type { EstadoSolicitud } from "@/types/dominio";
import { ESTADOS_SOLICITUD } from "./formato";

// Nunca solo color: cada estado lleva glifo y texto.
const estilos: Record<EstadoSolicitud, { icon: LucideIcon; tone?: "info" | "danger" }> = {
  pendiente: { icon: CircleDashed },
  constancia_generada: { icon: FileText, tone: "info" },
  firmada: { icon: PenLine, tone: "info" },
  cancelada: { icon: CircleX, tone: "danger" },
};

export default function EstadoBadge({ estado }: { estado: EstadoSolicitud }) {
  const { icon: Icon, tone } = estilos[estado];
  const color = tone
    ? tone === "info"
      ? "bg-state-info-bg text-state-info"
      : "bg-state-danger-bg text-state-danger"
    : "bg-bg-raised text-text-secondary";
  // Píldora sin borde, como en las pantallas del M4 en Figma.
  return (
    <span className={`inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      <Icon size={14} strokeWidth={1.5} aria-hidden />
      {ESTADOS_SOLICITUD[estado]}
    </span>
  );
}
