import AppLayout from "@/app/AppLayout";
import { BrandMark } from "@/components/centralbv/BrandMark";
import { ButtonLink } from "@/components/centralbv/Button";
import { leerSesion } from "@/features/auth/session";

/* US34: página 404 (Figma: 02 Flujos → 06 Sistema · Página 404).
   Con sesión se muestra dentro del riel y vuelve al dashboard;
   sin sesión lleva la marca y manda a iniciar sesión. */
export function NoEncontradaPage() {
  if (leerSesion().estado === "activa") {
    return (
      <AppLayout>
        <div className="flex flex-1 items-center justify-center">
          <Contenido destino="/dashboard" accion="Volver al Dashboard" />
        </div>
      </AppLayout>
    );
  }

  return (
    // Mobile: arriba con aire (Figma "404 móvil"). Desde md: centrado en la pantalla.
    <main className="flex min-h-screen flex-col items-center gap-12 bg-bg-base px-6 pt-16 pb-8 text-text-primary md:justify-center md:gap-10 md:py-8">
      <BrandMark size="lg" />
      <Contenido destino="/login" accion="Ir a iniciar sesión" />
    </main>
  );
}

function Contenido({ destino, accion }: { destino: "/dashboard" | "/login"; accion: string }) {
  return (
    <div className="flex w-full max-w-80 flex-col items-center gap-3.5 text-center md:max-w-110">
      <p aria-hidden className="font-mono text-[4.5rem] leading-20 font-bold text-text-muted md:text-[7rem] md:leading-30">
        404
      </p>
      <h1 className="text-[1.375rem] leading-[1.875rem] font-semibold md:text-[1.75rem] md:leading-9">
        No encontramos esa página
      </h1>
      <p className="text-sm text-text-secondary">
        La dirección que abriste no existe o fue movida. Revisá que esté bien escrita o volvé al inicio.
      </p>
      <ButtonLink to={destino} variant="primary" className="w-full max-w-75 md:w-60">
        {accion}
      </ButtonLink>
    </div>
  );
}
