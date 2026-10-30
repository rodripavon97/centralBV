import { CircleAlert, CircleCheck, CircleX, Wrench, type LucideIcon } from "lucide-react";
import type { EstadoVehiculo } from "@/types/dominio";
import { ETIQUETAS_ESTADO_MOVIL } from "../domain/movil";

/* Stat tile de Figma (S1 Dashboard): estado con glifo y color arriba, cantidad abajo.
   Los glifos son los mismos del badge de estado (EstadoMovilBadge). */
const estilos: Record<EstadoVehiculo, { icon: LucideIcon; color: string }> = {
  operativo: { icon: CircleCheck, color: "text-state-ok" },
  observaciones: { icon: CircleAlert, color: "text-state-warn" },
  fuera_de_servicio: { icon: CircleX, color: "text-state-danger" },
  mantenimiento: { icon: Wrench, color: "text-state-info" },
};

export default function ContadorEstado({ estado, cantidad }: { estado: EstadoVehiculo; cantidad: number }) {
  const { icon: Icon, color } = estilos[estado];
  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border-strong bg-bg-surface p-4">
      <span className={`flex items-center gap-2 text-sm font-medium ${color}`}>
        <Icon size={16} strokeWidth={1.5} aria-hidden />
        {ETIQUETAS_ESTADO_MOVIL[estado]}
      </span>
      <span className="text-[2rem] leading-10 tabular-nums">{cantidad}</span>
    </li>
  );
}
