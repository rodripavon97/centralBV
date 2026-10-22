import { useState, type FormEvent, type ReactNode } from "react";
import { CircleX } from "lucide-react";
import { Button } from "@/components/centralbv/Button";
import { Field, Input, Select, Textarea } from "@/components/centralbv/Field";
import { fieldProps } from "@/components/centralbv/estilos";
import { Alert } from "@/components/centralbv/Feedback";
import { TIPOS_SINIESTRO } from "./formato";
import {
  CAMPOS,
  VALORES_VACIOS,
  datosDesdeValores,
  validarSolicitud,
  type CampoSolicitud,
  type DatosSolicitud,
  type ValoresSolicitud,
} from "./validacion";
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
        <Field id="nombre" label="Nombre" required error={errores.nombre}>
          <Input autoComplete="off" {...control("nombre")} />
        </Field>
        <Field id="apellido" label="Apellido" required error={errores.apellido}>
          <Input autoComplete="off" {...control("apellido")} />
        </Field>
        <Field id="dni" label="DNI" required error={errores.dni}>
          <Input inputMode="numeric" autoComplete="off" className="font-mono" {...control("dni")} />
        </Field>
        <Field id="telefono" label="Teléfono" error={errores.telefono}>
          <Input type="tel" inputMode="tel" autoComplete="off" className="font-mono" {...control("telefono", false)} />
        </Field>
        <Field id="domicilio" label="Domicilio" error={errores.domicilio} className="md:col-span-2">
          <Input autoComplete="off" {...control("domicilio", false)} />
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
        <Field id="fechaHora" label="Fecha y hora" required error={errores.fechaHora}>
          <Input placeholder="dd/mm/aaaa hh:mm" autoComplete="off" className="font-mono" {...control("fechaHora")} />
        </Field>
        <Field id="lugar" label="Lugar" required error={errores.lugar} className="md:col-span-2">
          <Input autoComplete="off" {...control("lugar")} />
        </Field>
        <Field id="descripcion" label="Descripción" required error={errores.descripcion} className="md:col-span-2">
          <Textarea placeholder="Describí lo ocurrido" {...control("descripcion")} />
        </Field>
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
