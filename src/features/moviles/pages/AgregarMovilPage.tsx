import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CircleX, RotateCcw } from "lucide-react";
import { Button } from "@/components/centralbv/Button";
import { EmptyState } from "@/components/centralbv/EmptyState";
import { focus } from "@/components/centralbv/estilos";
import { tieneRol } from "@/features/auth/session";
import { crearMovil } from "../api/flotaApi";
import MovilForm from "../components/MovilForm";
import { useCatalogos } from "../hooks/useCatalogos";

/** US04 · Registro inicial de la unidad. Solo AUTOMOTORES (ADMIN siempre); lo controla la ruta. */
export default function AgregarMovilPage() {
  const navigate = useNavigate();
  const { catalogos, recargar, reintentar } = useCatalogos();

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/moviles"
        className={`inline-flex w-fit items-center gap-2 rounded-sm text-sm text-accent-text hover:underline ${focus}`}
      >
        <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
        Móviles
      </Link>
      <header>
        <h1 className="text-xl font-semibold">Agregar móvil</h1>
        <p className="text-sm text-text-muted">Registro inicial de la unidad</p>
      </header>

      {catalogos.estado === "error" ? (
        <EmptyState
          tone="danger"
          icon={CircleX}
          title="No pudimos cargar los tipos, marcas y modelos"
          description="Los necesitamos para completar el formulario. Revisá tu conexión e intentá de nuevo."
          action={
            <Button onClick={reintentar}>
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
          catalogos={catalogos.datos}
          recargarCatalogos={recargar}
          puedeEditarCatalogos={tieneRol("AUTOMOTORES")}
          textoGuardar="Guardar móvil"
          onGuardar={async (valores, opciones) => {
            const movil = await crearMovil(valores, opciones);
            await navigate({ to: "/moviles", state: { movilCreado: movil.codigo } });
          }}
          onCancelar={() => void navigate({ to: "/moviles" })}
        />
      )}
    </div>
  );
}
