import { useState } from "react";
import { Link, getRouteApi, useLocation } from "@tanstack/react-router";
import { ArrowLeft, Ban, CircleAlert, CircleCheck, CircleX, ClipboardCheck, Pencil, RotateCcw, SearchX } from "lucide-react";
import { Alert } from "@/components/centralbv/Alert";
import { Button, ButtonLink } from "@/components/centralbv/Button";
import { EmptyState } from "@/components/centralbv/EmptyState";
import { focus } from "@/components/centralbv/estilos";
import { useConsulta } from "@/features/constancias/hooks/useConsulta";
import { leerRoles, tieneRol } from "@/features/auth/session";
import { ErrorApi } from "@/lib/http";
import { darDeBajaMovil, obtenerMovil } from "../api/flotaApi";
import BajaMovilDialog from "../components/BajaMovilDialog";
import { PESTANAS_FICHA, idPanel, idPestana, type PestanaFicha } from "../domain/busquedaMoviles";
import type { MovilFlota } from "../domain/movil";
import { formatearPatente } from "../domain/patente";
import { textoRevisionGuardada } from "../domain/revision";
import EstadoMovilBadge from "../components/EstadoMovilBadge";
import PestanasFicha from "../components/PestanasFicha";
import { PanelDatosGenerales, PanelInventario } from "../components/PanelesFicha";
import PanelRevisiones from "../components/PanelRevisiones";

const ruta = getRouteApi("/app/moviles/$id");

const TONO_AVISO = { operativo: "ok", observaciones: "warn", fuera_de_servicio: "danger" } as const;
const ICONO_AVISO = { operativo: CircleCheck, observaciones: CircleAlert, fuera_de_servicio: CircleX };

/**
 * Ficha técnica de un móvil (US06 · Figma S4): datos generales, inventario y revisiones.
 * US07: botón "Registrar revisión" (cualquier usuario, salvo móviles dados de baja), el historial
 * de revisiones con el detalle de la elegida y el aviso "Revisión guardada…" al volver del formulario.
 * US48: edición de datos generales (AUTOMOTORES) y baja definitiva (solo ADMIN).
 * La pestaña y la revisión elegida van en la URL (?pestana=&revision=), así el Atrás y los links
 * compartidos abren la misma vista.
 * Un id inexistente (404) o inválido (400) muestra "Móvil no encontrado".
 */
export default function FichaMovilPage() {
  const { id } = ruta.useParams();
  const search = ruta.useSearch();
  const navigate = ruta.useNavigate();
  const volverA = useLocation({ select: (l) => l.state.listaMoviles });
  const revisionGuardada = useLocation({ select: (l) => l.state.revisionGuardada });
  const movilEditado = useLocation({ select: (l) => l.state.movilEditado });
  const pestana: PestanaFicha = search.pestana ?? "datos";

  const { consulta, reintentar } = useConsulta(`movil:${id}`, () => obtenerMovil(id));
  // Tras baja (o otra mutación) se muestra la versión actualizada sin volver a pedirla.
  const [actualizado, setActualizado] = useState<MovilFlota>();
  const [dandoDeBaja, setDandoDeBaja] = useState(false);
  const [bajaOk, setBajaOk] = useState(false);

  const noEncontrado =
    consulta.estado === "error" && consulta.error instanceof ErrorApi && [400, 404].includes(consulta.error.status);

  const cambiarPestana = (p: PestanaFicha) =>
    void navigate({
      search: (prev) => ({ ...prev, pestana: p === "datos" ? undefined : p, revision: undefined }),
      replace: true,
      state: (prev) => prev, // conserva la búsqueda de la lista para el "← Móviles"
    });

  const elegirRevision = (revision: string) =>
    void navigate({
      search: (prev) => ({ ...prev, pestana: "revision", revision }),
      replace: true,
      state: (prev) => prev,
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

  const cargado = consulta.estado === "listo" ? consulta.datos : undefined;
  const movil = actualizado?.id === id ? actualizado : cargado;
  const activo = movil && movil.estado !== "baja_definitiva";
  const puedeEditar = tieneRol("AUTOMOTORES");
  const esAdmin = leerRoles().includes("ADMIN");

  return (
    <div className="flex flex-col gap-6">
      {volver}

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
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
        </div>
        {activo && (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3 [&>*]:w-full sm:[&>*]:w-auto">
            {puedeEditar && (
              <ButtonLink to="/moviles/$id/editar" params={{ id }}>
                <Pencil size={16} strokeWidth={1.5} aria-hidden />
                Editar
              </ButtonLink>
            )}
            <ButtonLink to="/moviles/$id/revision" params={{ id }} variant="primary" className="order-first sm:order-none">
              <ClipboardCheck size={16} strokeWidth={1.5} aria-hidden />
              Registrar revisión
            </ButtonLink>
            {esAdmin && (
              <Button variant="danger" onClick={() => setDandoDeBaja(true)}>
                <Ban size={16} strokeWidth={1.5} aria-hidden />
                Baja definitiva
              </Button>
            )}
          </div>
        )}
      </header>

      {movilEditado && !bajaOk && (
        <Alert tone="ok" icon={CircleCheck} role="status">
          Cambios guardados.
        </Alert>
      )}

      {bajaOk && (
        <Alert tone="ok" icon={CircleCheck} role="status">
          El móvil quedó dado de baja definitiva.
        </Alert>
      )}

      {revisionGuardada && (
        <Alert tone={TONO_AVISO[revisionGuardada.resultado]} icon={ICONO_AVISO[revisionGuardada.resultado]} role="status">
          {textoRevisionGuardada(revisionGuardada.codigo, revisionGuardada.resultado)}
        </Alert>
      )}

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
            <PanelRevisiones movilId={id} seleccion={search.revision} onSeleccionar={elegirRevision} />
          )}
        </div>
      ))}

      {movil && (
        <BajaMovilDialog
          codigo={movil.codigo}
          abierto={dandoDeBaja}
          onCerrar={() => setDandoDeBaja(false)}
          onConfirmar={async (motivo) => {
            setActualizado(await darDeBajaMovil(movil.id, motivo));
            setBajaOk(true);
            setDandoDeBaja(false);
          }}
        />
      )}
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
