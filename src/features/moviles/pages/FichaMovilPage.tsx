import { Link, getRouteApi, useLocation } from "@tanstack/react-router";
import { ArrowLeft, CircleX, RotateCcw, SearchX } from "lucide-react";
import { Button, ButtonLink } from "@/components/centralbv/Button";
import { EmptyState } from "@/components/centralbv/EmptyState";
import { focus } from "@/components/centralbv/estilos";
import { useConsulta } from "@/features/constancias/hooks/useConsulta";
import { ErrorApi } from "@/lib/http";
import { obtenerMovil } from "../api/flotaApi";
import { PESTANAS_FICHA, idPanel, idPestana, type PestanaFicha } from "../domain/busquedaMoviles";
import { formatearPatente } from "../domain/patente";
import EstadoMovilBadge from "../components/EstadoMovilBadge";
import PestanasFicha from "../components/PestanasFicha";
import { PanelDatosGenerales, PanelInventario, PanelUltimaRevision } from "../components/PanelesFicha";

const ruta = getRouteApi("/app/moviles/$id");

/**
 * Ficha técnica de un móvil (US06 · Figma S4): datos generales, inventario y última revisión.
 * La pestaña va en la URL (?pestana=), así el Atrás y los links compartidos abren la misma vista.
 * Un id inexistente (404) o inválido (400) muestra "Móvil no encontrado".
 */
export default function FichaMovilPage() {
  const { id } = ruta.useParams();
  const search = ruta.useSearch();
  const navigate = ruta.useNavigate();
  const volverA = useLocation({ select: (l) => l.state.listaMoviles });
  const pestana: PestanaFicha = search.pestana ?? "datos";

  const { consulta, reintentar } = useConsulta(`movil:${id}`, () => obtenerMovil(id));
  const noEncontrado =
    consulta.estado === "error" && consulta.error instanceof ErrorApi && [400, 404].includes(consulta.error.status);

  const cambiarPestana = (p: PestanaFicha) =>
    void navigate({
      search: (prev) => ({ ...prev, pestana: p === "datos" ? undefined : p }),
      replace: true,
      state: (prev) => prev, // conserva la búsqueda de la lista para el "← Móviles"
    });

  const volver = (
    <Link
      to="/moviles"
      search={{ q: volverA?.q, pagina: volverA?.pagina }}
      aria-label="Volver a Móviles"
      className={`inline-flex w-fit items-center gap-2 rounded-sm text-sm text-accent-text hover:underline ${focus}`}
    >
      <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
      Móviles
    </Link>
  );

  if (noEncontrado) {
    return (
      <div className="flex flex-1 flex-col gap-6">
        {volver}
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
      <div className="flex flex-1 flex-col gap-6">
        {volver}
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

  const movil = consulta.estado === "listo" ? consulta.datos : undefined;

  return (
    <div className="flex flex-col gap-6">
      {volver}

      <header className="flex flex-col gap-1">
        {movil ? (
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold">{movil.codigo}</h1>
            <EstadoMovilBadge estado={movil.estado} />
          </div>
        ) : (
          <h1 className="text-xl font-semibold">
            <span className="sr-only">Cargando móvil</span>
            <span aria-hidden className="block h-7 w-20 animate-pulse rounded-sm bg-bg-raised" />
          </h1>
        )}
        <p className="text-sm text-text-secondary" role="status">
          {movil ? `${movil.tipo} · ${movil.marca} ${movil.modelo} · ${formatearPatente(movil.patente)}` : "Cargando…"}
        </p>
      </header>

      {/* Como en Figma, las pestañas se ven aunque el móvil todavía esté cargando. */}
      <PestanasFicha activa={pestana} onCambiar={cambiarPestana} />

      {PESTANAS_FICHA.map((p) => (
        <div key={p} role="tabpanel" id={idPanel(p)} aria-labelledby={idPestana(p)} hidden={p !== pestana} tabIndex={0} className={`rounded-lg ${focus}`}>
          {p !== pestana ? null : !movil ? (
            <PanelCargando />
          ) : p === "datos" ? (
            <PanelDatosGenerales movil={movil} />
          ) : p === "inventario" ? (
            <PanelInventario />
          ) : (
            <PanelUltimaRevision />
          )}
        </div>
      ))}
    </div>
  );
}

function PanelCargando() {
  const barra = "h-3 animate-pulse rounded-sm bg-bg-raised";
  return (
    <div aria-hidden className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-bg-surface p-5">
      <span className={`${barra} w-52`} />
      <span className={`${barra} w-40`} />
      <span className={`${barra} w-64`} />
      <span className={`${barra} w-32`} />
    </div>
  );
}
