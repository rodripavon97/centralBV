import { useEffect, useRef, useState, type FormEvent } from "react";
import { Circle, CircleCheck, CircleX } from "lucide-react";
import type { EstadoPago, Solicitud } from "@/types/dominio";
import { Alert } from "@/components/centralbv/Alert";
import { Button } from "@/components/centralbv/Button";
import { Field, Input, Select, Textarea } from "@/components/centralbv/Field";
import { ESTADOS_PAGO, formatearImporte } from "../domain/formato";
import {
  CAMPOS_PAGO,
  MOTIVO_MAX,
  OPCIONES_METODO,
  datosPagoDesdeValores,
  parsearMonto,
  validarPago,
  valoresPagoDesdeSolicitud,
  type DatosPago,
  type ErroresPago,
  type ValoresPago,
} from "../domain/validacionPago";

const ESTADOS: EstadoPago[] = ["abonado", "exento", "pendiente"];

/** Registro o modificación del pago del arancel (US14). */
export default function RegistrarPagoDialog({
  solicitud,
  abierto,
  onCerrar,
  onGuardar,
}: {
  solicitud: Pick<Solicitud, "numero" | "abono">;
  abierto: boolean;
  onCerrar: () => void;
  onGuardar: (datos: DatosPago) => Promise<void>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [enviando, setEnviando] = useState(false);

  // <dialog> nativo: atrapa el foco, cierra con Escape y pone el fondo.
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) {
      d.showModal();
      // El navegador enfoca el primer radio aunque no sea el marcado: con las
      // flechas se cambiaría el estado sin querer. Se enfoca el vigente.
      d.querySelector<HTMLInputElement>('input[name="estado-pago"]:checked')?.focus();
    }
    if (!abierto && d.open) d.close();
  }, [abierto]);

  const cerrar = () => {
    if (enviando) return;
    onCerrar();
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby="pago-titulo"
      onCancel={(e) => {
        e.preventDefault();
        cerrar();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[32.5rem] overflow-y-auto rounded-xl border border-border-strong bg-bg-surface p-6 text-text-primary backdrop:bg-black/70 md:p-8"
    >
      {/* Se monta al abrir: cada apertura arranca con el pago vigente de la solicitud. */}
      {abierto && (
        <Formulario
          solicitud={solicitud}
          enviando={enviando}
          onEnviando={setEnviando}
          onCerrar={cerrar}
          onGuardar={onGuardar}
        />
      )}
    </dialog>
  );
}

function Formulario({
  solicitud,
  enviando,
  onEnviando,
  onCerrar,
  onGuardar,
}: {
  solicitud: Pick<Solicitud, "abono">;
  enviando: boolean;
  onEnviando: (enviando: boolean) => void;
  onCerrar: () => void;
  onGuardar: (datos: DatosPago) => Promise<void>;
}) {
  const [valores, setValores] = useState<ValoresPago>(() => valoresPagoDesdeSolicitud(solicitud));
  const [errores, setErrores] = useState<ErroresPago>({});
  const [error, setError] = useState<string>();

  const cambiar = <K extends keyof ValoresPago>(campo: K, valor: ValoresPago[K]) => {
    setValores((v) => ({ ...v, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  // Al salir del campo el importe queda con separador de miles ("12000" → "12.000").
  const normalizarMonto = () => {
    const monto = parsearMonto(valores.monto);
    if (monto != null && monto > 0) setValores((v) => ({ ...v, monto: formatearImporte(monto) }));
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    const encontrados = validarPago(valores);
    setErrores(encontrados);
    const primero = CAMPOS_PAGO.find((c) => encontrados[c]);
    if (primero) {
      document.getElementById(`pago-${primero}`)?.focus();
      return;
    }
    onEnviando(true);
    setError(undefined);
    try {
      await onGuardar(datosPagoDesdeValores(valores));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el pago");
    } finally {
      onEnviando(false);
    }
  };

  return (
    <form onSubmit={guardar} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 id="pago-titulo" className="text-lg font-semibold">
          Registrar pago del arancel
        </h2>
        <p className="text-sm text-text-secondary">Registrá si el solicitante abonó el arancel de la constancia.</p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm text-text-secondary">Estado de pago</legend>
        {ESTADOS.map((estado) => {
          const elegido = valores.estado === estado;
          const Icono = elegido ? CircleCheck : Circle;
          return (
            <label
              key={estado}
              className={`flex h-(--size-control) cursor-pointer items-center gap-3 rounded-lg border px-4 text-sm transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent-text ${
                elegido
                  ? "border-border-strong bg-bg-raised font-medium text-text-primary"
                  : "border-border-subtle text-text-secondary hover:bg-bg-raised/60"
              }`}
            >
              {/* El radio nativo queda para el teclado y el lector; el glifo es el de Figma. */}
              <input
                type="radio"
                name="estado-pago"
                value={estado}
                checked={elegido}
                onChange={() => {
                  cambiar("estado", estado);
                  setErrores({});
                }}
                className="sr-only"
              />
              <Icono
                size={18}
                strokeWidth={1.75}
                aria-hidden
                className={`shrink-0 ${elegido ? "text-state-ok" : "text-text-muted"}`}
              />
              {ESTADOS_PAGO[estado]}
            </label>
          );
        })}
      </fieldset>

      {valores.estado === "abonado" && (
        <>
          <Field id="pago-monto" label="Monto abonado" required error={errores.monto}>
            <div className="relative">
              <span
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-text-secondary md:text-sm"
              >
                $
              </span>
              <Input
                id="pago-monto"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0"
                value={valores.monto}
                onChange={(e) => cambiar("monto", e.target.value)}
                onBlur={normalizarMonto}
                className="pl-7 tabular-nums"
                aria-invalid={errores.monto ? true : undefined}
                aria-describedby={errores.monto ? "pago-monto-error" : undefined}
              />
            </div>
          </Field>
          <Field id="pago-metodoPago" label="Método de pago" required error={errores.metodoPago}>
            <Select
              id="pago-metodoPago"
              required
              value={valores.metodoPago}
              onChange={(e) => cambiar("metodoPago", e.target.value as ValoresPago["metodoPago"])}
              aria-invalid={errores.metodoPago ? true : undefined}
              aria-describedby={errores.metodoPago ? "pago-metodoPago-error" : undefined}
            >
              <option value="" disabled>
                Seleccioná un método
              </option>
              {OPCIONES_METODO.map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </Select>
          </Field>
        </>
      )}

      {valores.estado === "exento" && (
        <Field id="pago-motivoExento" label="Motivo de la exención" required error={errores.motivoExento}>
          <Textarea
            id="pago-motivoExento"
            maxLength={MOTIVO_MAX}
            placeholder="Explicá por qué está exento"
            value={valores.motivoExento}
            onChange={(e) => cambiar("motivoExento", e.target.value)}
            aria-invalid={errores.motivoExento ? true : undefined}
            aria-describedby={errores.motivoExento ? "pago-motivoExento-error" : undefined}
          />
        </Field>
      )}

      {valores.estado === "pendiente" && (
        <p className="text-sm text-text-muted">El arancel vuelve a figurar como pendiente y se borran los datos del pago.</p>
      )}

      {error && (
        <Alert tone="danger" icon={CircleX} role="alert">
          {error}
        </Alert>
      )}
      {/* Mobile: acción principal arriba y a todo el ancho. Desktop: a la derecha. */}
      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
        <Button onClick={onCerrar} disabled={enviando} className="w-full sm:w-auto sm:min-w-36">
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={enviando} className="w-full sm:w-auto sm:min-w-44">
          {enviando ? "Guardando…" : "Guardar pago"}
        </Button>
      </div>
    </form>
  );
}
