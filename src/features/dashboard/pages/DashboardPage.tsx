import { FileText } from "lucide-react";
import { ButtonLink } from "@/components/centralbv/Button";

// Se muestra dentro de AppLayout: el riel lateral ya tiene la marca y "Cerrar sesión".
export function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
      <p className="text-eyebrow">Inicio</p>
      <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
      <p className="text-sm text-text-secondary">Iniciaste sesión correctamente.</p>
      <ButtonLink to="/solicitudes" variant="primary" className="mt-4">
        <FileText size={16} strokeWidth={1.5} aria-hidden />
        Ir a solicitudes
      </ButtonLink>
    </div>
  );
}
