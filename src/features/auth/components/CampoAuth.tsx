import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";

/** Campo de las pantallas públicas de autenticación (login, recuperación). */
export function CampoAuth({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-text-secondary">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1 text-sm text-state-danger">
          <CircleAlert size={14} strokeWidth={1.5} className="shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
