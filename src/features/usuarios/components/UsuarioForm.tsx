import { useState, type FormEvent } from "react";
import { CircleX, Eye, EyeOff, LoaderCircle, Mail } from "lucide-react";
import { Alert } from "@/components/centralbv/Alert";
import { Button } from "@/components/centralbv/Button";
import { Field, Input, Select } from "@/components/centralbv/Field";
import { fieldProps } from "@/components/centralbv/estilos";
import { ErrorApi } from "@/lib/http";
import { ROLES_USUARIO } from "../domain/usuario";
import {
  CAMPOS_USUARIO,
  VALORES_VACIOS,
  datosDesdeValores,
  datosEditadosDesdeValores,
  validarUsuario,
  type CampoUsuario,
  type DatosEdicionUsuario,
  type DatosUsuario,
  type ValoresUsuario,
} from "../domain/validacionUsuario";
import RequisitosContrasena from "./RequisitosContrasena";

export default function UsuarioForm({
  onGuardar,
  onCancelar,
  inicial,
  modo = "crear",
}: {
  onGuardar?: (datos: DatosUsuario | DatosEdicionUsuario) => Promise<void>;
  onCancelar?: () => void;
  inicial?: Partial<ValoresUsuario>;
  modo?: "crear" | "editar" | "detalle";
}) {
  const [valores, setValores] = useState<ValoresUsuario>({ ...VALORES_VACIOS, ...inicial });
  const [intentado, setIntentado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [errorEmail, setErrorEmail] = useState<string>();
  const [errorGuardar, setErrorGuardar] = useState<string>();
  const esAlta = modo === "crear";
  const soloLectura = modo === "detalle";

  const errores = intentado ? validarUsuario(valores, esAlta) : {};
  const cantidadErrores = Object.keys(errores).length;

  const set = (campo: CampoUsuario) => (e: { target: { value: string } }) => {
    setValores((v) => ({ ...v, [campo]: e.target.value }));
    if (campo === "email") setErrorEmail(undefined);
    setErrorGuardar(undefined);
  };

  const control = (campo: CampoUsuario) => ({
    ...fieldProps(campo, errores[campo], !soloLectura),
    value: valores[campo],
    onChange: set(campo),
  });

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setIntentado(true);
    setErrorEmail(undefined);
    setErrorGuardar(undefined);
    const encontrados = validarUsuario(valores, esAlta);
    const primero = CAMPOS_USUARIO.find((campo) => encontrados[campo]);
    if (primero) {
      document.getElementById(primero)?.focus();
      return;
    }

    setGuardando(true);
    try {
      await onGuardar?.(esAlta ? datosDesdeValores(valores) : datosEditadosDesdeValores(valores));
    } catch (error) {
      if (error instanceof ErrorApi && error.status === 409) {
        setErrorEmail(error.message || "Ya existe un usuario con ese correo electrónico.");
        document.getElementById("email")?.focus();
      } else {
        setErrorGuardar(error instanceof Error ? error.message : "No pudimos guardar el usuario.");
      }
      setGuardando(false);
    }
  };

  return (
    <form noValidate onSubmit={guardar} className="w-full max-w-(--content-form-max)" aria-labelledby="titulo-usuario">
      <div className="flex flex-col gap-5 rounded-lg border border-border-subtle bg-bg-surface p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="nombre" label="Nombre" required={esAlta} error={errores.nombre}>
            <Input disabled={soloLectura} autoComplete="off" {...control("nombre")} />
          </Field>
          <Field id="apellido" label="Apellido" required={esAlta} error={errores.apellido}>
            <Input disabled={soloLectura} autoComplete="off" {...control("apellido")} />
          </Field>
          <Field id="email" label="Correo electrónico" required={esAlta} error={errores.email ?? errorEmail} className="md:col-span-2">
            <Input disabled={soloLectura} type="email" autoComplete="email" {...control("email")} />
          </Field>

          {esAlta && (
            <div className="flex flex-col gap-2 md:col-span-2">
              <Field id="password" label="Contraseña temporal" required error={errores.password}>
                <Input type={mostrarContrasena ? "text" : "password"} autoComplete="new-password" {...control("password")} />
              </Field>
              <button
                type="button"
                onClick={() => setMostrarContrasena((visible) => !visible)}
                aria-pressed={mostrarContrasena}
                className="flex w-fit items-center gap-2 rounded-sm text-sm text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface"
              >
                {mostrarContrasena ? <EyeOff size={16} strokeWidth={1.5} aria-hidden /> : <Eye size={16} strokeWidth={1.5} aria-hidden />}
                {mostrarContrasena ? "Ocultar contraseña" : "Ver contraseña"}
              </button>
              <RequisitosContrasena password={valores.password} />
            </div>
          )}

          <Field id="rol" label="Rol" required={esAlta} error={errores.rol} className="md:col-span-2">
            <Select disabled={soloLectura} {...control("rol")}>
              <option value="" disabled>Seleccioná un rol</option>
              {ROLES_USUARIO.map(({ valor, etiqueta }) => <option key={valor} value={valor}>{etiqueta}</option>)}
            </Select>
          </Field>
        </div>

        {!soloLectura && cantidadErrores > 0 && (
          <Alert tone="danger" icon={CircleX} role="alert">
            Revisá {cantidadErrores === 1 ? "1 campo" : `${cantidadErrores} campos`} antes de guardar.
          </Alert>
        )}
        {!soloLectura && errorGuardar && <Alert tone="danger" icon={CircleX} role="alert">{errorGuardar}</Alert>}

        {!soloLectura && (
          <div className="flex flex-col gap-4 border-t border-border-subtle pt-5 md:flex-row md:items-center md:justify-between">
            {esAlta ? (
              <p className="flex max-w-sm items-start gap-2 text-sm text-text-muted">
                <Mail size={16} strokeWidth={1.5} aria-hidden className="mt-0.5 shrink-0" />
                Al guardar, enviamos un correo de bienvenida a esta dirección.
              </p>
            ) : <span />}
            <div className="flex justify-end gap-3">
              <Button onClick={onCancelar} disabled={guardando}>Cancelar</Button>
              <Button type="submit" variant="primary" disabled={guardando} aria-busy={guardando}>
                {guardando ? <><LoaderCircle size={16} strokeWidth={1.5} className="animate-spin" aria-hidden />Guardando…</> : esAlta ? "Agregar usuario" : "Guardar cambios"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
