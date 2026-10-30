import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Alert } from "@/components/centralbv/Alert";
import { Button } from "@/components/centralbv/Button";
import { aErrorApi } from "@/lib/http";
import {
  esErrorDeConfirmacion,
  esErrorDeContrasenaIgual,
  esErrorDeEnlace,
  restablecerContrasena,
} from "@/features/auth/api/authApi";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { CampoAuth } from "@/features/auth/components/CampoAuth";
import { EnlaceInvalido } from "@/features/auth/components/EnlaceInvalido";
import { inputAuth } from "@/features/auth/components/estilos";
import {
  MENSAJE_CONTRASENA_IGUAL,
  MENSAJE_CONTRASENAS_DISTINTAS,
  TEXTO_REQUISITOS_CONTRASENA,
  validarNuevaContrasena,
  type CampoNuevaContrasena,
  type ErroresNuevaContrasena,
  type NuevaContrasena,
} from "@/features/auth/domain/recuperacion";
import {
  borrarEmailRecuperacion,
  borrarTokenRecuperacion,
  capturarTokenDeUrl,
  marcarRecuperacionCompletada,
  marcarTokenRecuperacionUsado,
  tokenRecuperacionUsado,
} from "@/features/auth/recuperacion";
import { tokenVencido } from "@/features/auth/session";

const valoresIniciales: NuevaContrasena = { nueva: "", confirmar: "" };

/* US03: formulario de nueva contraseña. El token llega en el enlace del correo
   (Supabase lo entrega en el hash) y se inhabilita al restablecer. */
export function RestablecerContrasenaPage() {
  const [token] = useState(() => capturarTokenDeUrl());
  const [enlaceInvalido, setEnlaceInvalido] = useState(() => {
    if (!token) return true;
    return tokenRecuperacionUsado(token) || tokenVencido(token);
  });

  const invalido = enlaceInvalido || !token;

  return (
    <AuthLayout labelledBy={invalido ? "enlace-invalido-title" : "nueva-contrasena-title"}>
      {invalido || !token ? (
        <EnlaceInvalido />
      ) : (
        <FormularioNuevaContrasena token={token} onEnlaceInvalido={() => setEnlaceInvalido(true)} />
      )}
    </AuthLayout>
  );
}

function FormularioNuevaContrasena({
  token,
  onEnlaceInvalido,
}: {
  token: string;
  onEnlaceInvalido: () => void;
}) {
  const navigate = useNavigate();
  const [valores, setValores] = useState<NuevaContrasena>(valoresIniciales);
  const [errores, setErrores] = useState<ErroresNuevaContrasena>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [errorConexion, setErrorConexion] = useState<string | null>(null);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [guardando, setGuardando] = useState(false);

  function actualizarCampo(campo: CampoNuevaContrasena, valor: string) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }));
    setErrores((actuales) => ({ ...actuales, [campo]: undefined }));
    setErrorGeneral(null);
    setErrorConexion(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const encontrados = validarNuevaContrasena(valores);
    setErrores(encontrados);
    setErrorGeneral(null);
    setErrorConexion(null);

    const primero = (["nueva", "confirmar"] as CampoNuevaContrasena[]).find(
      (campo) => encontrados[campo],
    );
    if (primero) {
      document.getElementById(primero)?.focus();
      return;
    }

    setGuardando(true);

    try {
      await restablecerContrasena({
        token,
        newPassword: valores.nueva,
        confirmPassword: valores.confirmar,
      });

      // El token queda inhabilitado y no se puede reutilizar el enlace.
      marcarTokenRecuperacionUsado(token);
      borrarTokenRecuperacion();
      borrarEmailRecuperacion();
      marcarRecuperacionCompletada();

      await navigate({ to: "/restablecer-contrasena/lista", replace: true });
    } catch (error) {
      const apiError = aErrorApi(error);

      if (esErrorDeEnlace(apiError)) {
        marcarTokenRecuperacionUsado(token);
        borrarTokenRecuperacion();
        onEnlaceInvalido();
        return;
      }

      if (esErrorDeContrasenaIgual(apiError)) {
        setErrorGeneral(MENSAJE_CONTRASENA_IGUAL);
        return;
      }

      if (esErrorDeConfirmacion(apiError)) {
        setErrores({ confirmar: MENSAJE_CONTRASENAS_DISTINTAS });
        return;
      }

      if (apiError.status === 400) {
        setErrores({ nueva: apiError.message });
        return;
      }

      setErrorConexion(apiError.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <header className="flex flex-col gap-2">
        <h2 id="nueva-contrasena-title" className="text-xl font-semibold text-text-primary">
          Creá tu nueva contraseña
        </h2>
        <p className="text-sm text-text-secondary">Elegí una contraseña distinta a la anterior.</p>
      </header>

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errorGeneral && <Alert tone="danger">{errorGeneral}</Alert>}
        {errorConexion && <Alert tone="info">{errorConexion}</Alert>}

        <CampoAuth id="nueva" label="Nueva contraseña" error={errores.nueva}>
          <input
            id="nueva"
            name="nueva"
            type={mostrarContrasena ? "text" : "password"}
            autoComplete="new-password"
            value={valores.nueva}
            onChange={(event) => actualizarCampo("nueva", event.target.value)}
            placeholder="••••••••"
            aria-invalid={errores.nueva ? true : undefined}
            aria-describedby={errores.nueva ? "nueva-error" : undefined}
            disabled={guardando}
            className={inputAuth}
          />
        </CampoAuth>

        <CampoAuth id="confirmar" label="Confirmar nueva contraseña" error={errores.confirmar}>
          <input
            id="confirmar"
            name="confirmar"
            type={mostrarContrasena ? "text" : "password"}
            autoComplete="new-password"
            value={valores.confirmar}
            onChange={(event) => actualizarCampo("confirmar", event.target.value)}
            placeholder="••••••••"
            aria-invalid={errores.confirmar ? true : undefined}
            aria-describedby={errores.confirmar ? "confirmar-error" : undefined}
            disabled={guardando}
            className={inputAuth}
          />
        </CampoAuth>

        <button
          type="button"
          onClick={() => setMostrarContrasena((visible) => !visible)}
          aria-pressed={mostrarContrasena}
          disabled={guardando}
          className="flex w-fit items-center gap-2 rounded-sm text-sm text-text-muted transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface"
        >
          {mostrarContrasena ? (
            <EyeOff size={16} strokeWidth={1.5} aria-hidden />
          ) : (
            <Eye size={16} strokeWidth={1.5} aria-hidden />
          )}
          {mostrarContrasena ? "Ocultar contraseña" : "Ver contraseña"}
        </button>

        <p className="text-sm text-text-muted">{TEXTO_REQUISITOS_CONTRASENA}</p>

        <Button type="submit" variant="primary" className="w-full" disabled={guardando} aria-busy={guardando}>
          {guardando ? (
            <>
              <LoaderCircle size={16} strokeWidth={1.5} className="animate-spin" aria-hidden />
              Guardando…
            </>
          ) : (
            "Guardar contraseña"
          )}
        </Button>
      </form>
    </>
  );
}
