import { useEffect, useState, type ReactNode } from "react";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CircleX,
  Download,
  FileText,
  Loader2,
  Lock,
  PenLine,
  Printer,
  RotateCcw,
  SearchX,
} from "lucide-react";
import type { Solicitud } from "@/types/dominio";
import { Button, ButtonLink } from "@/components/centralbv/Button";
import { Alert } from "@/components/centralbv/Alert";
import { EmptyState } from "@/components/centralbv/EmptyState";
import { Field, Textarea } from "@/components/centralbv/Field";
import { focus } from "@/components/centralbv/estilos";
import { descargarConstanciaPdf, firmarSolicitud, generarConstancia, obtenerSolicitud } from "../api/solicitudesApi";
import { useConsulta } from "../hooks/useConsulta";
import EstadoBadge from "../components/EstadoBadge";
import HojaConstancia from "../components/HojaConstancia";
import HojaEscalada, { HojaMiniatura } from "../components/HojaEscalada";
import ImprimirConstanciaDialog from "../components/ImprimirConstanciaDialog";

const ruta = getRouteApi("/app/solicitudes/$id/generar");

const HOJAS = [
  { numero: 1, etiqueta: "Hoja 1 · Archivo del cuartel" },
  { numero: 2, etiqueta: "Hoja 2 · Domiciliado" },
  { numero: 3, etiqueta: "Hoja 3 · Domiciliado (copia)" },
];

export default function GenerarConstanciaPage() {
  const { id } = ruta.useParams();
  const { consulta, reintentar } = useConsulta(id, () => obtenerSolicitud(id));
  const [actualizada, setActualizada] = useState<Solicitud>();
  const navigate = useNavigate();

  if (consulta.estado === "cargando") {
    return <p role="status" className="text-sm text-text-muted">Cargando solicitud…</p>;
  }
  if (consulta.estado === "error") {
    return (
      <EmptyState
        tone="danger"
        icon={CircleX}
        title="No pudimos cargar la solicitud"
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

  const solicitud = actualizada?.id === id ? actualizada : consulta.datos;
  if (!solicitud) {
    return (
      <EmptyState
        icon={SearchX}
        title="No encontramos la solicitud"
        description="Puede que el número esté mal escrito o que la solicitud ya no exista."
        action={<ButtonLink to="/solicitudes">Volver a solicitudes</ButtonLink>}
      />
    );
  }
  if (solicitud.estado === "cancelada") {
    return (
      <EmptyState
        icon={Lock}
        title="La solicitud está cancelada"
        description="No se puede generar la constancia de una solicitud cancelada."
        action={<ButtonLink to="/solicitudes/$id" params={{ id }}>Ver solicitud</ButtonLink>}
      />
    );
  }

  if (solicitud.estado === "pendiente") {
    return (
      <Formulario
        solicitud={solicitud}
        onGuardada={setActualizada}
        onCancelar={() => void navigate({ to: "/solicitudes/$id", params: { id } })}
      />
    );
  }

  return <Visor solicitud={solicitud} onFirmada={setActualizada} />;
}

function VolverSolicitud({ numero, id }: { numero: string; id: string }) {
  return (
    <Link
      to="/solicitudes/$id"
      params={{ id }}
      className={`inline-flex w-fit items-center gap-2 rounded-sm text-sm text-accent-text hover:underline ${focus}`}
    >
      <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
      Solicitud N.º <span className="font-mono">{numero}</span>
    </Link>
  );
}

/* ---------- Paso 1: plantilla con datos y texto adicional ---------- */

function Formulario({
  solicitud,
  onGuardada,
  onCancelar,
}: {
  solicitud: Solicitud;
  onGuardada: (s: Solicitud) => void;
  onCancelar: () => void;
}) {
  const [observaciones, setObservaciones] = useState(solicitud.observaciones ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string>();

  const guardar = async () => {
    setGuardando(true);
    setError(undefined);
    try {
      await generarConstancia(solicitud.id, observaciones);
      onGuardada({
        ...solicitud,
        estado: "constancia_generada",
        observaciones: observaciones.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar la constancia");
      setGuardando(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <VolverSolicitud numero={solicitud.numero} id={solicitud.id} />

      <header>
        <h1 className="text-xl font-semibold">Generar constancia</h1>
        <p className="text-sm text-text-muted">
          Los datos de la solicitud se completan automáticamente. Podés agregar un texto adicional antes de guardar. Se
          generan 3 hojas.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex justify-center rounded-lg border border-border-subtle bg-bg-surface p-4 md:p-6">
          <div className="w-full max-w-[560px]">
            <HojaEscalada>
              <HojaConstancia solicitud={solicitud} observaciones={observaciones} conFirmas />
            </HojaEscalada>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <Panel titulo="Hojas que se generan">
            <ul className="flex flex-col gap-3">
              <li className="flex gap-2">
                <FileText size={16} strokeWidth={1.5} aria-hidden className="mt-0.5 shrink-0 text-text-muted" />
                <div>
                  <p className="text-sm font-medium">Hoja 1 · Archivo del cuartel</p>
                  <p className="text-xs text-text-muted">Incluye RETIRO, DNI, FIRMA y FECHA. Se archiva.</p>
                </div>
              </li>
              <li className="flex gap-2">
                <FileText size={16} strokeWidth={1.5} aria-hidden className="mt-0.5 shrink-0 text-text-muted" />
                <div>
                  <p className="text-sm font-medium">Hoja 2 y 3 · Domiciliado</p>
                  <p className="text-xs text-text-muted">
                    Idénticas, sin línea de retiro. Se entregan, son para imprimir una sola vez.
                  </p>
                </div>
              </li>
            </ul>
          </Panel>

          <Panel titulo="Datos volcados automáticamente">
            <p className="text-sm text-text-secondary">
              Los datos subrayados vienen de la solicitud: solicitante, DNI, domicilio, localidad, partido, motivo,
              pérdidas, para ser presentado, parte, fecha y hora. Para cambiarlos, editá la solicitud.
            </p>
          </Panel>

          <Panel titulo="Texto adicional">
            <Field id="observaciones" label="Observaciones (se suma al final de los datos)">
              <Textarea
                id="observaciones"
                name="observaciones"
                maxLength={2000}
                rows={5}
                placeholder="Agregá un texto adicional (opcional)"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                disabled={guardando}
              />
            </Field>
          </Panel>

          {error && (
            <Alert tone="danger" icon={CircleX} role="alert">
              {error}
            </Alert>
          )}

          <div className="flex flex-col gap-3">
            <Button variant="primary" className="w-full" onClick={guardar} disabled={guardando}>
              {guardando ? (
                <>
                  <Loader2 size={16} strokeWidth={1.5} className="animate-spin" aria-hidden />
                  Generando…
                </>
              ) : (
                "Guardar constancia"
              )}
            </Button>
            <Button className="w-full" onClick={onCancelar} disabled={guardando}>
              Cancelar
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ---------- Paso 2: constancia generada ---------- */

function Visor({ solicitud, onFirmada }: { solicitud: Solicitud; onFirmada: (s: Solicitud) => void }) {
  const [hoja, setHoja] = useState(1);
  const [descargando, setDescargando] = useState(false);
  const [firmando, setFirmando] = useState(false);
  const [imprimiendo, setImprimiendo] = useState(false);
  const [aviso, setAviso] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(undefined), 6000);
    return () => window.clearTimeout(t);
  }, [aviso]);

  const descargar = async () => {
    setDescargando(true);
    setError(undefined);
    try {
      const { blob, filename } = await descargarConstanciaPdf(solicitud.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.append(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setAviso(`PDF descargado: ${filename} (3 hojas)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo descargar el PDF");
    } finally {
      setDescargando(false);
    }
  };

  // US44: se marca una vez que la hoja 1 impresa ya tiene la firma. Habilita la entrega.
  const firmar = async () => {
    setFirmando(true);
    setError(undefined);
    try {
      onFirmada(await firmarSolicitud(solicitud.id));
      setAviso("Constancia marcada como firmada. Ya se puede entregar.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo marcar como firmada");
    } finally {
      setFirmando(false);
    }
  };

  const hojaActual = HOJAS.find((h) => h.numero === hoja) ?? HOJAS[0];

  return (
    <div className="flex flex-col gap-6">
      <VolverSolicitud numero={solicitud.numero} id={solicitud.id} />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold">
              Constancia N.º <span className="font-mono">{solicitud.numero}</span>
            </h1>
            <EstadoBadge estado={solicitud.estado} />
          </div>
          <p className="text-sm text-text-muted">
            3 hojas · formato A4 · membrete oficial
            {solicitud.estado === "constancia_generada" && " · Marcala como firmada cuando la hoja 1 ya tenga la firma"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={descargar} disabled={descargando}>
            {descargando ? (
              <>
                <Loader2 size={16} strokeWidth={1.5} className="animate-spin" aria-hidden />
                Preparando PDF…
              </>
            ) : (
              <>
                <Download size={16} strokeWidth={1.5} aria-hidden />
                Descargar PDF (3 hojas)
              </>
            )}
          </Button>
          <Button onClick={() => setImprimiendo(true)}>
            <Printer size={16} strokeWidth={1.5} aria-hidden />
            Imprimir
          </Button>
          {solicitud.estado === "constancia_generada" && (
            <Button variant="primary" onClick={firmar} disabled={firmando}>
              {firmando ? (
                <>
                  <Loader2 size={16} strokeWidth={1.5} className="animate-spin" aria-hidden />
                  Marcando…
                </>
              ) : (
                <>
                  <PenLine size={16} strokeWidth={1.5} aria-hidden />
                  Marcar como firmada
                </>
              )}
            </Button>
          )}
        </div>
      </header>

      {aviso && (
        <Alert tone="ok" role="status">
          {aviso}
        </Alert>
      )}
      {error && (
        <Alert tone="danger" icon={CircleX} role="alert">
          {error}
        </Alert>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[9rem_minmax(0,1fr)]">
        <aside aria-label="Hojas de la constancia" className="flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {HOJAS.map(({ numero, etiqueta }) => {
            const activa = numero === hoja;
            return (
              <button
                key={numero}
                type="button"
                onClick={() => setHoja(numero)}
                aria-pressed={activa}
                className={`flex w-[8.5rem] shrink-0 flex-col items-center gap-2 rounded-lg p-1 text-left ${focus}`}
              >
                <span className={`block border-2 bg-white ${activa ? "border-accent-text" : "border-border-strong"}`}>
                  <HojaMiniatura ancho={120}>
                    <HojaConstancia solicitud={solicitud} observaciones={solicitud.observaciones} conFirmas={numero === 1} />
                  </HojaMiniatura>
                </span>
                <span className={`text-xs ${activa ? "text-text-primary" : "text-text-muted"}`}>{etiqueta}</span>
              </button>
            );
          })}
        </aside>

        <div className="flex justify-center rounded-lg border border-border-subtle bg-bg-surface p-4 md:p-8">
          <div className="w-full max-w-[620px]" aria-label={hojaActual.etiqueta}>
            <HojaEscalada>
              <HojaConstancia
                solicitud={solicitud}
                observaciones={solicitud.observaciones}
                conFirmas={hoja === 1}
              />
            </HojaEscalada>
          </div>
        </div>
      </div>

      <ImprimirConstanciaDialog
        solicitud={solicitud}
        observaciones={solicitud.observaciones}
        abierto={imprimiendo}
        onCerrar={() => setImprimiendo(false)}
      />
    </div>
  );
}

function Panel({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-bg-surface p-5">
      <h2 className="text-sm font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}
