import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, LoaderCircle, Mail } from "lucide-react";
import { Alert } from "@/components/centralbv/Alert";
import { Button } from "@/components/centralbv/Button";
import { aErrorApi } from "@/lib/http";
import { solicitarEnlaceRecuperacion } from "@/features/auth/api/authApi";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { volverAuth } from "@/features/auth/components/estilos";
import { leerEmailRecuperacion } from "@/features/auth/recuperacion";

/* US03: confirmación genérica después de pedir el enlace.
   El mismo texto se muestra exista o no el correo (no revela cuentas). */
export function RecuperarEnviadoPage() {
  const navigate = useNavigate();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reenviado, setReenviado] = useState(false);

  async function reenviarEnlace() {
    const email = leerEmailRecuperacion();

    if (!email) {
      await navigate({ to: "/recuperar-contrasena" });
      return;
    }

    setEnviando(true);
    setError(null);
    setReenviado(false);

    try {
      await solicitarEnlaceRecuperacion(email);
      setReenviado(true);
    } catch (error) {
      setError(aErrorApi(error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout labelledBy="enviado-title">
      <div className="flex flex-col gap-4">
        <span
          aria-hidden
          className="flex size-10 items-center justify-center rounded-full bg-state-ok-bg text-state-ok"
        >
          <Mail size={20} strokeWidth={1.5} />
        </span>

        <header className="flex flex-col gap-2">
          <h2 id="enviado-title" className="text-xl font-semibold text-text-primary">
            Revisá tu correo
          </h2>
          <p className="text-sm text-text-secondary">
            Si tu cuenta existe, te enviamos un enlace para restablecer tu contraseña. Es válido por
            2 horas y se puede usar una sola vez.
          </p>
        </header>
      </div>

      <div className="flex flex-col gap-3">
        {error && <Alert tone="info">{error}</Alert>}
        {reenviado && (
          <Alert tone="ok" role="status">
            Te enviamos un enlace nuevo. Revisá tu correo.
          </Alert>
        )}

        <Button
          variant="secondary"
          className="w-full"
          onClick={() => void reenviarEnlace()}
          disabled={enviando}
          aria-busy={enviando}
        >
          {enviando ? (
            <>
              <LoaderCircle size={16} strokeWidth={1.5} className="animate-spin" aria-hidden />
              Reenviando…
            </>
          ) : (
            "Reenviar enlace"
          )}
        </Button>
      </div>

      <Link to="/login" className={volverAuth}>
        <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
        Volver al inicio de sesión
      </Link>
    </AuthLayout>
  );
}
