import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CircleX, Lock, RotateCcw, SearchX } from "lucide-react";
import { Button, ButtonLink } from "@/components/centralbv/Button";
import { EmptyState } from "@/components/centralbv/EmptyState";
import { focus } from "@/components/centralbv/estilos";
import { useConsulta } from "@/features/constancias/hooks/useConsulta";
import { tieneRol } from "@/features/auth/session";
import { ErrorApi } from "@/lib/http";
import { actualizarMovil, obtenerMovil } from "../api/flotaApi";
import MovilForm from "../components/MovilForm";
import { valoresDesdeMovil } from "../domain/movil";
import { useCatalogos } from "../hooks/useCatalogos";

const ruta = getRouteApi("/app/moviles/$id/editar");

/** US48 · Edición de datos generales. Solo AUTOMOTORES (ADMIN siempre); lo controla la ruta. */
export default function EditarMovilPage() {
  const { id } = ruta.useParams();
  const navigate = useNavigate();
  const { consulta, reintentar } = useConsulta(`editar-movil:${id}`, () => obtenerMovil(id));
  const { catalogos, recargar, reintentar: reintentarCatalogos } = useCatalogos();
  const volver = () => void navigate({ to: "/moviles/$id", params: { id } });

  const enlaceFicha = (
    <Link
      to="/moviles/$id"
      params={{ id }}
      className={`inline-flex w-fit items-center gap-2 rounded-sm text-sm text-accent-text hover:underline ${focus}`}
    >
      <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
      Volver a la ficha
    </Link>
  );

  const noEncontrado =
    consulta.estado === "error" && consulta.error instanceof ErrorApi && [400, 404].includes(consulta.error.status);

  if (noEncontrado) {
    return (
      <div className="flex flex-col gap-6">
        {enlaceFicha}
        <EmptyState
          icon={SearchX}
          title="Móvil no encontrado"
          description="El móvil que buscás no existe o el enlace no es válido."
          action={<ButtonLink to="/moviles">Ver todos los móviles</ButtonLink>}
        />
      </div>
    );
  }

  if (consulta.estado === "error") {
    return (
      <div className="flex flex-col gap-6">
        {enlaceFicha}
        <EmptyState
          tone="danger"
          icon={CircleX}
          title="No pudimos cargar el móvil"
          description="Revisá tu conexión e intentá de nuevo."
          action={
            <Button onClick={reintentar}>
              <RotateCcw size={16} strokeWidth={1.5} aria-hidden />
              Reintentar
            </Button>
          }
        />
      </div>
    );
  }

  if (consulta.estado === "cargando" || !consulta.datos) {
    return (
      <div className="flex flex-col gap-6">
        {enlaceFicha}
        <header>
          <h1 className="text-xl font-semibold">Editar móvil</h1>
          <p className="text-sm text-text-muted">Cargando…</p>
        </header>
        <div
          role="status"
          aria-label="Cargando formulario"
          className="flex h-[38rem] max-w-(--content-form-max) animate-pulse rounded-lg border border-border-subtle bg-bg-surface"
        />
      </div>
    );
  }

  const movil = consulta.datos;

  if (movil.estado === "baja_definitiva") {
    return (
      <div className="flex flex-col gap-6">
        {enlaceFicha}
        <EmptyState
          icon={Lock}
          title="Este móvil no se puede editar"
          description="Los móviles dados de baja definitiva no se editan."
          action={
            <ButtonLink to="/moviles/$id" params={{ id }}>
              Ver ficha
            </ButtonLink>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {enlaceFicha}
      <header>
        <h1 className="text-xl font-semibold">Editar móvil</h1>
        <p className="text-sm text-text-muted">
          <span className="font-mono">{movil.codigo}</span> · Datos generales
        </p>
      </header>

      {catalogos.estado === "error" ? (
        <EmptyState
          tone="danger"
          icon={CircleX}
          title="No pudimos cargar los tipos, marcas y modelos"
          description="Los necesitamos para completar el formulario. Revisá tu conexión e intentá de nuevo."
          action={
            <Button onClick={reintentarCatalogos}>
              <RotateCcw size={16} strokeWidth={1.5} aria-hidden />
              Reintentar
            </Button>
          }
        />
      ) : catalogos.estado === "cargando" ? (
        <div
          role="status"
          aria-label="Cargando formulario"
          className="flex h-[38rem] max-w-(--content-form-max) animate-pulse rounded-lg border border-border-subtle bg-bg-surface"
        />
      ) : (
        <MovilForm
          key={movil.id}
          catalogos={catalogos.datos}
          recargarCatalogos={recargar}
          puedeEditarCatalogos={tieneRol("AUTOMOTORES")}
          inicial={valoresDesdeMovil(movil)}
          estadoActual={movil.estado}
          textoGuardar="Guardar cambios"
          onGuardar={async (valores, opciones) => {
            await actualizarMovil(id, valores, opciones);
            await navigate({ to: "/moviles/$id", params: { id }, state: { movilEditado: true } });
          }}
          onCancelar={volver}
        />
      )}
    </div>
  );
}
