import type { ReactNode } from "react";
import { BrandMark } from "@/components/centralbv/BrandMark";

/**
 * Estructura de dos columnas de las pantallas públicas de autenticación.
 * Es la misma del login ya aprobado (US02), para que todo el flujo se vea igual.
 */
export function AuthLayout({
  children,
  labelledBy,
}: {
  children: ReactNode;
  labelledBy?: string;
}) {
  return (
    <main className="min-h-screen bg-bg-base text-text-primary md:grid md:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-bg-base px-8 py-8 md:flex lg:px-10 lg:py-10">
        <BrandMark />

        <div className="flex max-w-sm flex-col gap-4">
          <h1 className="text-xl font-semibold leading-tight text-text-primary lg:text-2xl">
            Gestión clara para estar siempre listos.
          </h1>
          <p className="text-sm text-text-secondary">
            Constancias, móviles y tareas administrativas del cuartel, organizadas en un solo lugar.
          </p>
        </div>

        <p className="text-eyebrow">Acceso exclusivo para personal autorizado</p>
      </aside>

      <section className="flex min-h-screen flex-col bg-bg-base px-(--layout-margin) py-8 md:items-center md:justify-center md:bg-bg-surface">
        <div className="mx-auto flex w-full max-w-md flex-col gap-6" aria-labelledby={labelledBy}>
          <div className="md:hidden">
            <BrandMark />
          </div>

          {children}
        </div>
      </section>
    </main>
  );
}
