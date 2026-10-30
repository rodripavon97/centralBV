import { useEffect, useRef } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { CircleAlert, Plus, RotateCcw, SearchX, Truck } from "lucide-react";
import type { EstadoVehiculo } from "@/types/dominio";
import { Button, ButtonLink } from "@/components/centralbv/Button";
import { EmptyState } from "@/components/centralbv/EmptyState";
import { Paginacion } from "@/components/centralbv/Paginacion";
import { tieneRol } from "@/features/auth/session";
import { useConsulta } from "@/features/constancias/hooks/useConsulta";
import { listarFlota, listarTipos, obtenerResumenFlota, type FiltroFlota, type ResumenFlota } from "@/features/moviles/api/flotaApi";
import { ETIQUETAS_ESTADO_MOVIL, type ItemCatalogo, type MovilFlota } from "@/features/moviles/domain/movil";
import {
  ESTADOS_MOVIL,
  POR_PAGINA_FLOTA,
  paginaEquivalente,
  paginar,
  type BusquedaFlota,
} from "@/features/moviles/domain/flota";
import ContadorEstado from "@/features/moviles/components/ContadorEstado";
import FiltroSelect from "@/features/moviles/components/FiltroSelect";
import TarjetaMovil, { TarjetaEsqueleto } from "@/features/moviles/components/TarjetaMovil";
import { useMediaQuery } from "@/lib/useMediaQuery";

const ruta = getRouteApi("/app/dashboard");

// Como en Figma, hasta 4 columnas: con 5 en pantallas anchas el badge tapaba el código.
const GRILLA = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

const hora = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });

/** Contadores y tipos: no dependen de los filtros ni de la página. */
async function cargarBase(): Promise<{ resumen: ResumenFlota; tipos: ItemCatalogo[] }> {
  const [resumen, tipos] = await Promise.all([obtenerResumenFlota(), listarTipos()]);
  return { resumen, tipos };
}

/** Los móviles que cumplen los filtros, con la hora en que llegaron ("actualizado HH:MM"). */
async function cargarFlota(filtro: FiltroFlota): Promise<{ moviles: MovilFlota[]; actualizado: Date }> {
  return { moviles: await listarFlota(filtro), actualizado: new Date() };
}

/* US05: dashboard con la disponibilidad de la flota por código de color
   (Figma: 02 Flujos → 05 Móviles · Flota y revisiones → S1 Dashboard). */
export function DashboardPage() {
  const search = ruta.useSearch();
  const navigate = ruta.useNavigate();
  const ancho = useMediaQuery("(min-width: 40rem)"); // sm: desde 2 columnas
  const porPagina = ancho ? POR_PAGINA_FLOTA.ancho : POR_PAGINA_FLOTA.angosto;
  const pagina = search.pagina ?? 1;
  const listaRef = useRef<HTMLDivElement>(null);

  // Los filtros y la página viven en la URL: se pueden compartir y sobreviven al "atrás".
  const actualizar = (cambios: Partial<BusquedaFlota>) =>
    void navigate({ search: (prev) => ({ ...prev, ...cambios }), replace: true });

  const base = useConsulta("flota-base", cargarBase);
  const filtro: FiltroFlota = { estado: search.estado, tipoId: search.tipo };
  // La página no está en la clave: cambiar de página no vuelve a pedir la flota.
  const lista = useConsulta(JSON.stringify(filtro), () => cargarFlota(filtro));

  const datosBase = base.consulta.estado === "listo" ? base.consulta.datos : undefined;
  const datosLista = lista.consulta.estado === "listo" ? lista.consulta.datos : lista.anterior;
  const vista = datosLista ? paginar(datosLista.moviles, pagina, porPagina) : undefined;

  // Al pasar de 12 a 6 por página (o al revés) sigue a la vista el mismo primer móvil.
  const porPaginaPrevio = useRef(porPagina);
  useEffect(() => {
    if (porPaginaPrevio.current === porPagina) return;
    const nueva = paginaEquivalente(pagina, porPaginaPrevio.current, porPagina);
    porPaginaPrevio.current = porPagina;
    if (nueva !== pagina) actualizar({ pagina: nueva > 1 ? nueva : undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [porPagina]);

  // Si la página de la URL ya no existe (p. ej. quedaron menos móviles), pasa a la última.
  const paginaReal = lista.consulta.estado === "listo" ? vista?.pagina : undefined;
  useEffect(() => {
    if (paginaReal !== undefined && paginaReal !== pagina) actualizar({ pagina: paginaReal > 1 ? paginaReal : undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaReal]);

  const reintentar = () => {
    if (base.consulta.estado === "error") base.reintentar();
    if (lista.consulta.estado === "error") lista.reintentar();
  };

  const irAPagina = (p: number) => {
    actualizar({ pagina: p > 1 ? p : undefined });
    // En mobile la paginación queda abajo: volver al principio de la grilla.
    const grilla = listaRef.current;
    if (grilla && grilla.getBoundingClientRect().top < 0) grilla.scrollIntoView?.({ block: "start" });
  };

  const hayError = base.consulta.estado === "error" || lista.consulta.estado === "error";

  let subtitulo = "Cargando…";
  if (hayError) subtitulo = "Estado de la flota";
  else if (lista.consulta.estado === "listo") {
    subtitulo = `Estado de la flota · actualizado ${hora.format(lista.consulta.datos.actualizado)}`;
  } else if (datosLista) subtitulo = "Actualizando…";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-text-secondary" role="status">
          {subtitulo}
        </p>
      </header>

      {hayError ? (
        <EmptyState
          compacto
          tone="danger"
          icon={CircleAlert}
          title="No pudimos cargar la flota"
          description="Revisá tu conexión e intentá de nuevo."
          action={
            <Button onClick={reintentar}>
              <RotateCcw size={16} strokeWidth={1.5} aria-hidden />
              Reintentar
            </Button>
          }
        />
      ) : !datosBase || !vista ? (
        <ul aria-label="Cargando la flota" className={GRILLA}>
          {Array.from({ length: porPagina }, (_, i) => (
            <TarjetaEsqueleto key={i} />
          ))}
        </ul>
      ) : datosBase.resumen.total === 0 ? (
        <FlotaVacia />
      ) : (
        <>
          <ul aria-label="Resumen de la flota" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {ESTADOS_MOVIL.map((e) => (
              <ContadorEstado key={e} estado={e} cantidad={datosBase.resumen.porEstado[e]} />
            ))}
          </ul>

          <Filtros
            estado={search.estado}
            tipo={search.tipo}
            tipos={datosBase.tipos}
            onFiltrar={(cambios) => actualizar({ ...cambios, pagina: undefined })}
          />

          <div ref={listaRef} className="flex scroll-mt-4 flex-col gap-4">
            {vista.total === 0 ? (
              <EmptyState
                compacto
                icon={SearchX}
                title="Ningún móvil coincide con los filtros"
                description="Probá con otro estado o tipo de vehículo."
                action={
                  <Button onClick={() => actualizar({ estado: undefined, tipo: undefined, pagina: undefined })}>
                    Limpiar filtros
                  </Button>
                }
              />
            ) : (
              <>
                <ul
                  aria-label="Flota"
                  aria-busy={lista.consulta.estado === "cargando"}
                  className={`${GRILLA} transition-opacity ${lista.consulta.estado === "cargando" ? "opacity-60" : ""}`}
                >
                  {vista.items.map((m) => (
                    <TarjetaMovil key={m.id} movil={m} />
                  ))}
                </ul>
                {vista.paginas > 1 && (
                  <Paginacion
                    pagina={vista.pagina}
                    paginas={vista.paginas}
                    desde={vista.desde}
                    hasta={vista.hasta}
                    total={vista.total}
                    onPagina={irAPagina}
                  />
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Sin móviles activos. Solo quien gestiona la flota ve la acción de alta (US04). */
function FlotaVacia() {
  const gestiona = tieneRol("AUTOMOTORES");
  return (
    <EmptyState
      compacto
      icon={Truck}
      title="Todavía no hay móviles"
      description={
        gestiona
          ? "Dá de alta el primer móvil para seguir su disponibilidad."
          : "Cuando se dé de alta un móvil, vas a ver su disponibilidad acá."
      }
      action={
        gestiona ? (
          <ButtonLink to="/moviles/nuevo" variant="primary">
            <Plus size={16} strokeWidth={1.5} aria-hidden />
            Agregar móvil
          </ButtonLink>
        ) : undefined
      }
    />
  );
}

function Filtros({
  estado,
  tipo,
  tipos,
  onFiltrar,
}: {
  estado?: EstadoVehiculo;
  tipo?: string;
  tipos: ItemCatalogo[];
  onFiltrar: (cambios: { estado?: EstadoVehiculo; tipo?: string }) => void;
}) {
  const tipoDesconocido = tipo && !tipos.some((t) => t.id === tipo);
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <FiltroSelect
        id="filtro-estado"
        etiqueta="Filtrar por estado"
        value={estado ?? ""}
        onChange={(v) => onFiltrar({ estado: (v || undefined) as EstadoVehiculo | undefined })}
        className="w-full sm:w-56"
      >
        <option value="">Todos los estados</option>
        {ESTADOS_MOVIL.map((e) => (
          <option key={e} value={e}>
            {ETIQUETAS_ESTADO_MOVIL[e]}
          </option>
        ))}
      </FiltroSelect>
      <FiltroSelect
        id="filtro-tipo"
        etiqueta="Filtrar por tipo de vehículo"
        value={tipo ?? ""}
        onChange={(v) => onFiltrar({ tipo: v || undefined })}
        className="w-full sm:w-56"
      >
        <option value="">Todos los tipos</option>
        {tipos.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nombre}
          </option>
        ))}
        {/* Un enlace viejo con un tipo que ya no existe: se muestra elegido para poder quitarlo. */}
        {tipoDesconocido && <option value={tipo}>Tipo no disponible</option>}
      </FiltroSelect>
    </div>
  );
}
