import { useLocation } from "@tanstack/react-router";
import { CircleCheck, CircleX, Lock, Plus, RotateCcw, Truck } from "lucide-react";
import { Alert } from "@/components/centralbv/Alert";
import { Button, ButtonLink } from "@/components/centralbv/Button";
import { EmptyState } from "@/components/centralbv/EmptyState";
import { tieneRol } from "@/features/auth/session";
import { useConsulta } from "@/features/constancias/hooks/useConsulta";
import { ErrorApi } from "@/lib/http";
import { listarMoviles, type PaginaMoviles } from "../api/flotaApi";
import { ordenarPorDenominacion } from "../domain/movil";
import { formatearPatente } from "../domain/patente";
import EstadoMovilBadge from "../components/EstadoMovilBadge";

const plural = (n: number) => `${n} ${n === 1 ? "móvil" : "móviles"}`;

/**
 * Lista de móviles (Figma S2 · "Móviles lista"). En US04 es el destino después
 * del alta, con el aviso "Móvil M-4 creado con estado Operativo."; la búsqueda
 * y la ficha llegan con US06.
 */
export default function MovilesPage() {
  const movilCreado = useLocation({ select: (l) => l.state.movilCreado });
  const puedeAgregar = tieneRol("AUTOMOTORES");
  const { consulta, reintentar } = useConsulta("moviles", listarMoviles);

  const sinPermiso = consulta.estado === "error" && consulta.error instanceof ErrorApi && consulta.error.status === 403;
  const subtitulo =
    consulta.estado === "cargando" ? "Cargando…" : consulta.estado === "listo" ? plural(consulta.datos.total) : "";

  const agregar = (
    <ButtonLink to="/moviles/nuevo" variant="primary">
      <Plus size={16} strokeWidth={1.5} aria-hidden />
      Agregar móvil
    </ButtonLink>
  );

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Móviles</h1>
          {subtitulo && <p className="text-sm text-text-muted">{subtitulo}</p>}
        </div>
        {puedeAgregar && !sinPermiso && agregar}
      </header>

      {movilCreado && (
        <Alert tone="ok" icon={CircleCheck} role="status">
          Móvil <span className="font-mono">{movilCreado}</span> creado con estado Operativo.
        </Alert>
      )}

      {sinPermiso ? (
        <EmptyState icon={Lock} title="No tenés acceso a los móviles" description="Pedile acceso al administrador general." />
      ) : consulta.estado === "error" ? (
        <EmptyState
          tone="danger"
          icon={CircleX}
          title="No pudimos cargar los móviles"
          description="Revisá tu conexión e intentá de nuevo."
          action={
            <Button onClick={reintentar}>
              <RotateCcw size={16} strokeWidth={1.5} aria-hidden />
              Reintentar
            </Button>
          }
        />
      ) : consulta.estado === "cargando" ? (
        <TablaCargando />
      ) : consulta.datos.total === 0 ? (
        <EmptyState
          icon={Truck}
          title="Todavía no hay móviles"
          description={puedeAgregar ? "Registrá la primera unidad de la flota." : "El encargado de automotores todavía no cargó ninguna unidad."}
          action={puedeAgregar ? agregar : undefined}
        />
      ) : (
        <Tabla datos={consulta.datos} />
      )}
    </div>
  );
}

const th = "h-10 px-4 text-left align-middle font-normal text-eyebrow";
const td = "h-14 px-4 align-middle";

function Tabla({ datos }: { datos: PaginaMoviles }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[48rem] border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className={th}>N.º interno</th>
              <th scope="col" className={th}>Patente</th>
              <th scope="col" className={th}>Tipo</th>
              <th scope="col" className={th}>Marca y modelo</th>
              <th scope="col" className={th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {ordenarPorDenominacion(datos.items).map((m) => (
              <tr key={m.id} className="border-t border-border-subtle">
                <th scope="row" className={`${td} text-left font-semibold`}>
                  {m.codigo}
                </th>
                <td className={`${td} text-code`}>{formatearPatente(m.patente)}</td>
                <td className={`${td} text-text-secondary`}>{m.tipo}</td>
                <td className={`${td} text-text-secondary`}>
                  {m.marca} {m.modelo}
                </td>
                <td className={td}>
                  <EstadoMovilBadge estado={m.estado} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TablaCargando() {
  const anchos = ["w-16", "w-24", "w-28", "w-40", "w-24"];
  const barra = "h-3 animate-pulse rounded-sm bg-bg-raised";
  return (
    <div role="status" aria-label="Cargando móviles" className="overflow-hidden rounded-lg border border-border-subtle bg-bg-surface">
      {[0, 1, 2, 3, 4, 5].map((fila) => (
        <div key={fila} className={`flex items-center gap-8 px-4 ${fila === 0 ? "h-10" : "h-14 border-t border-border-subtle"}`}>
          {anchos.map((w, i) => (
            <span key={i} className={`${barra} ${w} ${fila === 0 ? "opacity-60" : ""}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
