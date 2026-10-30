/* Clases compartidas por las pantallas públicas de autenticación.
   Mantienen el mismo aspecto que el login ya aprobado. */

const focusAuth =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface";

export const inputAuth = `h-(--size-control) w-full rounded-md border border-border-input bg-bg-raised px-3 text-base text-text-primary transition-colors placeholder:text-text-disabled aria-invalid:border-state-danger ${focusAuth}`;

export const volverAuth = `mx-auto inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-accent-text transition-colors hover:underline ${focusAuth}`;
