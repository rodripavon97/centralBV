import { Check, Circle } from "lucide-react";
import { REGLAS_CONTRASENA } from "../domain/validacionUsuario";

/** Requisitos de la contraseña temporal, con su estado actual. */
export default function RequisitosContrasena({ password }: { password: string }) {
  return (
    <ul aria-label="Requisitos de la contraseña" aria-live="polite" className="mt-1 flex flex-col gap-1.5">
      {REGLAS_CONTRASENA.map((regla) => {
        const cumple = regla.cumple(password);
        return (
          <li
            key={regla.id}
            className={`flex items-center gap-2 text-sm ${cumple ? "text-state-ok" : "text-text-muted"}`}
          >
            {cumple ? (
              <Check size={14} strokeWidth={2.5} aria-hidden className="shrink-0" />
            ) : (
              <Circle size={14} strokeWidth={1.5} aria-hidden className="shrink-0" />
            )}
            {regla.etiqueta}
            <span className="sr-only">{cumple ? ": cumplido" : ": pendiente"}</span>
          </li>
        );
      })}
    </ul>
  );
}
