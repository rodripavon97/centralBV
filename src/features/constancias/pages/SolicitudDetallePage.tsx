import { useId, useState, type ReactNode } from "react";
import { Link, getRouteApi, useLocation, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Ban, CircleAlert, CircleCheck, CircleX, FileText, Lock, Pencil, RotateCcw, SearchX } from "lucide-react";
import type { Solicitud } from "@/types/dominio";
import { Button, ButtonLink } from "@/components/centralbv/Button";
import { Alert } from "@/components/centralbv/Alert";
import { EmptyState } from "@/components/centralbv/EmptyState";
import { focus } from "@/components/centralbv/estilos";
import { cancelarSolicitud, obtenerSolicitud, registrarPago } from "../api/solicitudesApi";
import { DESTINOS_CONSTANCIA, METODOS_PAGO, TIPOS_SINIESTRO, formatearDni, formatearFecha, formatearHora, formatearMonto } from "../domain/formato";
import { entregaBloqueada, estadoPagoDe, puedeRegistrarPago } from "../domain/pago";
import { useConsulta } from "../hooks/useConsulta";
import CancelarSolicitudDialog from "../components/CancelarSolicitudDialog";
import EstadoBadge from "../components/EstadoBadge";
import PagoBadge from "../components/PagoBadge";
import RegistrarPagoDialog from "../components/RegistrarPagoDialog";

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
      onActualizada={setActualizada}
    />
  );
}

function Detalle({
  solicitud: s,
  editada,
  onActualizada,
}: {
  solicitud: Solicitud;
  editada?: boolean;
  onActualizada: (s: Solicitud) => void;
}) {
  const navigate = useNavigate();
  const [cancelando, setCancelando] = useState(false);
  const [registrandoPago, setRegistrandoPago] = useState(false);
  const [pagoGuardado, setPagoGuardado] = useState(false);
  const pendiente = s.estado === "pendiente";
  const conConstancia = s.estado === "constancia_generada" || s.estado === "firmada" || s.estado === "entregada";
  const { damnificado: d, siniestro: sn, constancia: c } = s;

  // US13: solo se edita o cancela una solicitud pendiente.
  const bloqueo: Partial<Record<Solicitud["estado"], string>> = {
    constancia_generada: "La constancia ya fue generada: no se puede editar ni cancelar.",
    firmada: "La solicitud ya fue firmada: no se puede editar ni cancelar.",
    entregada: "La constancia ya fue entregada: no se puede editar ni cancelar.",
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-3">
          <Link
            to="/solicitudes"
            className={`inline-flex w-fit items-center gap-2 rounded-sm text-sm text-accent-text hover:underline ${focus}`}
          >
            <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
            Solicitudes
          </Link>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold">
                Solicitud N.º <span className="font-mono">{s.numero}</span>
              </h1>
              <EstadoBadge estado={s.estado} />
            </div>
            <p className="text-sm text-text-muted">Alta {formatearFecha(s.fechaAlta)}</p>
          </div>
        </div>
        {/* Mobile: acciones apiladas a todo el ancho, la principal primero. */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3 [&>*]:w-full sm:[&>*]:w-auto">
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
            <Button
              variant="primary"
              className="order-first sm:order-none"
              onClick={() => void navigate({ to: "/solicitudes/$id/generar", params: { id: s.id } })}
            >
              <FileText size={16} strokeWidth={1.5} aria-hidden />
              Generar constancia
            </Button>
          )}
          {conConstancia && (
            <ButtonLink
              to="/solicitudes/$id/generar"
              params={{ id: s.id }}
              variant="primary"
              className="order-first sm:order-none"
            >
              <FileText size={16} strokeWidth={1.5} aria-hidden />
              Ver constancia
            </ButtonLink>
          )}
        </div>
      </header>

      {editada && (
        <Alert tone="ok" icon={CircleCheck} role="status">
          Cambios guardados.
        </Alert>
      )}
      {pagoGuardado && (
        <Alert tone="ok" icon={CircleCheck} role="status">
          Pago guardado.
        </Alert>
      )}
      {entregaBloqueada(s) && (
        <Alert tone="warn" icon={CircleAlert}>
          Entrega bloqueada: el arancel figura como pendiente. Registrá el pago para poder entregar.
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

      {/* Figma S5: datos a la izquierda, constancia y arancel a la derecha.
          Debajo de lg queda una sola columna en el mismo orden. */}
      <div className="grid items-start gap-(--layout-gutter) lg:grid-cols-[minmax(0,1fr)_22.5rem]">
        <div className="flex min-w-0 flex-col gap-(--layout-gutter)">
          <Tarjeta titulo="Datos del solicitante">
            <Datos
              campos={[
                { etiqueta: "Nombre y apellido", valor: d.nombre, ancho: true },
                { etiqueta: "DNI", valor: formatearDni(d.dni), numerico: true },
                { etiqueta: "Teléfono", valor: d.telefono, numerico: true },
              ]}
            />
          </Tarjeta>
          <Tarjeta titulo="Datos del siniestro">
            <Datos
              campos={[
                { etiqueta: "Tipo de siniestro", valor: TIPOS_SINIESTRO[sn.tipo] },
                { etiqueta: "Parte N.º", valor: sn.numeroParte, numerico: true },
                { etiqueta: "Fecha", valor: formatearFecha(sn.fecha), numerico: true },
                { etiqueta: "Hora", valor: `${formatearHora(sn.hora)} HS`, numerico: true },
                { etiqueta: "Domicilio del hecho", valor: sn.direccion, ancho: true },
                { etiqueta: "Localidad", valor: sn.localidad },
                { etiqueta: "Partido", valor: sn.partido },
                { etiqueta: "Motivo", valor: sn.motivo, ancho: true },
                { etiqueta: "Pérdidas", valor: sn.perdidas, ancho: !sn.patenteVehiculo },
                ...(sn.patenteVehiculo ? [{ etiqueta: "Patente", valor: sn.patenteVehiculo, numerico: true }] : []),
              ]}
            />
          </Tarjeta>
          {(s.observaciones || s.retiradoEn) && (
            <Tarjeta titulo="Cierre">
              <Datos
                campos={[
                  { etiqueta: "Observaciones", valor: s.observaciones, ancho: true },
                  ...(s.retiradoEn
                    ? [
                        {
                          etiqueta: "Retirada por",
                          valor: `${s.retiradoPorNombre ?? ""} · DNI ${formatearDni(s.retiradoPorDni ?? "")}`,
                          ancho: true,
                        },
                      ]
                    : []),
                ]}
              />
            </Tarjeta>
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-(--layout-gutter)" aria-label="Constancia y arancel">
          <Tarjeta titulo="Constancia">
            <p className="text-sm text-text-secondary">{RESUMEN_CONSTANCIA[s.estado]}</p>
            <Filas
              filas={[
                { etiqueta: "Destino", valor: DESTINOS_CONSTANCIA[c.destino] },
                { etiqueta: "Para ser presentado ante", valor: c.razonSocial },
                ...(c.destino === "seguro" || c.numeroPoliza
                  ? [{ etiqueta: "N.º de póliza", valor: c.numeroPoliza, numerico: true }]
                  : []),
              ]}
            />
          </Tarjeta>
          {s.estado !== "cancelada" && (
            <Arancel
              solicitud={s}
              puedeRegistrar={puedeRegistrarPago(s)}
              onRegistrar={() => {
                setPagoGuardado(false);
                setRegistrandoPago(true);
              }}
            />
          )}
        </aside>
      </div>

      <CancelarSolicitudDialog
        numero={s.numero}
        abierto={cancelando}
        onCerrar={() => setCancelando(false)}
        onConfirmar={async (motivo) => {
          onActualizada(await cancelarSolicitud(s.id, motivo));
          setCancelando(false);
        }}
      />
      <RegistrarPagoDialog
        solicitud={s}
        abierto={registrandoPago}
        onCerrar={() => setRegistrandoPago(false)}
        onGuardar={async (datos) => {
          onActualizada(await registrarPago(s.id, datos));
          setRegistrandoPago(false);
          setPagoGuardado(true);
        }}
      />
    </div>
  );
}

const RESUMEN_CONSTANCIA: Record<Solicitud["estado"], string> = {
  pendiente: "Todavía no se generó la constancia.",
  constancia_generada: "Constancia generada, falta la firma.",
  firmada: "Constancia firmada, lista para entregar.",
  entregada: "Constancia entregada.",
  cancelada: "La solicitud fue cancelada.",
};

/** US14: estado del arancel con su monto y método; se modifica salvo si está cancelada o entregada. */
function Arancel({
  solicitud: s,
  puedeRegistrar,
  onRegistrar,
}: {
  solicitud: Solicitud;
  puedeRegistrar: boolean;
  onRegistrar: () => void;
}) {
  const estado = estadoPagoDe(s);
  const a = s.abono;
  const registrado = estado !== "pendiente";
  return (
    <Tarjeta titulo="Arancel">
      <Filas
        filas={[
          { etiqueta: "Estado de pago", valor: <PagoBadge estado={estado} /> },
          ...(estado === "exento"
            ? [{ etiqueta: "Motivo de la exención", valor: a?.motivoExento }]
            : [
                { etiqueta: "Monto", valor: a?.monto != null ? formatearMonto(a.monto) : undefined, numerico: true },
                { etiqueta: "Método de pago", valor: a?.metodoPago ? METODOS_PAGO[a.metodoPago] : undefined },
              ]),
        ]}
      />
      {puedeRegistrar && (
        <Button onClick={onRegistrar} className="w-full">
          {registrado ? "Modificar pago" : "Registrar pago"}
        </Button>
      )}
    </Tarjeta>
  );
}

function Tarjeta({ titulo, children }: { titulo: string; children: ReactNode }) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-bg-surface p-4 md:p-6"
    >
      <h2 id={id} className="text-base font-semibold">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

interface Campo {
  etiqueta: string;
  valor?: ReactNode;
  /** Ocupa las dos columnas (textos largos). */
  ancho?: boolean;
  numerico?: boolean;
}

/** Datos en grilla: una columna en mobile, dos desde sm (como en Figma). */
function Datos({ campos }: { campos: Campo[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {campos.map(({ etiqueta, valor, ancho, numerico }) => (
        <div key={etiqueta} className={`flex min-w-0 flex-col gap-1 ${ancho ? "sm:col-span-2" : ""}`}>
          <dt className="text-xs text-text-muted">{etiqueta}</dt>
          <dd className={`break-words text-sm ${numerico ? "tabular-nums" : ""} ${valor ? "text-text-primary" : "text-text-muted"}`}>
            {valor || "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Filas etiqueta / valor de las tarjetas laterales. */
function Filas({ filas }: { filas: Omit<Campo, "ancho">[] }) {
  return (
    <dl className="flex flex-col gap-3">
      {filas.map(({ etiqueta, valor, numerico }) => (
        <div key={etiqueta} className="flex min-h-6 items-center justify-between gap-4">
          <dt className="min-w-0 text-sm text-text-secondary">{etiqueta}</dt>
          <dd
            className={`max-w-[60%] shrink-0 break-words text-right text-sm ${numerico ? "tabular-nums" : ""} ${valor ? "text-text-primary" : "text-text-muted"}`}
          >
            {valor || "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}
