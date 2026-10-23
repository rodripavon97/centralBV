import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { BrandMark } from "@/components/centralbv/BrandMark";
import { borrarToken } from "@/features/auth/session";

export function DashboardPage() {
  const navigate = useNavigate();

  async function handleLogout() {
    borrarToken();
    await navigate({ to: "/login", search: { sesionVencida: false } });
  }

  return (
    <main className="flex min-h-screen flex-col bg-bg-base">
      <header className="flex items-center justify-between border-b border-border-subtle px-(--layout-margin) py-4">
        <BrandMark />
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex h-(--size-control) items-center gap-2 rounded-lg border border-border-strong px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-raised hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
        >
          <LogOut size={16} strokeWidth={1.5} aria-hidden />
          Salir
        </button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-(--layout-margin) text-center">
        <p className="text-eyebrow">Inicio</p>
        <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary">Iniciaste sesión correctamente.</p>
      </div>
    </main>
  );
}
