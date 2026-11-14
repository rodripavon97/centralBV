import { focus } from "@/components/centralbv/estilos";
import { ESTADOS_BUCHE, ETIQUETA_ESTADO_BUCHE, ETIQUETA_ZONA, porZona, type BucheEnPlano, type Zona } from "../domain/buches";
import { ESTILO_ESTADO_BUCHE } from "./estiloBuche";

/**
 * Plano del móvil visto desde arriba (Figma S5 Buches · "Plano superior"): la cabina con los
 * espejos y el parabrisas (CB-1 va adentro), y la carrocería con las ruedas (dos adelante y una atrás
 * de cada lado). Adentro, lado
 * conductor a la izquierda, techo al centro, lado acompañante a la derecha y trasero abajo.
 * Las tres columnas tienen el mismo alto: el lado con menos buches los estira para llenarlo.
 * Cada buche es un botón (o un cuadro, en la vista previa del generador) con nombre arriba a la
 * izquierda y el glifo del estado arriba a la derecha; el elegido lleva un contorno claro.
 */
export default function PlanoMovil({
  buches,
  seleccion,
  onSeleccionar,
  titulo = "Plano del móvil",
}: {
  buches: BucheEnPlano[];
  /** id del buche elegido. */
  seleccion?: string;
  /** Sin esta función el plano es solo de lectura (vista previa). */
  onSeleccionar?: (id: string) => void;
  titulo?: string;
}) {
  const g = porZona(buches);

  const casilla = (b: BucheEnPlano, opciones: { subtitulo?: string; sufijo?: string; alto?: string } = {}) => {
    const { icon: Icon, borde, texto, fondo } = ESTILO_ESTADO_BUCHE[b.estado];
    const elegido = b.id !== undefined && b.id === seleccion;
    // El elegido se aclara (bg-raised), salvo Dañado, que conserva su fondo rojo.
    const relleno = fondo ?? (elegido ? "bg-bg-raised" : "bg-bg-surface");
    const caja = `relative flex h-full w-full flex-col items-start gap-1.5 rounded-lg px-2 py-1.5 text-left sm:px-2.5 ${
      opciones.alto ?? "min-h-[3.3rem]"
    } ${borde} ${relleno}`;
    const contenido = (
      <>
        <span className="flex w-full items-start justify-between gap-1 sm:gap-2">
          <span className="truncate font-mono text-xs font-medium leading-4 text-text-primary">
            {b.nombre}
            {opciones.sufijo && ` · ${opciones.sufijo}`}
          </span>
          <Icon size={16} strokeWidth={1.5} aria-hidden className={`shrink-0 ${texto}`} />
        </span>
        {opciones.subtitulo && <span className="text-[0.6875rem] leading-[0.875rem] text-text-secondary">{opciones.subtitulo}</span>}
        {/* Contorno de selección de Figma: 4 px por fuera del buche. */}
        {elegido && <span aria-hidden className="pointer-events-none absolute -inset-1 rounded-[11px] border-[1.5px] border-text-primary" />}
      </>
    );
    const etiqueta = `${b.nombre}, ${ETIQUETA_ZONA[b.zona]}, ${ETIQUETA_ESTADO_BUCHE[b.estado]}`;
    if (onSeleccionar && b.id) {
      const id = b.id;
      return (
        <li key={id} className="flex flex-1">
          <button
            type="button"
            aria-pressed={elegido}
            aria-label={etiqueta}
            onClick={() => onSeleccionar(id)}
            className={`${caja} ${elegido || fondo ? "" : "hover:bg-bg-raised"} ${focus}`}
          >
            {contenido}
          </button>
        </li>
      );
    }
    return (
      <li key={b.nombre} aria-label={etiqueta} className="flex flex-1">
        <span className={caja}>{contenido}</span>
      </li>
    );
  };

  const columna = (zona: Zona, subtitulo?: string) => (
    <ul aria-label={ETIQUETA_ZONA[zona]} className="flex min-w-0 flex-col gap-2">
      {g[zona].map((b) => casilla(b, { subtitulo }))}
    </ul>
  );

  const pieza = "absolute rounded-[3px] border-[1.5px] border-border-strong";

  return (
    <figure aria-label={titulo} className="mx-auto flex w-full max-w-[26.25rem] flex-col">
      <p className="text-center font-mono text-[0.6875rem] leading-[0.875rem] text-text-muted">▲ FRENTE</p>

      {/* Cabina: contorno, espejos y parabrisas. */}
      <div className="relative mx-[10.5%] mt-2 rounded-[30px] border-[1.5px] border-border-strong px-[7.5%] pb-[2.875rem] pt-[1.75rem]">
        <span aria-hidden className={`${pieza} -left-4 top-8 h-[1.875rem] w-3.5`} />
        <span aria-hidden className={`${pieza} -right-4 top-8 h-[1.875rem] w-3.5`} />
        <div className="flex min-h-[4.75rem] flex-col items-center justify-center gap-2 rounded-lg border border-border-subtle p-2">
          <p className="font-mono text-[0.6875rem] leading-[0.875rem] text-text-muted">CABINA</p>
          {g.cabina.length > 0 && (
            <ul aria-label={ETIQUETA_ZONA.cabina} className="flex w-full max-w-[16rem] gap-2">
              {g.cabina.map((b) => casilla(b, { alto: "min-h-11" }))}
            </ul>
          )}
        </div>
      </div>

      {/* Carrocería con las ruedas y los buches. */}
      <div className="relative mx-3 mt-[1.125rem] flex flex-col gap-2.5 rounded-xl border-[1.5px] border-border-strong p-2.5 sm:mx-[5.7%] sm:p-3.5">
        <span aria-hidden className={`${pieza} -left-3 top-[3.75rem] h-8 w-3`} />
        <span aria-hidden className={`${pieza} -right-3 top-[3.75rem] h-8 w-3`} />
        <span aria-hidden className={`${pieza} -left-3 top-[6.875rem] h-8 w-3`} />
        <span aria-hidden className={`${pieza} -right-3 top-[6.875rem] h-8 w-3`} />
        {/* Ruedas traseras: a la misma distancia del fondo que las delanteras del frente. */}
        <span aria-hidden className={`${pieza} -left-3 bottom-[3.75rem] h-8 w-3`} />
        <span aria-hidden className={`${pieza} -right-3 bottom-[3.75rem] h-8 w-3`} />
        <div className="grid min-h-[18.75rem] grid-cols-[116fr_92fr_116fr] gap-2 sm:gap-2.5">
          {columna("lado_conductor")}
          {columna("techo", "TECHO · ESCALAS")}
          {columna("lado_acompanante")}
        </div>
        {g.trasero.length > 0 && (
          <ul aria-label={ETIQUETA_ZONA.trasero} className="flex gap-2">
            {g.trasero.map((b) => casilla(b, { sufijo: g.trasero.length === 1 ? "TRASERO" : undefined, alto: "min-h-11" }))}
          </ul>
        )}
      </div>

      <figcaption className="mx-3 mt-2 flex flex-col gap-4 px-2.5 sm:mx-[5.7%] sm:px-3.5">
        <span aria-hidden className="grid grid-cols-[116fr_92fr_116fr] gap-2 font-mono sm:gap-2.5 text-[0.6875rem] leading-[0.875rem] text-text-muted">
          <span>LADO CONDUCTOR</span>
          <span className="text-center">ATRÁS</span>
          <span className="text-right">LADO ACOMPAÑANTE</span>
        </span>
        <span className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[0.6875rem] leading-4 text-text-secondary">
          {ESTADOS_BUCHE.map((e) => {
            const { borde, fondo } = ESTILO_ESTADO_BUCHE[e];
            return (
              <span key={e} className="inline-flex items-center gap-2">
                <span aria-hidden className={`inline-block h-3 w-6 shrink-0 rounded-[3px] ${borde} ${fondo ?? ""}`} />
                {ETIQUETA_ESTADO_BUCHE[e]}
              </span>
            );
          })}
        </span>
      </figcaption>
    </figure>
  );
}
