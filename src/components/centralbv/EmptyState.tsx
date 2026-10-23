import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

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
