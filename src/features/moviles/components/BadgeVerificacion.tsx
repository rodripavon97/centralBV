import { CircleAlert, CircleCheck, CircleX, type LucideIcon } from "lucide-react";

type Tono = "ok" | "warn" | "danger";

const estilos: Record<Tono, { icon: LucideIcon; color: string }> = {
  ok: { icon: CircleCheck, color: "bg-state-ok-bg text-state-ok" },
  warn: { icon: CircleAlert, color: "bg-state-warn-bg text-state-warn" },
  danger: { icon: CircleX, color: "bg-state-danger-bg text-state-danger" },
};

/** Píldora de la tabla de la última revisión (Ok / Atención / Crítico). */
export default function BadgeVerificacion({ tono, children }: { tono: Tono; children: string }) {
  const { icon: Icon, color } = estilos[tono];
  return (
    <span className={`inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      <Icon size={14} strokeWidth={1.5} aria-hidden />
      {children}
    </span>
  );
}
