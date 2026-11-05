import { useEffect, useRef, useState, type FormEvent } from "react";
import { CircleX } from "lucide-react";
import type { Solicitud } from "@/types/dominio";
import { Alert } from "@/components/centralbv/Alert";
import { Button } from "@/components/centralbv/Button";
import { Field, Input } from "@/components/centralbv/Field";
import { formatearDni, formatearInstante } from "../domain/formato";
import {
  CAMPOS_ENTREGA,
  NOMBRE_MAX,
  datosEntregaDesdeValores,
  validarEntrega,
  valoresEntregaDesdeSolicitud,
  type DatosEntrega,
  type ErroresEntrega,
  type ValoresEntrega,
} from "../domain/validacionEntrega";

type SolicitudEntrega = Pick<Solicitud, "numero" | "damnificado">;

/** Confirmación de la entrega con los datos de quien retira (US12, Figma S5). */
export default function MarcarEntregadaDialog({
  solicitud,
  abierto,
  onCerrar,
  onConfirmar,
}: {
  solicitud: SolicitudEntrega;
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: (datos: DatosEntrega) => Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [enviando, setEnviando] = useState(false);

  // <dialog> nativo: atrapa el foco, cierra con Escape y pone el fondo.
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  const cerrar = () => {
    if (enviando) return;
    onCerrar();
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby="entrega-titulo"
      onCancel={(e) => {
        e.preventDefault();
        cerrar();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[32.5rem] overflow-y-auto rounded-xl border border-border-strong bg-bg-surface p-6 text-text-primary backdrop:bg-black/70 md:p-8"
    >
      {/* Se monta al abrir: cada apertura arranca con los datos del damnificado y la hora actual. */}
      {abierto && (
        <Formulario
          solicitud={solicitud}
          enviando={enviando}
          onEnviando={setEnviando}
          onCerrar={cerrar}
          onConfirmar={onConfirmar}
        />
      )}
    </dialog>
  );
}

function Formulario({
  solicitud: s,
  enviando,
  onEnviando,
  onCerrar,
  onConfirmar,
}: {
  solicitud: SolicitudEntrega;
  enviando: boolean;
  onEnviando: (enviando: boolean) => void;
  onCerrar: () => void;
  onConfirmar: (datos: DatosEntrega) => Promise<void>;
}) {
  const [valores, setValores] = useState<ValoresEntrega>(() => valoresEntregaDesdeSolicitud(s));
  const [errores, setErrores] = useState<ErroresEntrega>({});
  const [error, setError] = useState<string>();
  // Referencia para quien confirma: la hora que queda registrada la pone el back.
  const [fechaHora] = useState(() => formatearInstante(new Date().toISOString()));

  const cambiar = (campo: keyof ValoresEntrega, valor: string) => {
    setValores((v) => ({ ...v, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  const confirmar = async (e: FormEvent) => {
    e.preventDefault();
    const encontrados = validarEntrega(valores);
    setErrores(encontrados);
    const primero = CAMPOS_ENTREGA.find((c) => encontrados[c]);
    if (primero) {
      document.getElementById(`entrega-${primero}`)?.focus();
      return;
    }
    onEnviando(true);
    setError(undefined);
    try {
      await onConfirmar(datosEntregaDesdeValores(valores));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo marcar como entregada");
    } finally {
      onEnviando(false);
    }
  };

  return (
    <form onSubmit={confirmar} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 id="entrega-titulo" className="text-lg font-semibold">
          Marcar como entregada
        </h2>
        <p className="text-sm text-text-secondary">
          Vas a cerrar el trámite. Se registran la fecha y la hora, y la solicitud pasa al historial.
        </p>
      </div>

      <dl className="flex flex-col gap-3 rounded-lg bg-bg-raised p-4">
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-text-muted">Solicitud</dt>
          <dd className="break-words text-sm">
            N.º <span className="font-mono">{s.numero}</span> · {s.damnificado.nombre} · DNI{" "}
            <span className="tabular-nums">{formatearDni(s.damnificado.dni)}</span>
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-text-muted">Fecha y hora</dt>
          <dd className="text-sm tabular-nums">{fechaHora}</dd>
        </div>
      </dl>

      <div className="grid items-start gap-4 sm:grid-cols-2">
        <Field id="entrega-nombreCompleto" label="Retira" required error={errores.nombreCompleto}>
          <Input
            id="entrega-nombreCompleto"
            autoComplete="off"
            maxLength={NOMBRE_MAX}
            value={valores.nombreCompleto}
            onChange={(e) => cambiar("nombreCompleto", e.target.value)}
            aria-invalid={errores.nombreCompleto ? true : undefined}
            aria-describedby={errores.nombreCompleto ? "entrega-nombreCompleto-error" : undefined}
          />
        </Field>
        <Field id="entrega-dni" label="DNI de quien retira" required error={errores.dni}>
          <Input
            id="entrega-dni"
            inputMode="numeric"
            autoComplete="off"
            value={valores.dni}
            onChange={(e) => cambiar("dni", e.target.value)}
            className="tabular-nums"
            aria-invalid={errores.dni ? true : undefined}
            aria-describedby={errores.dni ? "entrega-dni-error" : undefined}
          />
        </Field>
      </div>

      {error && (
        <Alert tone="danger" icon={CircleX} role="alert">
          {error}
        </Alert>
      )}
      {/* Mobile: acción principal arriba y a todo el ancho. Desktop: a la derecha. */}
      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
        <Button onClick={onCerrar} disabled={enviando} className="w-full sm:w-auto sm:min-w-36">
          Volver
        </Button>
        <Button type="submit" variant="primary" disabled={enviando} className="w-full sm:w-auto sm:min-w-44">
          {enviando ? "Confirmando…" : "Confirmar entrega"}
        </Button>
      </div>
    </form>
  );
}
