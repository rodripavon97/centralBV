import { useState, type FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { CircleX, Clock, Eye, EyeOff, Flame } from "lucide-react";
import { Button } from "@/components/centralbv/Button";
import { Field, Input } from "@/components/centralbv/Field";
import { Alert } from "@/components/centralbv/Feedback";
import { focus } from "@/components/centralbv/estilos";
import { guardarSesion, leerSesion } from "@/lib/sesion";
import { ROL_CONSTANCIAS, iniciarSesion } from "./api";

/** Login (US02), como el M1 · Acceso de Figma. */
export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const expirada = params.get("expirada") === "1";
  // Solo rutas internas, para no redirigir a otro sitio.
  const volver = params.get("volver")?.startsWith("/") ? params.get("volver")! : "/solicitudes";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string>();

  if (leerSesion()) return <Navigate to={volver} replace />;

  const ingresar = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Completá tu correo y tu contraseña.");
      return;
    }
    setEnviando(true);
    setError(undefined);
    try {
      const sesion = await iniciarSesion(email.trim(), password);
      if (!sesion.usuario.roles.includes(ROL_CONSTANCIAS)) {
        setError("Tu usuario no tiene acceso al módulo de constancias.");
        setEnviando(false);
        return;
      }
      guardarSesion(sesion);
      navigate(volver, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
      setEnviando(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-bg-base px-(--layout-margin) py-12 text-text-primary">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-accent-fill text-white">
          <Flame size={20} strokeWidth={1.5} aria-hidden />
        </span>
        <span className="text-lg font-semibold">CentralBV</span>
      </div>

      <form
        noValidate
        onSubmit={ingresar}
        className="flex w-full max-w-sm flex-col gap-5 rounded-xl border border-border-subtle bg-bg-surface p-6"
      >
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Ingresar a CentralBV</h1>
          <p className="text-sm text-text-muted">Usá tu correo y contraseña para continuar.</p>
        </header>

        {error ? (
          <Alert tone="danger" icon={CircleX} role="alert">
            {error}
          </Alert>
        ) : (
          expirada && (
            <Alert tone="info" icon={Clock} role="status">
              Tu sesión expiró por inactividad. Volvé a ingresar.
            </Alert>
          )
        )}

        <Field id="email" label="Correo electrónico">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <div className="flex flex-col gap-3">
          <Field id="password" label="Contraseña">
            <Input
              id="password"
              name="password"
              type={verPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <button
            type="button"
            aria-pressed={verPassword}
            onClick={() => setVerPassword((v) => !v)}
            className={`flex w-fit items-center gap-2 rounded-md text-sm text-text-secondary hover:text-text-primary ${focus}`}
          >
            {verPassword ? <EyeOff size={16} strokeWidth={1.5} aria-hidden /> : <Eye size={16} strokeWidth={1.5} aria-hidden />}
            {verPassword ? "Ocultar contraseña" : "Ver contraseña"}
          </button>
        </div>

        <Button type="submit" variant="primary" disabled={enviando} className="w-full">
          {enviando ? "Ingresando…" : "Ingresar"}
        </Button>
      </form>
    </main>
  );
}
