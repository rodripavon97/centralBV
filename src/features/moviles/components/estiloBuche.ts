import { Ban, CircleAlert, CircleCheck, CircleX, type LucideIcon } from "lucide-react";
import type { EstadoBuche } from "../domain/buches";

/* Cómo se ve cada estado de buche (Figma S5 · plano y leyenda). Nunca solo color: cada uno
   tiene su glifo y su tipo de borde.
   - Operativo: borde fino sólido.
   - Con observaciones: borde punteado amarillo.
   - Dañado: borde grueso rojo y fondo rojo oscuro.
   - Fuera de uso: borde punteado azul. */
export const ESTILO_ESTADO_BUCHE: Record<
  EstadoBuche,
  { icon: LucideIcon; badge: string; borde: string; texto: string; fondo?: string }
> = {
  operativo: {
    icon: CircleCheck,
    badge: "bg-state-ok-bg text-state-ok",
    borde: "border border-solid border-border-strong",
    texto: "text-state-ok",
  },
  observaciones: {
    icon: CircleAlert,
    badge: "bg-state-warn-bg text-state-warn",
    borde: "border-[1.5px] border-dashed border-state-warn",
    texto: "text-state-warn",
  },
  danado: {
    icon: CircleX,
    badge: "bg-state-danger-bg text-state-danger",
    borde: "border-2 border-solid border-state-danger",
    texto: "text-state-danger",
    fondo: "bg-state-danger-bg",
  },
  fuera_de_uso: {
    icon: Ban,
    badge: "bg-state-info-bg text-state-info",
    borde: "border-[1.5px] border-dashed border-state-info",
    texto: "text-state-info",
  },
};
