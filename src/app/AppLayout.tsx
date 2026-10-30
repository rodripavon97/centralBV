import { useEffect, useRef, useState, type ReactNode } from "react";
import { FileText, LayoutGrid, LogOut, Menu, Truck, Users, X, type LucideIcon } from "lucide-react";
import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { focus } from "@/components/centralbv/estilos";
import { borrarToken, leerSesion } from "@/features/auth/session";

/* Navegación principal. Desde tablet (md) es el riel lateral de íconos; en mobile se
   esconde detrás de un botón de menú (hamburguesa) para no ocupar el ancho de la pantalla. */
const destinos: {
  label: string;
  icon: LucideIcon;
  to: "/dashboard" | "/solicitudes" | "/usuarios" | "/moviles";
  soloAdmin?: boolean;
}[] = [
  { label: "Panel", icon: LayoutGrid, to: "/dashboard" },
  { label: "Solicitudes", icon: FileText, to: "/solicitudes" },
  { label: "Móviles", icon: Truck, to: "/moviles" },
  { label: "Usuarios", icon: Users, to: "/usuarios", soloAdmin: true },
];

const itemRiel = `flex size-10 items-center justify-center rounded-lg ${focus}`;
const itemMenu = `flex h-12 w-full items-center gap-3 rounded-lg px-3 text-sm ${focus}`;
// Barra superior de mobile: logo a la izquierda y menú a la derecha. El menú abierto repite
// la misma barra, así la ✕ queda justo donde estaba el botón de menú.
const BARRA_MOBILE =
  "sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border-subtle bg-bg-base px-(--layout-margin) md:hidden";
const activo = { className: "bg-bg-raised text-accent-text" };
const inactivo = { className: "text-text-muted hover:bg-bg-raised hover:text-text-primary" };

/** Riel + contenido. Sin children muestra la ruta hija (Outlet); la 404 le pasa su contenido. */
export default function AppLayout({ children }: { children?: ReactNode }) {
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { roles } = leerSesion();
  // Los tokens viejos no traen roles: en ese caso no se oculta el destino y el
  // back sigue siendo el que valida el permiso.
  const esAdmin = roles.length === 0 || roles.includes("ADMIN");
  const visibles = destinos.filter((destino) => !destino.soloAdmin || esAdmin);
  const salir = async () => {
    setMenuAbierto(false);
    borrarToken();
    await navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-text-primary md:flex-row">
      {/* Mobile: barra superior con el botón de menú. */}
      <header className={BARRA_MOBILE}>
        <img src="/isotipo-centralBV.svg" alt="CentralBV" width={263} height={326} className="h-8 w-auto" />
        <button
          type="button"
          onClick={() => setMenuAbierto(true)}
          aria-label="Abrir menú"
          aria-haspopup="dialog"
          aria-expanded={menuAbierto}
          className={`${itemRiel} -mr-2 text-text-secondary hover:bg-bg-raised hover:text-text-primary`}
        >
          <Menu size={20} strokeWidth={1.5} aria-hidden />
        </button>
      </header>

      <MenuMobile abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)}>
        <nav aria-label="Menú" className="flex flex-1 flex-col">
          <ul className="flex flex-col gap-1">
            {visibles.map(({ label, icon: Icon, to }) => (
              <li key={label}>
                <Link to={to} onClick={() => setMenuAbierto(false)} className={itemMenu} activeProps={activo} inactiveProps={inactivo}>
                  <Icon size={20} strokeWidth={1.5} aria-hidden />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <button type="button" onClick={salir} className={`${itemMenu} mt-auto text-text-muted hover:bg-bg-raised hover:text-text-primary`}>
            <LogOut size={20} strokeWidth={1.5} aria-hidden />
            Cerrar sesión
          </button>
        </nav>
      </MenuMobile>

      {/* Tablet y desktop: riel lateral de íconos. */}
      <nav
        aria-label="Navegación principal"
        className="sticky top-0 hidden h-screen w-(--nav-rail) shrink-0 flex-col items-center gap-6 border-r border-border-subtle py-4 md:flex"
      >
        {/* Isotipo oficial (Brand/Isotipo en Figma). */}
        <img src="/isotipo-centralBV.svg" alt="CentralBV" title="CentralBV" width={263} height={326} className="h-10 w-auto" />
        <ul className="flex flex-col gap-2">
          {visibles.map(({ label, icon: Icon, to }) => (
            <li key={label}>
              <Link to={to} title={label} className={itemRiel} activeProps={activo} inactiveProps={inactivo}>
                <Icon size={20} strokeWidth={1.5} aria-hidden />
                <span className="sr-only">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={salir}
          title="Cerrar sesión"
          className={`${itemRiel} mt-auto text-text-muted hover:bg-bg-raised hover:text-text-primary`}
        >
          <LogOut size={20} strokeWidth={1.5} aria-hidden />
          <span className="sr-only">Cerrar sesión</span>
        </button>
      </nav>

      <main className="flex min-w-0 flex-1 flex-col px-(--layout-margin) py-6 md:py-8">{children ?? <Outlet />}</main>
    </div>
  );
}

/**
 * Menú de mobile a pantalla completa: <dialog> nativo, que atrapa el foco y cierra con Escape.
 */
function MenuMobile({ abierto, onCerrar, children }: { abierto: boolean; onCerrar: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    // jsdom no implementa showModal: en tests alcanza con el atributo open.
    if (abierto && !d.open) {
      if (typeof d.showModal === "function") d.showModal();
      else d.setAttribute("open", "");
    }
    if (!abierto && d.open) {
      if (typeof d.close === "function") d.close();
      else d.removeAttribute("open");
    }
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      aria-label="Menú"
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-bg-base p-0 text-text-primary md:hidden"
    >
      {abierto && (
        <div className="flex h-full flex-col">
          <div className={BARRA_MOBILE}>
            <img src="/isotipo-centralBV.svg" alt="CentralBV" width={263} height={326} className="h-8 w-auto" />
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar menú"
              className={`${itemRiel} -mr-2 text-text-secondary hover:bg-bg-raised hover:text-text-primary`}
            >
              <X size={20} strokeWidth={1.5} aria-hidden />
            </button>
          </div>
          <div className="flex flex-1 flex-col px-(--layout-margin) py-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}
