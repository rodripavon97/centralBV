import { CircleDashed, CircleX, FileText, PackageCheck, PenLine, type LucideIcon } from "lucide-react";
import type { EstadoSolicitud } from "@/types/dominio";
import { ESTADOS_SOLICITUD } from "./formato";

// Nunca solo color: cada estado lleva glifo y texto.
type Tono = "neutral" | "info" | "ok" | "danger";

const estilos: Record<EstadoSolicitud, { icon: LucideIcon; tono: Tono }> = {
  pendiente: { icon: CircleDashed, tono: "neutral" },
  constancia_generada: { icon: FileText, tono: "info" },
  firmada: { icon: PenLine, tono: "info" },
  entregada: { icon: PackageCheck, tono: "ok" },
  cancelada: { icon: CircleX, tono: "danger" },
};

const colores: Record<Tono, string> = {
  neutral: "bg-bg-raised text-text-secondary",
  info: "bg-state-info-bg text-state-info",
  ok: "bg-state-ok-bg text-state-ok",
  danger: "bg-state-danger-bg text-state-danger",
};

export default function EstadoBadge({ estado }: { estado: EstadoSolicitud }) {
  const { icon: Icon, tono } = estilos[estado];
  const color = colores[tono];
  // Píldora sin borde, como en las pantallas del M4 en Figma.
  return (
    <span className={`inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      <Icon size={14} strokeWidth={1.5} aria-hidden />
      {ESTADOS_SOLICITUD[estado]}
    </span>
  );
}
