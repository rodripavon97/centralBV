import { FileText, Flame, LayoutGrid, Truck, Users, type LucideIcon } from "lucide-react";
import { NavLink, Outlet } from "react-router";
import { focus } from "@/components/centralbv/estilos";

/* Riel lateral del rol administrativo. Por ahora solo existe Solicitudes;
   el resto de los destinos se habilita a medida que se implementan. */
const destinos: { label: string; icon: LucideIcon; to?: string }[] = [
  { label: "Panel", icon: LayoutGrid },
  { label: "Solicitudes", icon: FileText, to: "/solicitudes" },
  { label: "Móviles", icon: Truck },
  { label: "Usuarios", icon: Users },
];

const item = `flex size-10 items-center justify-center rounded-lg ${focus}`;

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-bg-base text-text-primary">
      <nav
        aria-label="Navegación principal"
        className="sticky top-0 flex h-screen w-(--nav-rail) shrink-0 flex-col items-center gap-6 border-r border-border-subtle py-4"
      >
        <span className="flex size-10 items-center justify-center rounded-lg bg-accent-fill text-white" title="centralBV">
          <Flame size={20} strokeWidth={1.5} aria-hidden />
          <span className="sr-only">centralBV</span>
        </span>
        <ul className="flex flex-col gap-2">
          {destinos.map(({ label, icon: Icon, to }) => (
            <li key={label}>
              {to ? (
                <NavLink
                  to={to}
                  title={label}
                  className={({ isActive }) =>
                    `${item} ${isActive ? "bg-bg-raised text-accent-text" : "text-text-muted hover:bg-bg-raised hover:text-text-primary"}`
                  }
                >
                  <Icon size={20} strokeWidth={1.5} aria-hidden />
                  <span className="sr-only">{label}</span>
                </NavLink>
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
      </nav>
      <main className="flex min-w-0 flex-1 flex-col px-(--layout-margin) py-8">
        <Outlet />
      </main>
    </div>
  );
}
