import { useEffect, useState, type MouseEvent } from "react";
import { Link, getRouteApi, useLocation, useNavigate } from "@tanstack/react-router";
import { Archive, ArrowDown, ArrowUp, CircleCheck, CircleX, FileText, Lock, Plus, RotateCcw, Search } from "lucide-react";
import { Alert } from "@/components/centralbv/Alert";
import { Button, ButtonLink } from "@/components/centralbv/Button";
import { EmptyState } from "@/components/centralbv/EmptyState";
import { focus } from "@/components/centralbv/estilos";
import { Input, Select } from "@/components/centralbv/Field";
import { Paginacion } from "@/components/centralbv/Paginacion";
import { ErrorApi } from "@/lib/http";
import {
  POR_PAGINA,
  listarHistorial,
  listarSolicitudes,
  type FiltroSolicitudes,
  type PaginaSolicitudes,
} from "../api/solicitudesApi";
import type { BusquedaSolicitudes } from "../domain/busqueda";
import {
  ESTADOS_SOLICITUD,
  TIPOS_SINIESTRO,
  formatearDni,
  formatearFecha,
  formatearInstante,
} from "../domain/formato";
import { useConsulta } from "../hooks/useConsulta";
import EstadoBadge from "../components/EstadoBadge";

const ruta = getRouteApi("/app/solicitudes");

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

export default function SolicitudesPage() {
  const search = ruta.useSearch();
  const navigate = ruta.useNavigate();
  const creada = useLocation({ select: (l) => l.state.creada });

  // US47: la pestaña Historial muestra las entregadas; Activas, el resto (US09).
  const historial = search.vista === "historial";
  const q = search.q ?? "";
  const estado = search.estado;
  const orden = search.orden ?? "desc";
  const pagina = search.pagina ?? 1;
  const hayFiltros = Boolean(q || estado);

  // Los filtros viven en la URL: se pueden compartir y sobreviven al "atrás".
  const actualizar = (cambios: Partial<BusquedaSolicitudes>) =>
    navigate({ search: (prev) => ({ ...prev, ...cambios }), replace: true });

  // La búsqueda se escribe en un estado local y pasa a la URL con un pequeño retraso.
  const [texto, setTexto] = useState(q);
  const [qPrevio, setQPrevio] = useState(q);
  if (q !== qPrevio) {
    setQPrevio(q);
    setTexto(q);
  }
  useEffect(() => {
    if (texto.trim() === q) return;
    const t = setTimeout(() => actualizar({ q: texto.trim() || undefined, pagina: undefined }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto, q]);

  const filtro: FiltroSolicitudes = { busqueda: q, estado, orden, pagina };
  const { consulta, anterior, reintentar } = useConsulta(JSON.stringify({ ...filtro, historial }), () =>
    historial ? listarHistorial({ busqueda: q, orden, pagina }) : listarSolicitudes(filtro),
  );
  const datos = consulta.estado === "listo" ? consulta.datos : consulta.estado === "cargando" ? anterior : undefined;

  const limpiar = () => {
    setTexto("");
    actualizar({ q: undefined, estado: undefined, pagina: undefined });
  };

  let subtitulo = "";
  if (consulta.estado === "cargando") subtitulo = anterior ? "Buscando…" : "Cargando…";
  else if (datos) {
    const { total } = datos;
    const [uno, varios] = historial ? ["entregada", "entregadas"] : ["solicitud", "solicitudes"];
    if (q) subtitulo = plural(total, "resultado", "resultados");
    else if (estado) subtitulo = plural(total, uno, varios);
    else if (total === 0) subtitulo = historial ? "Historial vacío" : "Todavía no hay solicitudes";
    else subtitulo = `${plural(total, uno, varios)} · ${orden === "desc" ? "más recientes" : "más antiguas"} primero`;
  }

  const sinSolicitudes = consulta.estado === "listo" && consulta.datos.total === 0 && !hayFiltros;
  const mostrarFiltros = consulta.estado !== "error" && !sinSolicitudes;
  const sinPermiso = consulta.estado === "error" && consulta.error instanceof ErrorApi && consulta.error.status === 403;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Solicitudes</h1>
          {subtitulo && <p className="text-sm text-text-muted">{subtitulo}</p>}
        </div>
        {!sinPermiso && (
          <ButtonLink to="/solicitudes/nueva" variant="primary">
            <Plus size={16} strokeWidth={1.5} aria-hidden />
            Nueva solicitud
          </ButtonLink>
        )}
      </header>

      {!sinPermiso && <Pestanas historial={historial} />}

      {creada && (
        <Alert tone="ok" icon={CircleCheck} role="status">
          Solicitud <span className="font-mono">{creada}</span> creada con estado Pendiente.
        </Alert>
      )}

      {mostrarFiltros && (
        <div className="flex flex-wrap gap-3" role="search">
          <div className="relative w-full max-w-[26rem]">
            <Search
              size={16}
              strokeWidth={1.5}
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <Input
              type="search"
              aria-label="Buscar solicitudes"
              placeholder="Buscá por DNI, n.º de solicitud o nombre"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="pl-9"
            />
          </div>
          {/* El historial solo tiene entregadas: no hay estado por el que filtrar. */}
          {!historial && (
            <Select
              aria-label="Filtrar por estado"
              value={estado ?? ""}
              onChange={(e) =>
                actualizar({
                  estado: (e.target.value || undefined) as BusquedaSolicitudes["estado"],
                  pagina: undefined,
                })
              }
              className="w-full sm:w-56"
            >
              <option value="">Todos los estados</option>
              {Object.entries(ESTADOS_SOLICITUD).map(([valor, label]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </Select>
          )}
        </div>
      )}

      {sinPermiso ? (
        <EmptyState
          icon={Lock}
          title="No tenés acceso a las solicitudes"
          description="Tu usuario no tiene el rol Administrativo. Pedíselo al administrador general."
        />
      ) : consulta.estado === "error" ? (
        <EmptyState
          tone="danger"
          icon={CircleX}
          title="No pudimos cargar las solicitudes"
          description="Revisá tu conexión e intentá de nuevo."
          action={
            <Button onClick={reintentar}>
              <RotateCcw size={16} strokeWidth={1.5} aria-hidden />
              Reintentar
            </Button>
          }
        />
      ) : !datos ? (
        <TablaCargando />
      ) : sinSolicitudes && historial ? (
        <EmptyState
          icon={Archive}
          title="El historial está vacío"
          description="Las solicitudes entregadas van a aparecer acá."
        />
      ) : sinSolicitudes ? (
        <EmptyState
          icon={FileText}
          title="Todavía no hay solicitudes"
          description="Registrá la primera solicitud de constancia."
          action={
            <ButtonLink to="/solicitudes/nueva" variant="primary">
              <Plus size={16} strokeWidth={1.5} aria-hidden />
              Nueva solicitud
            </ButtonLink>
          }
        />
      ) : datos.total === 0 ? (
        <EmptyState
          icon={Search}
          title="Sin resultados"
          description="No hay solicitudes que coincidan con tu búsqueda."
          action={<Button onClick={limpiar}>Limpiar búsqueda</Button>}
        />
      ) : (
        <Tabla
          datos={datos}
          historial={historial}
          actualizando={consulta.estado === "cargando"}
          orden={orden}
          onOrden={() => actualizar({ orden: orden === "desc" ? "asc" : undefined, pagina: undefined })}
          onPagina={(p) => actualizar({ pagina: p > 1 ? p : undefined })}
        />
      )}
    </div>
  );
}

/** Pestañas Activas / Historial (Figma S6). Cambiar de pestaña limpia búsqueda, filtro y página. */
function Pestanas({ historial }: { historial: boolean }) {
  const pestana = (activa: boolean) =>
    `-mb-px rounded-t-sm border-b-2 px-1 pb-2 text-sm ${focus} ${
      activa
        ? "border-accent-text font-medium text-text-primary"
        : "border-transparent text-text-muted hover:text-text-primary"
    }`;
  return (
    <nav aria-label="Vistas de solicitudes" className="flex gap-6 border-b border-border-subtle">
      <Link to="/solicitudes" aria-current={historial ? undefined : "page"} className={pestana(!historial)}>
        Activas
      </Link>
      <Link
        to="/solicitudes"
        search={{ vista: "historial" }}
        aria-current={historial ? "page" : undefined}
        className={pestana(historial)}
      >
        Historial
      </Link>
    </nav>
  );
}

const th = "h-10 px-4 text-left align-middle font-normal text-eyebrow";
const td = "h-14 px-4 align-middle";

function Tabla({
  datos,
  historial,
  actualizando,
  orden,
  onOrden,
  onPagina,
}: {
  datos: PaginaSolicitudes;
  historial: boolean;
  actualizando: boolean;
  orden: "asc" | "desc";
  onOrden: () => void;
  onPagina: (pagina: number) => void;
}) {
  const navigate = useNavigate();
  const { items, total, pagina, paginas } = datos;
  const desde = (pagina - 1) * POR_PAGINA + 1;
  const hasta = desde + items.length - 1;
  const Flecha = orden === "desc" ? ArrowDown : ArrowUp;

  const abrir = (e: MouseEvent, id: string) => {
    // El n.º de solicitud ya es un link: no navegar dos veces.
    if (!(e.target as HTMLElement).closest("a")) void navigate({ to: "/solicitudes/$id", params: { id } });
  };

  return (
    <div
      aria-busy={actualizando}
      className={`overflow-hidden rounded-lg border border-border-subtle bg-bg-surface transition-opacity ${actualizando ? "opacity-60" : ""}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className={th}>N.º solicitud</th>
              <th scope="col" className={th} aria-sort={orden === "desc" ? "descending" : "ascending"}>
                <button
                  type="button"
                  onClick={onOrden}
                  className={`-mx-1 inline-flex items-center gap-1 rounded-md px-1 uppercase hover:text-text-primary ${focus}`}
                >
                  Fecha de alta
                  <Flecha size={14} strokeWidth={1.5} aria-hidden />
                  <span className="sr-only">
                    {orden === "desc" ? ", más recientes primero. Ordenar al revés" : ", más antiguas primero. Ordenar al revés"}
                  </span>
                </button>
              </th>
              <th scope="col" className={th}>Damnificado</th>
              {historial ? (
                <>
                  <th scope="col" className={th}>Estado</th>
                  <th scope="col" className={th}>Entrega (fecha y hora)</th>
                  <th scope="col" className={th}>Retiró</th>
                </>
              ) : (
                <>
                  <th scope="col" className={th}>DNI</th>
                  <th scope="col" className={th}>Siniestro</th>
                  <th scope="col" className={th}>Estado</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr
                key={s.id}
                onClick={(e) => abrir(e, s.id)}
                className="cursor-pointer border-t border-border-subtle hover:bg-bg-raised"
              >
                <td className={td}>
                  <Link
                    to="/solicitudes/$id"
                    params={{ id: s.id }}
                    className={`text-code rounded-sm font-medium ${focus}`}
                  >
                    {s.numero}
                  </Link>
                </td>
                <td className={`${td} text-code tabular-nums text-text-secondary`}>{formatearFecha(s.fechaAlta)}</td>
                {historial ? (
                  <>
                    <td className={td}>
                      <span className="block">{s.damnificado.nombre}</span>
                      <span className="text-code block whitespace-nowrap text-xs tabular-nums text-text-muted">
                        DNI {formatearDni(s.damnificado.dni)}
                      </span>
                    </td>
                    <td className={td}>
                      <EstadoBadge estado={s.estado} />
                    </td>
                    <td className={`${td} text-code tabular-nums text-text-secondary`}>
                      {s.retiradoEn ? formatearInstante(s.retiradoEn) : "—"}
                    </td>
                    <td className={`${td} text-text-secondary`}>{s.retiradoPorNombre || "—"}</td>
                  </>
                ) : (
                  <>
                    <td className={td}>{s.damnificado.nombre}</td>
                    <td className={`${td} text-code tabular-nums`}>{formatearDni(s.damnificado.dni)}</td>
                    <td className={`${td} text-text-secondary`}>{TIPOS_SINIESTRO[s.siniestro.tipo]}</td>
                    <td className={td}>
                      <EstadoBadge estado={s.estado} />
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {paginas > 1 && (
        <Paginacion
          pagina={pagina}
          paginas={paginas}
          desde={desde}
          hasta={hasta}
          total={total}
          onPagina={onPagina}
          className="border-t border-border-subtle px-4 py-3"
        />
      )}
    </div>
  );
}

function TablaCargando() {
  const anchos = ["w-20", "w-20", "w-32", "w-24", "w-28", "w-24"];
  const barra = "h-3 animate-pulse rounded-sm bg-bg-raised";
  return (
    <div role="status" aria-label="Cargando solicitudes" className="overflow-hidden rounded-lg border border-border-subtle bg-bg-surface">
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
