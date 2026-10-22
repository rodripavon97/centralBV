import { useEffect, useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { ArrowDown, ArrowUp, CircleCheck, CircleX, FileText, Plus, RotateCcw, Search } from "lucide-react";
import type { EstadoSolicitud } from "@/types/dominio";
import { Button, ButtonLink } from "@/components/centralbv/Button";
import { focus } from "@/components/centralbv/estilos";
import { Input, Select } from "@/components/centralbv/Field";
import { Alert, EmptyState } from "@/components/centralbv/Feedback";
import { POR_PAGINA, listarSolicitudes, type FiltroSolicitudes, type PaginaSolicitudes } from "./api";
import { ESTADOS_SOLICITUD, TIPOS_SINIESTRO, formatearDni, formatearFecha } from "./formato";
import { useConsulta } from "./useConsulta";
import EstadoBadge from "./EstadoBadge";

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

export default function SolicitudesPage() {
  const [params, setParams] = useSearchParams();
  const creada = (useLocation().state as { creada?: string } | null)?.creada;

  const q = params.get("q") ?? "";
  const estado = (params.get("estado") ?? "") as EstadoSolicitud | "";
  const orden = params.get("orden") === "asc" ? "asc" : "desc";
  const pagina = Number(params.get("pagina")) || 1;
  const hayFiltros = Boolean(q || estado);

  const actualizar = (cambios: Record<string, string | null>) =>
    setParams(
      (prev) => {
        const sig = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(cambios)) {
          if (v) sig.set(k, v);
          else sig.delete(k);
        }
        return sig;
      },
      { replace: true },
    );

  // La búsqueda se escribe en un estado local y pasa a la URL con un pequeño retraso.
  const [texto, setTexto] = useState(q);
  const [qPrevio, setQPrevio] = useState(q);
  if (q !== qPrevio) {
    setQPrevio(q);
    setTexto(q);
  }
  useEffect(() => {
    if (texto.trim() === q) return;
    const t = setTimeout(() => actualizar({ q: texto.trim() || null, pagina: null }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto, q]);

  const filtro: FiltroSolicitudes = { busqueda: q, estado: estado || undefined, orden, pagina };
  const { consulta, anterior, reintentar } = useConsulta(JSON.stringify(filtro), () => listarSolicitudes(filtro));
  const datos = consulta.estado === "listo" ? consulta.datos : consulta.estado === "cargando" ? anterior : undefined;

  const limpiar = () => {
    setTexto("");
    actualizar({ q: null, estado: null, pagina: null });
  };

  let subtitulo = "";
  if (consulta.estado === "cargando") subtitulo = anterior ? "Buscando…" : "Cargando…";
  else if (datos) {
    const { total } = datos;
    if (q) subtitulo = plural(total, "resultado", "resultados");
    else if (estado) subtitulo = plural(total, "solicitud", "solicitudes");
    else if (total === 0) subtitulo = "Todavía no hay solicitudes";
    else subtitulo = `${plural(total, "solicitud", "solicitudes")} · ${orden === "desc" ? "más recientes" : "más antiguas"} primero`;
  }

  const sinSolicitudes = consulta.estado === "listo" && consulta.datos.total === 0 && !hayFiltros;
  const mostrarFiltros = consulta.estado !== "error" && !sinSolicitudes;

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Solicitudes</h1>
          {subtitulo && <p className="text-sm text-text-muted">{subtitulo}</p>}
        </div>
        <ButtonLink to="/solicitudes/nueva" variant="primary">
          <Plus size={16} strokeWidth={1.5} aria-hidden />
          Nueva solicitud
        </ButtonLink>
      </header>

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
          <Select
            aria-label="Filtrar por estado"
            value={estado}
            onChange={(e) => actualizar({ estado: e.target.value || null, pagina: null })}
            className="w-full sm:w-56"
          >
            <option value="">Todos los estados</option>
            {Object.entries(ESTADOS_SOLICITUD).map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      )}

      {consulta.estado === "error" ? (
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
          actualizando={consulta.estado === "cargando"}
          orden={orden}
          onOrden={() => actualizar({ orden: orden === "desc" ? "asc" : null, pagina: null })}
          onPagina={(p) => actualizar({ pagina: p > 1 ? String(p) : null })}
        />
      )}
    </div>
  );
}

const th = "h-10 px-4 text-left align-middle font-normal text-eyebrow";
const td = "h-14 px-4 align-middle";

function Tabla({
  datos,
  actualizando,
  orden,
  onOrden,
  onPagina,
}: {
  datos: PaginaSolicitudes;
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
    if (!(e.target as HTMLElement).closest("a")) navigate(`/solicitudes/${id}`);
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
              <th scope="col" className={th}>DNI</th>
              <th scope="col" className={th}>Siniestro</th>
              <th scope="col" className={th}>Estado</th>
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
                  <Link to={`/solicitudes/${s.id}`} className={`text-code rounded-sm font-medium ${focus}`}>
                    {s.numero}
                  </Link>
                </td>
                <td className={`${td} text-code tabular-nums text-text-secondary`}>{formatearFecha(s.fechaAlta)}</td>
                <td className={td}>
                  {s.damnificado.nombre} {s.damnificado.apellido}
                </td>
                <td className={`${td} text-code tabular-nums`}>{formatearDni(s.damnificado.dni)}</td>
                <td className={`${td} text-text-secondary`}>{TIPOS_SINIESTRO[s.siniestro.tipo]}</td>
                <td className={td}>
                  <EstadoBadge estado={s.estado} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {paginas > 1 && (
        <nav aria-label="Paginación" className="flex items-center justify-between gap-4 border-t border-border-subtle px-4 py-3">
          <p className="text-code text-text-muted tabular-nums">
            {desde}–{hasta} de {total}
          </p>
          <div className="flex gap-2">
            <Button disabled={pagina <= 1} onClick={() => onPagina(pagina - 1)}>
              Anterior
            </Button>
            <Button disabled={pagina >= paginas} onClick={() => onPagina(pagina + 1)}>
              Siguiente
            </Button>
          </div>
        </nav>
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
