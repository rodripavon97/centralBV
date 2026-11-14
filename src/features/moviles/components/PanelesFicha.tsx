import type { ReactNode } from "react";
import { formatearPatente } from "../domain/patente";
import type { MovilFlota } from "../domain/movil";
import {
  ETIQUETAS_VERIFICACION,
  NOMBRE_VERIFICACION,
  VERIFICACIONES,
  formatearInstante,
  type EstadoVerificacion,
  type RevisionMovil,
} from "../domain/revision";
import BadgeVerificacion from "./BadgeVerificacion";
import EstadoMovilBadge from "./EstadoMovilBadge";

/* Contenido de cada pestaña de la ficha (Figma S4). Inventario (US17) está en PanelInventario;
   Revisiones (US07) está en PanelRevisiones y usa DetalleRevision. El bloque de mantenimiento y
   documentación de Figma (VTV, seguro, service, kilometraje) quedó fuera del MVP. */

function Tarjeta({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-bg-surface p-5">
      <h2 className="text-base font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}

function Dato({ etiqueta, children, mono }: { etiqueta: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs text-text-muted">{etiqueta}</dt>
      <dd className={`flex flex-wrap items-center gap-2 text-sm ${mono ? "font-mono" : ""}`}>{children}</dd>
    </div>
  );
}

const GRILLA_DATOS = "grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4";

const TONO_VERIFICACION: Record<EstadoVerificacion, "ok" | "warn" | "danger"> = {
  ok: "ok",
  atencion: "warn",
  critico: "danger",
};

export function PanelDatosGenerales({ movil }: { movil: MovilFlota }) {
  return (
    <Tarjeta titulo="Datos del móvil">
      <dl className={GRILLA_DATOS}>
        <Dato etiqueta="N.º interno">{movil.codigo}</Dato>
        <Dato etiqueta="Patente" mono>
          {formatearPatente(movil.patente)}
        </Dato>
        <Dato etiqueta="Tipo">{movil.tipo}</Dato>
        <Dato etiqueta="Marca">{movil.marca}</Dato>
        <Dato etiqueta="Modelo">{movil.modelo}</Dato>
        {movil.motivoBaja && (
          <Dato etiqueta="Motivo de baja">
            <span className="whitespace-pre-line">{movil.motivoBaja}</span>
          </Dato>
        )}
      </dl>
    </Tarjeta>
  );
}

const th = "h-10 px-4 text-left align-middle font-normal text-eyebrow";
const td = "px-4 py-3 align-middle";

/** Una revisión (Figma S4 · "Ficha última revisión móvil"): cabecera y tabla de verificaciones. */
export function DetalleRevision({ revision: r }: { revision: RevisionMovil }) {
  const porCodigo = new Map(r.items.map((i) => [i.codigo, i]));

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Resumen de la revisión" className="rounded-lg border border-border-subtle bg-bg-surface p-5">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          <Dato etiqueta="Fecha">{formatearInstante(r.realizadaEn)}</Dato>
          <Dato etiqueta="Revisado por">{r.revisadoPor ?? "—"}</Dato>
          <Dato etiqueta="Resultado">
            <EstadoMovilBadge estado={r.resultado} />
          </Dato>
        </dl>
      </section>

      {/* Desde sm, tabla; en mobile, una lista para no deslizar hacia el costado. */}
      <div className="hidden overflow-hidden rounded-lg border border-border-subtle bg-bg-surface sm:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr>
                <th scope="col" className={th}>Verificación</th>
                <th scope="col" className={th}>Estado</th>
                <th scope="col" className={th}>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {VERIFICACIONES.map(({ codigo }) => {
                const item = porCodigo.get(codigo);
                return (
                  <tr key={codigo} className="border-t border-border-subtle">
                    <th scope="row" className={`${td} text-left font-normal`}>
                      {NOMBRE_VERIFICACION[codigo]}
                    </th>
                    <td className={td}>
                      {item ? (
                        <BadgeVerificacion tono={TONO_VERIFICACION[item.estado]}>{ETIQUETAS_VERIFICACION[item.estado]}</BadgeVerificacion>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className={`${td} text-text-secondary`}>{item?.detalle || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ul aria-label="Verificaciones" className="flex flex-col rounded-lg border border-border-subtle bg-bg-surface sm:hidden">
        {VERIFICACIONES.map(({ codigo }) => {
          const item = porCodigo.get(codigo);
          return (
            <li key={codigo} className="flex flex-col gap-1 border-b border-border-subtle px-4 py-3 last:border-b-0">
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm">{NOMBRE_VERIFICACION[codigo]}</span>
                {item ? (
                  <BadgeVerificacion tono={TONO_VERIFICACION[item.estado]}>{ETIQUETAS_VERIFICACION[item.estado]}</BadgeVerificacion>
                ) : (
                  <span className="text-text-muted">—</span>
                )}
              </div>
              {item?.detalle && <p className="text-xs text-text-secondary">{item.detalle}</p>}
            </li>
          );
        })}
      </ul>

      {r.comentario && (
        <section aria-label="Comentario general" className="rounded-lg border border-border-subtle bg-bg-surface p-5">
          <h3 className="mb-1 text-xs text-text-muted">Comentario general</h3>
          <p className="whitespace-pre-line text-sm">{r.comentario}</p>
        </section>
      )}
    </div>
  );
}
