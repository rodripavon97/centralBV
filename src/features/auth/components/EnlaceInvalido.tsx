import { Link } from "@tanstack/react-router";
import { ArrowLeft, Clock } from "lucide-react";
import { ButtonLink } from "@/components/centralbv/Button";
import { volverAuth } from "@/features/auth/components/estilos";

/* US03: el enlace venció (2 horas) o ya se usó. */
export function EnlaceInvalido() {
  return (
    <>
      <div className="flex flex-col gap-4">
        <span
          aria-hidden
          className="flex size-10 items-center justify-center rounded-full bg-state-warn-bg text-state-warn"
        >
          <Clock size={20} strokeWidth={1.5} />
        </span>

        <header className="flex flex-col gap-2">
          <h2 id="enlace-invalido-title" className="text-xl font-semibold text-text-primary">
            El enlace ya no es válido
          </h2>
          <p className="text-sm text-text-secondary">
            Vencido (dura 2 horas) o ya se usó. Pedí uno nuevo para continuar.
          </p>
        </header>
      </div>

      <div className="flex flex-col gap-3">
        <ButtonLink to="/recuperar-contrasena" variant="primary" className="w-full">
          Pedir un nuevo enlace
        </ButtonLink>
        <Link to="/login" className={volverAuth}>
          <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
          Volver al inicio de sesión
        </Link>
      </div>
    </>
  );
}
