import { useEffect } from "react";
import { Link, getRouteApi, useLocation } from "@tanstack/react-router";
import { ChevronRight, CircleCheck, CircleX, Lock, Plus, RotateCcw, SearchX, Truck } from "lucide-react";
import { Alert } from "@/components/centralbv/Alert";
import { Button, ButtonLink } from "@/components/centralbv/Button";
import { EmptyState } from "@/components/centralbv/EmptyState";
import { Paginacion } from "@/components/centralbv/Paginacion";
import { focus } from "@/components/centralbv/estilos";
import { tieneRol } from "@/features/auth/session";
import { useConsulta } from "@/features/constancias/hooks/useConsulta";
import { ErrorApi } from "@/lib/http";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { listarMoviles } from "../api/flotaApi";
import { POR_PAGINA_LISTA, type BusquedaMoviles } from "../domain/busquedaMoviles";
import { paginar } from "../domain/flota";
import { ordenarPorDenominacion, type MovilFlota } from "../domain/movil";
import { formatearPatente } from "../domain/patente";
import BuscadorMoviles from "../components/BuscadorMoviles";
import EstadoMovilBadge from "../components/EstadoMovilBadge";
import TarjetaMovil from "../components/TarjetaMovil";

const ruta = getRouteApi("/app/moviles");

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/**
 * Lista de móviles (Figma S2 · "Móviles lista"). US04: destino después del alta, con el aviso
 * "Móvil M-4 creado con estado Operativo.". US06: búsqueda por número interno o patente
 * (?q= en la URL) y cada fila abre la ficha. El back filtra; el orden natural (M-2 antes
 * que M-10) y la paginación se hacen acá, como en el dashboard.
 */
export default function MovilesPage() {
  const search = ruta.useSearch();
  const navigate = ruta.useNavigate();
  const movilCreado = useLocation({ select: (l) => l.state.movilCreado });
  const puedeAgregar = tieneRol("AUTOMOTORES");
  const angosto = useMediaQuery("(max-width: 39.9375rem)"); // menos de sm: tarjetas en vez de tabla
  const q = search.q ?? "";
  const pagina = search.pagina ?? 1;

  // La búsqueda y la página viven en la URL: se pueden compartir y sobreviven al "atrás".
  const actualizar = (cambios: Partial<BusquedaMoviles>) =>
    void navigate({ search: (prev) => ({ ...prev, ...cambios }), replace: true });
  const buscar = (texto: string) => actualizar({ q: texto || undefined, pagina: undefined });

  const { consulta, anterior, reintentar } = useConsulta(`moviles:${q}`, () => listarMoviles({ busqueda: q }));
  const datos = consulta.estado === "listo" ? consulta.datos : consulta.estado === "cargando" ? anterior : undefined;
  const vista = datos ? paginar(ordenarPorDenominacion(datos.items), pagina, POR_PAGINA_LISTA) : undefined;

  // Si la página de la URL ya no existe (p. ej. la búsqueda trae menos móviles), pasa a la última.
  const paginaReal = consulta.estado === "listo" ? vista?.pagina : undefined;
  useEffect(() => {
    if (paginaReal !== undefined && paginaReal !== pagina) actualizar({ pagina: paginaReal > 1 ? paginaReal : undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaReal]);

  const sinPermiso = consulta.estado === "error" && consulta.error instanceof ErrorApi && consulta.error.status === 403;
  const sinMoviles = consulta.estado === "listo" && consulta.datos.total === 0 && !q;

  let subtitulo = "";
  if (consulta.estado === "cargando") subtitulo = anterior ? "Buscando…" : "Cargando…";
  else if (consulta.estado === "listo") {
    subtitulo = q ? plural(consulta.datos.total, "resultado", "resultados") : plural(consulta.datos.total, "móvil", "móviles");
  }

  const agregar = (
    <ButtonLink to="/moviles/nuevo" variant="primary">
      <Plus size={16} strokeWidth={1.5} aria-hidden />
      Agregar móvil
    </ButtonLink>
  );

  // Al volver de la ficha se recupera la misma búsqueda y página.
  const volverA: BusquedaMoviles = { q: search.q, pagina: search.pagina };

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

      {consulta.estado !== "error" && !sinMoviles && <BuscadorMoviles valor={q} onBuscar={buscar} />}

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
      ) : !vista ? (
        <TablaCargando />
      ) : vista.total === 0 && q ? (
        <EmptyState
          icon={SearchX}
          title="Móvil no encontrado"
          description="No hay ningún móvil con ese número interno o patente."
          action={<Button onClick={() => buscar("")}>Limpiar búsqueda</Button>}
        />
      ) : vista.total === 0 ? (
        <EmptyState
          icon={Truck}
          title="Todavía no hay móviles"
          description={puedeAgregar ? "Registrá la primera unidad de la flota." : "El encargado de automotores todavía no cargó ninguna unidad."}
          action={puedeAgregar ? agregar : undefined}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {angosto ? (
            <ul aria-label="Móviles" className="flex flex-col gap-3">
              {vista.items.map((m) => (
                <TarjetaMovil key={m.id} movil={m} volverA={volverA} />
              ))}
            </ul>
          ) : (
            <Tabla moviles={vista.items} volverA={volverA} />
          )}
          {vista.paginas > 1 && (
            <Paginacion
              pagina={vista.pagina}
              paginas={vista.paginas}
              desde={vista.desde}
              hasta={vista.hasta}
              total={vista.total}
              onPagina={(p) => actualizar({ pagina: p > 1 ? p : undefined })}
            />
          )}
        </div>
      )}
    </div>
  );
}

const th = "h-10 px-4 text-left align-middle font-normal text-eyebrow";
const td = "h-14 px-4 align-middle";

/** Tabla de Figma. Toda la fila abre la ficha: el link está en el número interno y se estira
    sobre la fila, así se llega con Tab y se abre con Enter. */
function Tabla({ moviles, volverA }: { moviles: MovilFlota[]; volverA: BusquedaMoviles }) {
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
              <th scope="col" className="w-12">
                <span className="sr-only">Abrir ficha</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {moviles.map((m) => (
              <tr key={m.id} className="relative border-t border-border-subtle hover:bg-bg-raised">
                <th scope="row" className={`${td} text-left font-semibold`}>
                  <Link
                    to="/moviles/$id"
                    params={{ id: m.id }}
                    state={{ listaMoviles: volverA }}
                    className={`rounded-sm after:absolute after:inset-0 after:content-[''] ${focus}`}
                  >
                    {m.codigo}
                  </Link>
                </th>
                <td className={`${td} text-code`}>{formatearPatente(m.patente)}</td>
                <td className={`${td} text-text-secondary`}>{m.tipo}</td>
                <td className={`${td} text-text-secondary`}>
                  {m.marca} {m.modelo}
                </td>
                <td className={td}>
                  <EstadoMovilBadge estado={m.estado} />
                </td>
                <td className={`${td} text-text-muted`}>
                  <ChevronRight size={16} strokeWidth={1.5} aria-hidden />
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
