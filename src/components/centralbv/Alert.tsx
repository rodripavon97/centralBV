import type { ReactNode } from "react";
import { Info, TriangleAlert } from "lucide-react";

type Tone = "danger" | "info";

interface AlertProps {
  tone: Tone;
  children: ReactNode;
}

const styles: Record<Tone, { className: string; Icon: typeof TriangleAlert }> = {
  danger: {
    className: "border-state-danger bg-state-danger-bg text-state-danger",
    Icon: TriangleAlert,
  },
  info: {
    className: "border-state-info bg-state-info-bg text-state-info",
    Icon: Info,
  },
};

export function Alert({ tone, children }: AlertProps) {
  const { className, Icon } = styles[tone];

  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${className}`}
    >
      <Icon size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}
