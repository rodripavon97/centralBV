import { Check } from "lucide-react";
import { ButtonLink } from "@/components/centralbv/Button";
import { AuthLayout } from "@/features/auth/components/AuthLayout";
import { borrarRecuperacionCompletada } from "@/features/auth/recuperacion";

/* US03: confirmación final. El token ya quedó inhabilitado. */
export function ContrasenaRestablecidaPage() {
  return (
    <AuthLayout labelledBy="restablecida-title">
      <div className="flex flex-col gap-4">
        <span
          aria-hidden
          className="flex size-10 items-center justify-center rounded-full bg-state-ok-bg text-state-ok"
        >
          <Check size={20} strokeWidth={2} />
        </span>

        <header className="flex flex-col gap-2">
          <h2 id="restablecida-title" className="text-xl font-semibold text-text-primary">
            Contraseña restablecida
          </h2>
          <p className="text-sm text-text-secondary">
            Ya podés ingresar con tu nueva contraseña. El enlace que usaste ya no funciona.
          </p>
        </header>
      </div>

      <ButtonLink
        to="/login"
        variant="primary"
        className="w-full"
        onClick={borrarRecuperacionCompletada}
      >
        Ir a iniciar sesión
      </ButtonLink>
    </AuthLayout>
  );
}
