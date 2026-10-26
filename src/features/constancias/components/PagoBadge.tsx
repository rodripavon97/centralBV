import { CircleCheck, Clock, ShieldCheck, type LucideIcon } from "lucide-react";
import type { EstadoPago } from "@/types/dominio";
import { ESTADOS_PAGO } from "../domain/formato";

// Nunca solo color: cada estado lleva glifo y texto.
const estilos: Record<EstadoPago, { icon: LucideIcon; color: string }> = {
  pendiente: { icon: Clock, color: "bg-state-warn-bg text-state-warn" },
  abonado: { icon: CircleCheck, color: "bg-state-ok-bg text-state-ok" },
  exento: { icon: ShieldCheck, color: "bg-state-info-bg text-state-info" },
};

export default function PagoBadge({ estado }: { estado: EstadoPago }) {
  const { icon: Icon, color } = estilos[estado];
  // Misma píldora sin borde que EstadoBadge.
  return (
    <span className={`inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      <Icon size={14} strokeWidth={1.5} aria-hidden />
      {ESTADOS_PAGO[estado]}
    </span>
  );
}
