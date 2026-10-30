import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { Alert } from "@/components/centralbv/Alert";
import { Button } from "@/components/centralbv/Button";
import { aErrorApi } from "@/lib/http";
import { solicitarEnlaceRecuperacion } from "@/features/auth/api/authApi";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { CampoAuth } from "@/features/auth/components/CampoAuth";
import { inputAuth, volverAuth } from "@/features/auth/components/estilos";
import {
  normalizarEmail,
  tieneErroresRecuperacion,
  validarSolicitudRecuperacion,
  type ErroresSolicitudRecuperacion,
} from "@/features/auth/domain/recuperacion";
import {
  borrarEmailRecuperacion,
  guardarEmailRecuperacion,
  leerEmailRecuperacion,
} from "@/features/auth/recuperacion";

/* US03: pedir el enlace de recuperación. */
export function RecuperarContrasenaPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => leerEmailRecuperacion() ?? "");
  const [errores, setErrores] = useState<ErroresSolicitudRecuperacion>({});
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function actualizarEmail(valor: string) {
    setEmail(valor);
    setErrores({});
    setErrorServidor(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const encontrados = validarSolicitudRecuperacion({ email });
    setErrores(encontrados);
    setErrorServidor(null);

    if (tieneErroresRecuperacion(encontrados)) {
      document.getElementById("email")?.focus();
      return;
    }

    const correo = normalizarEmail(email);
    setEnviando(true);

    try {
      await solicitarEnlaceRecuperacion(correo);
      guardarEmailRecuperacion(correo);
      await navigate({ to: "/recuperar-contrasena/enviado" });
    } catch (error) {
      setErrorServidor(aErrorApi(error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout labelledBy="recuperar-title">
      <header className="flex flex-col gap-2">
        <h2 id="recuperar-title" className="text-xl font-semibold text-text-primary">
          Recuperá tu contraseña
        </h2>
        <p className="text-sm text-text-secondary">
          Ingresá tu correo y te enviaremos un enlace para crear una nueva. El enlace es válido por
          2 horas.
        </p>
      </header>

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errorServidor && <Alert tone="info">{errorServidor}</Alert>}

        <CampoAuth id="email" label="Correo electrónico" error={errores.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => actualizarEmail(event.target.value)}
            placeholder="irios@bomberos.org"
            aria-invalid={errores.email ? true : undefined}
            aria-describedby={errores.email ? "email-error" : undefined}
            disabled={enviando}
            className={inputAuth}
          />
        </CampoAuth>

        <Button type="submit" variant="primary" className="w-full" disabled={enviando} aria-busy={enviando}>
          {enviando ? (
            <>
              <LoaderCircle size={16} strokeWidth={1.5} className="animate-spin" aria-hidden />
              Enviando…
            </>
          ) : (
            "Enviar enlace"
          )}
        </Button>
      </form>

      <Link
        to="/login"
        onClick={borrarEmailRecuperacion}
        className={volverAuth}
      >
        <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
        Volver al inicio de sesión
      </Link>
    </AuthLayout>
  );
}
