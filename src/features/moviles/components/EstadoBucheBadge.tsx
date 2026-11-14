import { ETIQUETA_ESTADO_BUCHE, type EstadoBuche } from "../domain/buches";
import { ESTILO_ESTADO_BUCHE } from "./estiloBuche";

/* Estado de un buche (Figma S5): mismo glifo que en el plano, nunca solo color. */

export default function EstadoBucheBadge({ estado }: { estado: EstadoBuche }) {
  const { icon: Icon, badge } = ESTILO_ESTADO_BUCHE[estado];
  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${badge}`}
    >
      <Icon size={14} strokeWidth={1.5} aria-hidden />
      {ETIQUETA_ESTADO_BUCHE[estado]}
    </span>
  );
}
