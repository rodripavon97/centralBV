import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Alert } from "@/components/centralbv/Alert";
import { esErrorDeCredenciales, iniciarSesion } from "@/features/auth/api/authApi";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { inputAuth } from "@/features/auth/components/estilos";
import {
  normalizarCredenciales,
  tieneErrores,
  validarCredenciales,
  type CampoCredenciales,
  type Credenciales,
  type ErroresCredenciales,
} from "@/features/auth/domain/credenciales";
import {
  borrarEmailRecuperacion,
  guardarEmailRecuperacion,
} from "@/features/auth/recuperacion";
import { guardarToken } from "@/features/auth/session";

const credencialesIniciales: Credenciales = { email: "", password: "" };

interface LoginPageProps {
  sesionVencida?: boolean;
}

export function LoginPage({ sesionVencida = false }: LoginPageProps = {}) {
  const navigate = useNavigate();
  const [credenciales, setCredenciales] = useState<Credenciales>(credencialesIniciales);
  const [errores, setErrores] = useState<ErroresCredenciales>({});
  const [errorCredenciales, setErrorCredenciales] = useState<string | null>(null);
  const [errorConexion, setErrorConexion] = useState<string | null>(null);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [enviando, setEnviando] = useState(false);

  function actualizarCampo(campo: CampoCredenciales, valor: string) {
    setCredenciales((actuales) => ({ ...actuales, [campo]: valor }));
    setErrores((actuales) => ({ ...actuales, [campo]: undefined }));
    setErrorCredenciales(null);
    setErrorConexion(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const erroresValidacion = validarCredenciales(credenciales);
    setErrores(erroresValidacion);
    setErrorCredenciales(null);
    setErrorConexion(null);

    if (tieneErrores(erroresValidacion)) return;

    setEnviando(true);

    try {
      const { token } = await iniciarSesion(normalizarCredenciales(credenciales));
      guardarToken(token);
      await navigate({ to: "/dashboard" });
    } catch (error) {
      if (esErrorDeCredenciales(error)) {
        setErrorCredenciales("Usuario o contraseña incorrectos");
      } else {
        setErrorConexion("No pudimos conectarnos con el servidor. Intentá de nuevo.");
      }
    } finally {
      setEnviando(false);
    }
  }

  function prepararRecuperacion() {
    const email = normalizarCredenciales(credenciales).email;

    if (email) guardarEmailRecuperacion(email);
    else borrarEmailRecuperacion();
  }

  return (
    <AuthLayout labelledBy="login-title">
      <header className="flex flex-col gap-2">
        <h2 id="login-title" className="text-xl font-semibold text-text-primary">
          Ingresar a CentralBV
        </h2>
        <p className="text-sm text-text-secondary">Usá tu correo y contraseña para continuar.</p>
      </header>

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
        {sesionVencida && (
          <Alert tone="info">Tu sesión expiró por seguridad. Volvé a ingresar.</Alert>
        )}
        {errorCredenciales && <Alert tone="danger">{errorCredenciales}</Alert>}
        {errorConexion && <Alert tone="info">{errorConexion}</Alert>}

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-text-secondary">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={credenciales.email}
            onChange={(event) => actualizarCampo("email", event.target.value)}
            placeholder="irios@bomberos.org"
            aria-invalid={Boolean(errores.email)}
            aria-describedby={errores.email ? "error-email" : undefined}
            disabled={enviando}
            className={inputAuth}
          />
          {errores.email && (
            <p id="error-email" className="text-sm text-state-danger">
              {errores.email}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium text-text-secondary">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type={mostrarContrasena ? "text" : "password"}
            autoComplete="current-password"
            value={credenciales.password}
            onChange={(event) => actualizarCampo("password", event.target.value)}
            placeholder="••••••••"
            aria-invalid={Boolean(errores.password)}
            aria-describedby={errores.password ? "error-password" : undefined}
            disabled={enviando}
            className={inputAuth}
          />
          {errores.password && (
            <p id="error-password" className="text-sm text-state-danger">
              {errores.password}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMostrarContrasena((visible) => !visible)}
          aria-pressed={mostrarContrasena}
          className="flex w-fit items-center gap-2 rounded-sm text-sm text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface"
        >
          {mostrarContrasena ? (
            <EyeOff size={16} strokeWidth={1.5} aria-hidden />
          ) : (
            <Eye size={16} strokeWidth={1.5} aria-hidden />
          )}
          {mostrarContrasena ? "Ocultar contraseña" : "Ver contraseña"}
        </button>

        <button
          type="submit"
          disabled={enviando}
          className="inline-flex h-(--size-control) w-full items-center justify-center gap-2 rounded-lg bg-accent-fill px-4 text-sm font-medium text-white transition-colors hover:bg-accent-fill-hover active:bg-accent-fill-pressed disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface"
        >
          {enviando ? (
            <>
              <LoaderCircle size={16} strokeWidth={1.5} className="animate-spin" aria-hidden />
              Ingresando…
            </>
          ) : (
            "Ingresar"
          )}
        </button>
      </form>

      <div className="flex flex-col gap-3 text-center">
        <Link
          to="/recuperar-contrasena"
          onClick={prepararRecuperacion}
          className="mx-auto rounded-sm text-sm font-medium text-accent-text transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface"
        >
          ¿Olvidaste tu contraseña?
        </Link>
        <p className="text-sm text-text-muted">
          Si no podés ingresar, pedile acceso al administrador general.
        </p>
      </div>
    </AuthLayout>
  );
}
