import type { ReactNode } from "react";
import { CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react";

type Tone = "danger" | "warn" | "info" | "ok" | "neutral";

interface AlertProps {
  tone: Tone;
  children: ReactNode;
  /** Reemplaza el ícono por defecto del tono. */
  icon?: LucideIcon;
  /** "alert" interrumpe al lector de pantalla; "status" avisa sin interrumpir. */
  role?: "alert" | "status";
}

const styles: Record<Tone, { className: string; Icon: LucideIcon }> = {
  danger: {
    className: "border-state-danger bg-state-danger-bg text-state-danger",
    Icon: TriangleAlert,
  },
  warn: {
    className: "border-state-warn bg-state-warn-bg text-state-warn",
    Icon: TriangleAlert,
  },
  info: {
    className: "border-state-info bg-state-info-bg text-state-info",
    Icon: Info,
  },
  ok: {
    className: "border-state-ok bg-state-ok-bg text-state-ok",
    Icon: CircleCheck,
  },
  neutral: {
    className: "border-border-subtle bg-bg-raised text-text-secondary",
    Icon: Info,
  },
};

export function Alert({ tone, children, icon, role = "alert" }: AlertProps) {
  const { className, Icon: IconoTono } = styles[tone];
  const Icon = icon ?? IconoTono;

  return (
    <div role={role} className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${className}`}>
      <Icon size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
