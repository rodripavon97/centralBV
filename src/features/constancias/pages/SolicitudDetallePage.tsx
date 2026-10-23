import { useState, type ReactNode } from "react";
import { getRouteApi, useLocation } from "@tanstack/react-router";
import { Ban, CircleCheck, CircleX, FileText, Lock, Pencil, RotateCcw, SearchX } from "lucide-react";
import type { Solicitud } from "@/types/dominio";
import { Button, ButtonLink } from "@/components/centralbv/Button";
import { Alert } from "@/components/centralbv/Alert";
import { EmptyState } from "@/components/centralbv/EmptyState";
import { cancelarSolicitud, obtenerSolicitud } from "../api/solicitudesApi";
import { TIPOS_SINIESTRO, formatearDni, formatearFechaHora } from "../domain/formato";
import { useConsulta } from "../hooks/useConsulta";
import CancelarSolicitudDialog from "../components/CancelarSolicitudDialog";
import EstadoBadge from "../components/EstadoBadge";

const ruta = getRouteApi("/app/solicitudes/$id");

export default function SolicitudDetallePage() {
  const { id } = ruta.useParams();
  const editada = useLocation({ select: (l) => l.state.editada });
  const { consulta, reintentar } = useConsulta(id, () => obtenerSolicitud(id));
  // Después de cancelar se muestra la versión actualizada sin volver a pedirla.
  const [actualizada, setActualizada] = useState<Solicitud>();

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

  return (
    <Detalle
      solicitud={solicitud}
      editada={editada && !actualizada}
      onCancelada={setActualizada}
    />
  );
}

function Detalle({
  solicitud: s,
  editada,
  onCancelada,
}: {
  solicitud: Solicitud;
  editada?: boolean;
  onCancelada: (s: Solicitud) => void;
}) {
  const [cancelando, setCancelando] = useState(false);
  const pendiente = s.estado === "pendiente";
  const { damnificado: d, siniestro: sn } = s;

  // US13: solo se edita o cancela una solicitud pendiente.
  const bloqueo: Partial<Record<Solicitud["estado"], string>> = {
    constancia_generada: "La constancia ya fue generada: no se puede editar ni cancelar.",
    firmada: "La solicitud ya fue firmada: no se puede editar ni cancelar.",
    entregada: "La constancia ya fue entregada: no se puede editar ni cancelar.",
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-readout">{s.numero}</h1>
            <EstadoBadge estado={s.estado} />
          </div>
          <p className="text-sm text-text-muted">Solicitud de constancia</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {pendiente ? (
            <ButtonLink to="/solicitudes/$id/editar" params={{ id: s.id }}>
              <Pencil size={16} strokeWidth={1.5} aria-hidden />
              Editar
            </ButtonLink>
          ) : (
            <Button disabled>
              <Pencil size={16} strokeWidth={1.5} aria-hidden />
              Editar
            </Button>
          )}
          <Button variant="danger" disabled={!pendiente} onClick={() => setCancelando(true)}>
            <Ban size={16} strokeWidth={1.5} aria-hidden />
            Cancelar solicitud
          </Button>
          {pendiente && (
            // Generar constancia es US10 (M4 · Solicitudes 2/2): todavía no está implementado.
            <Button variant="primary" disabled title="Disponible con US10 · Generar constancia">
              <FileText size={16} strokeWidth={1.5} aria-hidden />
              Generar constancia
            </Button>
          )}
        </div>
      </header>

      {editada && (
        <Alert tone="ok" icon={CircleCheck} role="status">
          Cambios guardados.
        </Alert>
      )}
      {s.estado === "cancelada" ? (
        <Alert tone="neutral" icon={Ban}>
          <p className="font-medium text-text-primary">Solicitud cancelada</p>
          <p className="text-text-secondary">Motivo: {s.motivoCancelacion || "sin motivo registrado"}</p>
        </Alert>
      ) : (
        !pendiente && (
          <Alert tone="neutral" icon={Lock}>
            {bloqueo[s.estado]}
          </Alert>
        )
      )}

      <div className="flex max-w-(--content-form-max) flex-col gap-4">
        <Lectura
          titulo="Damnificado"
          filas={[
            ["Nombre y apellido", `${d.nombre} ${d.apellido}`],
            ["DNI", formatearDni(d.dni), true],
            ["Teléfono", d.telefono, true],
            ["Domicilio", d.domicilio],
          ]}
        />
        <Lectura
          titulo="Siniestro"
          filas={[
            ["Tipo de siniestro", TIPOS_SINIESTRO[sn.tipo]],
            ["Fecha y hora", formatearFechaHora(sn.fechaHora), true],
            ["Lugar", sn.lugar],
            ["Descripción", sn.descripcion],
          ]}
        />
      </div>

      <CancelarSolicitudDialog
        numero={s.numero}
        abierto={cancelando}
        onCerrar={() => setCancelando(false)}
        onConfirmar={async (motivo) => {
          onCancelada(await cancelarSolicitud(s.id, motivo));
          setCancelando(false);
        }}
      />
    </div>
  );
}

function Lectura({ titulo, filas }: { titulo: string; filas: [string, ReactNode | undefined, mono?: boolean][] }) {
  return (
    <section aria-label={titulo} className="rounded-lg border border-border-subtle bg-bg-surface">
      <dl>
        {filas.map(([etiqueta, valor, mono], i) => (
          <div
            key={etiqueta}
            className={`flex items-start justify-between gap-6 px-4 py-3 ${i > 0 ? "border-t border-border-subtle" : ""}`}
          >
            <dt className="text-eyebrow shrink-0 pt-0.5">{etiqueta}</dt>
            <dd className={`text-right text-sm ${mono ? "text-code tabular-nums" : ""} ${valor ? "" : "text-text-muted"}`}>
              {valor || "—"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
