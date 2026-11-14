import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Ban, CircleX, RotateCcw, SearchX } from "lucide-react";
import { Button, ButtonLink } from "@/components/centralbv/Button";
import { EmptyState } from "@/components/centralbv/EmptyState";
import { focus } from "@/components/centralbv/estilos";
import { ErrorApi } from "@/lib/http";
import type { useMovilConBuches } from "../hooks/useMovilConBuches";

/* Lo común de Generar buches y Editar buches (US17): el link de vuelta al inventario
   y las pantallas de carga, error y móvil dado de baja. */

export function VolverInventario({ id, codigo }: { id: string; codigo?: string }) {
  return (
    <Link
      to="/moviles/$id"
      params={{ id }}
      search={{ pestana: "inventario" }}
      className={`inline-flex w-fit items-center gap-2 rounded-sm text-sm text-accent-text hover:underline ${focus}`}
    >
      <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
      {codigo ? `${codigo} · Inventario` : "Volver al inventario"}
    </Link>
  );
}

/** Pantalla mientras carga, si falló o si el móvil está dado de baja. null si se puede seguir. */
export function PantallaSinBuches({
  id,
  consulta,
  reintentar,
}: {
  id: string;
  consulta: ReturnType<typeof useMovilConBuches>["consulta"];
  reintentar: () => void;
}): ReactNode {
  const envolver = (contenido: ReactNode, codigo?: string) => (
    <div className="flex flex-1 flex-col gap-6">
      <VolverInventario id={id} codigo={codigo} />
      {contenido}
    </div>
  );

  if (consulta.estado === "cargando") {
    return envolver(
      <p role="status" className="text-sm text-text-secondary">
        Cargando buches…
      </p>,
    );
  }
  if (consulta.estado === "error") {
    const e = consulta.error;
    if (e instanceof ErrorApi && [400, 404].includes(e.status)) {
      return envolver(
        <EmptyState
          icon={SearchX}
          title="Móvil no encontrado"
          description="El móvil que buscás no existe o el enlace no es válido."
          action={<ButtonLink to="/moviles">Ver todos los móviles</ButtonLink>}
        />,
      );
    }
    return envolver(
      <EmptyState
        tone="danger"
        icon={CircleX}
        title="No pudimos cargar los buches"
        description="Revisá tu conexión e intentá de nuevo."
        action={
          <Button onClick={reintentar}>
            <RotateCcw size={16} strokeWidth={1.5} aria-hidden />
            Reintentar
          </Button>
        }
      />,
    );
  }
  const { movil } = consulta.datos;
  if (movil.estado === "baja_definitiva") {
    return envolver(
      <EmptyState
        icon={Ban}
        title="El móvil está dado de baja"
        description="Los buches de un móvil dado de baja definitiva no se pueden modificar."
      />,
      movil.codigo,
    );
  }
  return null;
}
