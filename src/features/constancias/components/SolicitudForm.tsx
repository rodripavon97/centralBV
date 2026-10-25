import { useState, type FormEvent, type ReactNode } from "react";
import { CircleX } from "lucide-react";
import { Button } from "@/components/centralbv/Button";
import { Field, Input, Select, Textarea } from "@/components/centralbv/Field";
import { fieldProps } from "@/components/centralbv/estilos";
import { Alert } from "@/components/centralbv/Alert";
import { DESTINOS_CONSTANCIA, TIPOS_SINIESTRO } from "../domain/formato";
import {
  CAMPOS,
  VALORES_VACIOS,
  datosDesdeValores,
  validarSolicitud,
  type CampoSolicitud,
  type DatosSolicitud,
  type ValoresSolicitud,
} from "../domain/validacion";
import EstadoBadge from "./EstadoBadge";

/** Formulario de alta (US08) y de edición (US13). */
export default function SolicitudForm({
  inicial = VALORES_VACIOS,
  textoGuardar,
  mostrarEstadoInicial,
  onGuardar,
  onCancelar,
}: {
  inicial?: ValoresSolicitud;
  textoGuardar: string;
  mostrarEstadoInicial?: boolean;
  onGuardar: (datos: DatosSolicitud) => Promise<void>;
  onCancelar: () => void;
}) {
  const [valores, setValores] = useState(inicial);
  const [intentado, setIntentado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string>();

  // Los errores se muestran recién después del primer intento de guardar
  // y desde ahí se actualizan mientras la persona corrige.
  const errores = intentado ? validarSolicitud(valores) : {};
  const cantidadErrores = Object.keys(errores).length;

  const set = (campo: CampoSolicitud) => (e: { target: { value: string } }) =>
    setValores((v) => ({ ...v, [campo]: e.target.value }));

  const control = (campo: CampoSolicitud, required = true) => ({
    ...fieldProps(campo, errores[campo], required),
    value: valores[campo],
    onChange: set(campo),
  });

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setIntentado(true);
    const encontrados = validarSolicitud(valores);
    const primero = CAMPOS.find((c) => encontrados[c]);
    if (primero) {
      document.getElementById(primero)?.focus();
      return;
    }
    setGuardando(true);
    setErrorGuardar(undefined);
    try {
      await onGuardar(datosDesdeValores(valores));
    } catch (err) {
      setErrorGuardar(err instanceof Error ? err.message : "No se pudo guardar la solicitud");
      setGuardando(false);
    }
  };

  return (
    <form noValidate onSubmit={guardar} className="flex max-w-(--content-form-max) flex-col gap-6">
      <Seccion titulo="Damnificado">
        <Field id="nombre" label="Nombre y apellido" required error={errores.nombre} className="md:col-span-2">
          <Input autoComplete="off" {...control("nombre")} />
        </Field>
        <Field id="dni" label="DNI" required error={errores.dni}>
          <Input inputMode="numeric" autoComplete="off" className="font-mono" {...control("dni")} />
        </Field>
        <Field id="telefono" label="Teléfono" error={errores.telefono}>
          <Input type="tel" inputMode="tel" autoComplete="off" className="font-mono" {...control("telefono", false)} />
        </Field>
      </Seccion>

      <Seccion titulo="Siniestro">
        <Field id="tipo" label="Tipo de siniestro" required error={errores.tipo}>
          <Select {...control("tipo")}>
            <option value="" disabled>
              Seleccioná un tipo
            </option>
            {Object.entries(TIPOS_SINIESTRO).map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="fecha" label="Fecha" required error={errores.fecha}>
          <Input placeholder="dd/mm/aaaa" autoComplete="off" className="font-mono" {...control("fecha")} />
        </Field>
        <Field id="hora" label="Hora" required error={errores.hora}>
          <Input placeholder="hh:mm" autoComplete="off" className="font-mono" {...control("hora")} />
        </Field>
        <Field id="direccion" label="Domicilio del hecho" required error={errores.direccion} className="md:col-span-2">
          <Input autoComplete="off" {...control("direccion")} />
        </Field>
        <Field id="numeroParte" label="N.º de parte" required error={errores.numeroParte}>
          <Input autoComplete="off" className="font-mono" {...control("numeroParte")} />
        </Field>
        <Field id="motivo" label="Motivo" required error={errores.motivo}>
          <Input autoComplete="off" {...control("motivo")} />
        </Field>
        <Field id="localidad" label="Localidad" required error={errores.localidad}>
          <Input autoComplete="off" {...control("localidad")} />
        </Field>
        <Field id="partido" label="Partido" required error={errores.partido}>
          <Input autoComplete="off" {...control("partido")} />
        </Field>
        <Field id="perdidas" label="Pérdidas" required error={errores.perdidas} className="md:col-span-2">
          <Textarea placeholder="Describí los daños" {...control("perdidas")} />
        </Field>
        {valores.tipo === "vehicular" && (
          <Field id="patenteVehiculo" label="Patente del vehículo" required error={errores.patenteVehiculo}>
            <Input autoComplete="off" className="font-mono uppercase" {...control("patenteVehiculo")} />
          </Field>
        )}
      </Seccion>

      <Seccion titulo="Constancia">
        <Field id="destino" label="Destino" required error={errores.destino}>
          <Select {...control("destino")}>
            <option value="" disabled>
              Seleccioná un destino
            </option>
            {Object.entries(DESTINOS_CONSTANCIA).map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="razonSocial" label="Para ser presentado" required error={errores.razonSocial}>
          <Input autoComplete="off" {...control("razonSocial")} />
        </Field>
        {valores.destino === "seguro" && (
          <Field id="numeroPoliza" label="N.º de póliza" required error={errores.numeroPoliza}>
            <Input autoComplete="off" className="font-mono" {...control("numeroPoliza")} />
          </Field>
        )}
      </Seccion>

      {mostrarEstadoInicial && (
        <div className="flex items-center gap-3">
          <span className="text-eyebrow">Estado inicial</span>
          <EstadoBadge estado="pendiente" />
        </div>
      )}

      {cantidadErrores > 0 && (
        <Alert tone="danger" icon={CircleX} role="alert">
          Revisá {cantidadErrores === 1 ? "1 campo" : `${cantidadErrores} campos`} antes de guardar.
        </Alert>
      )}
      {errorGuardar && (
        <Alert tone="danger" icon={CircleX} role="alert">
          {errorGuardar}
        </Alert>
      )}

      <div className="flex gap-3">
        <Button type="submit" variant="primary" disabled={guardando}>
          {guardando ? "Guardando…" : textoGuardar}
        </Button>
        <Button onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-lg border border-border-subtle bg-bg-surface p-5">
      <legend className="sr-only">{titulo}</legend>
      <p aria-hidden className="text-eyebrow mb-4">
        {titulo}
      </p>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}
