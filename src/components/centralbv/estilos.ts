/* Clases y helpers compartidos por los componentes de centralbv.
   Viven aparte de los componentes para no romper el fast refresh de Vite. */

export const focus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base";

export type ButtonVariant = "primary" | "secondary" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent-fill text-white hover:bg-accent-fill-hover active:bg-accent-fill-pressed disabled:bg-accent-subtle disabled:text-text-muted",
  secondary:
    "border border-border-strong text-text-primary hover:bg-bg-raised disabled:text-text-disabled disabled:hover:bg-transparent",
  // Acción destructiva secundaria: siempre abre un modal de confirmación.
  danger:
    "border border-red-700 text-accent-text hover:bg-accent-subtle disabled:border-border-strong disabled:text-text-disabled disabled:hover:bg-transparent",
};

export function buttonClass(variant: ButtonVariant = "secondary", extra = "") {
  return `inline-flex h-(--size-control) shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed ${focus} ${variants[variant]} ${extra}`;
}

/** Props de accesibilidad que conectan un control con su Field. */
export function fieldProps(id: string, error?: string, required?: boolean) {
  return {
    id,
    name: id,
    required,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  };
}
