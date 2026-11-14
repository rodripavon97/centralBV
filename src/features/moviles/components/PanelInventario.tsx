import { useState } from "react";
import { CircleX, Lock, PanelsTopLeft, RotateCcw, Settings2, Wrench } from "lucide-react";
import { Alert } from "@/components/centralbv/Alert";
import { Button, ButtonLink } from "@/components/centralbv/Button";
import { EmptyState } from "@/components/centralbv/EmptyState";
import { focus } from "@/components/centralbv/estilos";
import { useConsulta } from "@/features/constancias/hooks/useConsulta";
import { tieneRol } from "@/features/auth/session";
import { aErrorApi } from "@/lib/http";
import { cambiarEstadoBuche, listarBuches } from "../api/flotaApi";
import {
  ESTADOS_BUCHE,
  ETIQUETA_ESTADO_BUCHE,
  ETIQUETA_ZONA,
  textoEstadoCambiado,
  type Buche,
  type EstadoBuche,
} from "../domain/buches";
import type { MovilFlota } from "../domain/movil";
import EstadoBucheBadge from "./EstadoBucheBadge";
import { ESTILO_ESTADO_BUCHE } from "./estiloBuche";
import PlanoMovil from "./PlanoMovil";

/**
 * Pestaña Inventario de la ficha (US17 · Figma S5 Buches): el plano del móvil con sus buches y el
 * detalle del elegido. Todavía no hay materiales (camino 2): el detalle muestra el aviso
 * "Estamos trabajando en esto" y abajo los botones para cambiar el estado del buche, que puede
 * usar cualquier usuario y no cambian el estado del móvil. Generar y editar los buches es de
 * AUTOMOTORES (ADMIN siempre). En un móvil dado de baja todo es de solo lectura.
 */
export default function PanelInventario({
  movil,
  seleccion,
  onSeleccionar,
}: {
  movil: MovilFlota;
  /** Buche elegido (de la URL); sin él, el primero. */
  seleccion?: string;
  onSeleccionar: (bucheId: string) => void;
}) {
  const { consulta, reintentar } = useConsulta(`buches:${movil.id}`, () => listarBuches(movil.id));
  // Estados cambiados en esta visita, para no volver a pedir la lista.
  const [cambiados, setCambiados] = useState<Record<string, EstadoBuche>>({});
  const [guardando, setGuardando] = useState<EstadoBuche>();
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string }>();

  const activo = movil.estado !== "baja_definitiva";
  const puedeConfigurar = tieneRol("AUTOMOTORES");
  const puedeModificar = activo && puedeConfigurar;

  if (consulta.estado === "cargando") {
    return (
      <div aria-busy className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-bg-surface p-5">
        <span className="sr-only">Cargando buches…</span>
        <span aria-hidden className="h-3 w-64 animate-pulse rounded-sm bg-bg-raised" />
        <span aria-hidden className="h-48 w-full animate-pulse rounded-lg bg-bg-raised" />
      </div>
    );
  }

  if (consulta.estado === "error") {
    return (
      <EmptyState
        compacto
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
      />
    );
  }

  const buches: Buche[] = consulta.datos.map((b) => (cambiados[b.id] ? { ...b, estado: cambiados[b.id] } : b));

  if (buches.length === 0) {
    const puedeGenerar = puedeModificar;
    return (
      <EmptyState
        compacto
        icon={PanelsTopLeft}
        title="Este móvil todavía no tiene buches"
        description={
          puedeGenerar
            ? "Generá los buches según la distribución del móvil. Después podés renombrarlos o ajustarlos."
            : "Los buches los configura el encargado de automotores. Cuando estén, vas a verlos acá."
        }
        action={
          puedeGenerar && (
            <ButtonLink to="/moviles/$id/buches/generar" params={{ id: movil.id }} variant="primary">
              <Settings2 size={16} strokeWidth={1.5} aria-hidden />
              Generar buches
            </ButtonLink>
          )
        }
      />
    );
  }

  const elegido = buches.find((b) => b.id === seleccion) ?? buches[0];

  const elegir = (id: string) => {
    setAviso(undefined);
    onSeleccionar(id);
  };

  const cambiarEstado = async (estado: EstadoBuche) => {
    if (estado === elegido.estado) return;
    setGuardando(estado);
    setAviso(undefined);
    try {
      const b = await cambiarEstadoBuche(movil.id, elegido.id, estado);
      setCambiados((prev) => ({ ...prev, [b.id]: b.estado }));
      setAviso({ tipo: "ok", texto: textoEstadoCambiado(b.nombre, b.estado) });
    } catch (e) {
      setAviso({ tipo: "error", texto: aErrorApi(e).message });
    } finally {
      setGuardando(undefined);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-[0.8125rem] leading-[1.1875rem] text-text-secondary">
          Tocá un buche para ver su inventario. Los buches los configura el encargado de automotores. Los colores muestran
          el estado de cada buche.
        </p>
        {/* Como en Figma: sin permiso (o con el móvil dado de baja) el botón se ve deshabilitado. */}
        {puedeModificar ? (
          <ButtonLink to="/moviles/$id/buches" params={{ id: movil.id }} className="w-full sm:w-[12.5rem]">
            Generar / editar buches
          </ButtonLink>
        ) : (
          <Button disabled className="w-full sm:w-[12.5rem]">
            Generar / editar buches
          </Button>
        )}
      </div>

      {activo && !puedeConfigurar && (
        <Alert tone="neutral" icon={Lock} role="status">
          Solo el encargado de automotores puede configurar los buches. Vos podés ver el inventario y cambiar el estado
          de cada buche.
        </Alert>
      )}

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <div className="w-full shrink-0 rounded-[10px] border border-border-subtle bg-bg-surface p-5 lg:w-[28.75rem]">
          <PlanoMovil buches={buches} seleccion={elegido.id} onSeleccionar={elegir} />
        </div>

        <section
          aria-labelledby="buche-elegido"
          className="flex w-full min-w-0 flex-1 flex-col gap-4 rounded-[10px] border border-border-subtle bg-bg-surface p-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <h2 id="buche-elegido" className="truncate text-xl font-semibold leading-[1.625rem]">
                {elegido.nombre}
              </h2>
              <p className="text-[0.8125rem] leading-[1.1875rem] text-text-secondary">{ETIQUETA_ZONA[elegido.zona]}</p>
            </div>
            <EstadoBucheBadge estado={elegido.estado} />
          </div>

          <div className="flex items-center gap-3.5 rounded-[10px] border border-border-subtle bg-bg-raised px-5 py-[1.125rem]">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-state-info-bg text-state-info">
              <Wrench size={22} strokeWidth={1.5} aria-hidden />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-[0.9375rem] font-semibold leading-[1.375rem]">Estamos trabajando en esto</p>
              <p className="max-w-[23.75rem] text-[0.8125rem] leading-[1.1875rem] text-text-secondary">
                La gestión de materiales y equipos de cada buche todavía no está disponible. Pronto vas a poder ver y cargar
                lo que hay adentro.
              </p>
            </div>
          </div>

          <fieldset className="flex flex-col gap-2" disabled={!activo || guardando !== undefined}>
            <legend className="mb-2 text-sm text-text-secondary">Estado del buche</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ESTADOS_BUCHE.map((e) => {
                const { icon: Icon } = ESTILO_ESTADO_BUCHE[e];
                const actual = e === elegido.estado;
                return (
                  <button
                    key={e}
                    type="button"
                    aria-pressed={actual}
                    onClick={() => void cambiarEstado(e)}
                    className={`flex h-(--size-control) items-center justify-center gap-2 rounded-md border px-4 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${focus} ${
                      actual ? `${ESTILO_ESTADO_BUCHE[e].badge} border-current font-medium` : "border-border-strong hover:bg-bg-raised"
                    }`}
                  >
                    <Icon size={16} strokeWidth={1.5} aria-hidden />
                    {guardando === e ? "Guardando…" : ETIQUETA_ESTADO_BUCHE[e]}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-text-muted">El estado del buche no cambia el estado del móvil.</p>
          </fieldset>

          {aviso && (
            <Alert tone={aviso.tipo === "ok" ? "ok" : "danger"} role={aviso.tipo === "ok" ? "status" : "alert"}>
              {aviso.texto}
            </Alert>
          )}

          {puedeModificar ? (
            <ButtonLink
              to="/moviles/$id/buches"
              params={{ id: movil.id }}
              search={{ buche: elegido.id }}
              className="w-full sm:w-[9.375rem]"
            >
              Editar buche
            </ButtonLink>
          ) : (
            <Button disabled className="w-full sm:w-[9.375rem]">
              Editar buche
            </Button>
          )}
        </section>
      </div>
    </div>
  );
}
