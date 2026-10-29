import type { ReactNode } from "react";
import { FileText, LayoutGrid, LogOut, Truck, Users, type LucideIcon } from "lucide-react";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { focus } from "@/components/centralbv/estilos";
import { borrarToken } from "@/features/auth/session";

/* Riel lateral. Existen el panel, Solicitudes y Móviles; el resto de los
   destinos se habilita a medida que se implementan. */
const destinos: { label: string; icon: LucideIcon; to?: "/dashboard" | "/solicitudes" | "/moviles" }[] = [
  { label: "Panel", icon: LayoutGrid, to: "/dashboard" },
  { label: "Solicitudes", icon: FileText, to: "/solicitudes" },
  { label: "Móviles", icon: Truck, to: "/moviles" },
  { label: "Usuarios", icon: Users },
];

const item = `flex size-10 items-center justify-center rounded-lg ${focus}`;

/** Riel + contenido. Sin children muestra la ruta hija (Outlet); la 404 le pasa su contenido. */
export default function AppLayout({ children }: { children?: ReactNode }) {
  const navigate = useNavigate();
  const salir = async () => {
    borrarToken();
    await navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen bg-bg-base text-text-primary">
      <nav
        aria-label="Navegación principal"
        className="sticky top-0 flex h-screen w-(--nav-rail) shrink-0 flex-col items-center gap-6 border-r border-border-subtle py-4"
      >
        {/* Isotipo oficial (Brand/Isotipo en Figma). */}
        <img src="/isotipo-centralBV.svg" alt="CentralBV" title="CentralBV" width={263} height={326} className="h-10 w-auto" />
        <ul className="flex flex-col gap-2">
          {destinos.map(({ label, icon: Icon, to }) => (
            <li key={label}>
              {to ? (
                <Link
                  to={to}
                  title={label}
                  className={item}
                  activeProps={{ className: "bg-bg-raised text-accent-text" }}
                  inactiveProps={{ className: "text-text-muted hover:bg-bg-raised hover:text-text-primary" }}
                >
                  <Icon size={20} strokeWidth={1.5} aria-hidden />
                  <span className="sr-only">{label}</span>
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  title={`${label} (próximamente)`}
                  className={`${item} cursor-not-allowed text-text-disabled`}
                >
                  <Icon size={20} strokeWidth={1.5} aria-hidden />
                  <span className="sr-only">{label} (próximamente)</span>
                </span>
              )}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={salir}
          title="Cerrar sesión"
          className={`${item} mt-auto text-text-muted hover:bg-bg-raised hover:text-text-primary`}
        >
          <LogOut size={20} strokeWidth={1.5} aria-hidden />
          <span className="sr-only">Cerrar sesión</span>
        </button>
      </nav>
      <main className="flex min-w-0 flex-1 flex-col px-(--layout-margin) py-8">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}
