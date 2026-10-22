import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Tone = "ok" | "danger" | "neutral";

const alertTones: Record<Tone, string> = {
  ok: "border-state-ok bg-state-ok-bg text-state-ok",
  danger: "border-state-danger bg-state-danger-bg text-state-danger",
  neutral: "border-border-subtle bg-bg-raised text-text-secondary",
};

/** Mensaje en línea: confirmaciones, resumen de errores y avisos. */
export function Alert({
  tone,
  icon: Icon,
  children,
  role,
}: {
  tone: Tone;
  icon: LucideIcon;
  children: ReactNode;
  role?: "status" | "alert";
}) {
  return (
    <div role={role} className={`flex items-start gap-2 rounded-lg border px-4 py-2.5 text-sm ${alertTones[tone]}`}>
      <Icon size={16} strokeWidth={1.5} aria-hidden className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

/** Panel para las versiones vacía, sin resultados y de error de una pantalla. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "neutral",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  tone?: "neutral" | "danger";
}) {
  return (
    <div className="flex min-h-[28rem] flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-border-subtle bg-bg-surface px-6 py-16 text-center">
      <span
        className={`mb-1 flex size-12 items-center justify-center rounded-full ${
          tone === "danger" ? "bg-accent-subtle text-accent-text" : "bg-bg-raised text-text-muted"
        }`}
      >
        <Icon size={20} strokeWidth={1.5} aria-hidden />
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-sm text-sm text-text-muted">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
