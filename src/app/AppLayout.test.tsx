import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearRouter } from "@/app/router";
import { guardarToken, obtenerToken } from "@/features/auth/session";
import { listarFlota, listarTipos, obtenerResumenFlota } from "@/features/moviles/api/flotaApi";
import { listarSolicitudes } from "@/features/constancias/api/solicitudesApi";
import { tokenDePrueba } from "@/test/token";

vi.mock("@/features/moviles/api/flotaApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/moviles/api/flotaApi")>();
  return { ...actual, listarFlota: vi.fn(), listarTipos: vi.fn(), obtenerResumenFlota: vi.fn() };
});

vi.mock("@/features/constancias/api/solicitudesApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/constancias/api/solicitudesApi")>();
  return { ...actual, listarSolicitudes: vi.fn(), listarHistorial: vi.fn() };
});

const TIPO = "11111111-1111-4111-8111-111111111111";

const movil = {
  id: "1",
  codigo: "M-1",
  patente: "AB123CD",
  tipo: "Autobomba",
  marca: "Iveco",
  modelo: "Tector",
  tipoId: TIPO,
  marcaId: "marca-1",
  modeloId: "modelo-1",
  estado: "operativo" as const,
};

beforeEach(() => {
  vi.mocked(listarTipos).mockResolvedValue([]);
  vi.mocked(obtenerResumenFlota).mockResolvedValue({
    total: 1,
    porEstado: { operativo: 1, observaciones: 0, fuera_de_servicio: 0, mantenimiento: 0 },
  });
  vi.mocked(listarFlota).mockResolvedValue([movil]);
  vi.mocked(listarSolicitudes).mockResolvedValue({ items: [], total: 0, pagina: 1, paginas: 0 });
});

function renderApp(path = "/dashboard") {
  const history = createMemoryHistory({ initialEntries: [path] });
  render(<RouterProvider router={crearRouter(history)} />);
  return history;
}

const riel = () => screen.getByRole("navigation", { name: "Navegación principal" });

describe("AppLayout", () => {
  it("muestra los cuatro destinos a un administrador", async () => {
    guardarToken(tokenDePrueba(["ADMIN"]));
    renderApp();

    await screen.findByRole("list", { name: "Flota" });
    const nav = riel();
    expect(within(nav).getByRole("link", { name: "Panel" })).toHaveAttribute("href", "/dashboard");
    expect(within(nav).getByRole("link", { name: "Solicitudes" })).toHaveAttribute("href", "/solicitudes");
    expect(within(nav).getByRole("link", { name: "Móviles" })).toHaveAttribute("href", "/moviles");
    expect(within(nav).getByRole("link", { name: "Usuarios" })).toHaveAttribute("href", "/usuarios");
  });

  it("oculta Usuarios a un usuario común", async () => {
    guardarToken(tokenDePrueba(["COMUN"]));
    renderApp();

    await screen.findByRole("list", { name: "Flota" });
    const nav = riel();
    expect(within(nav).getByRole("link", { name: "Panel" })).toBeInTheDocument();
    expect(within(nav).queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument();
  });

  it("un token viejo sin roles conserva todos los destinos", async () => {
    guardarToken(tokenDePrueba([]));
    renderApp();

    await screen.findByRole("list", { name: "Flota" });
    expect(within(riel()).getByRole("link", { name: "Usuarios" })).toBeInTheDocument();
  });

  it("abre y cierra el menú de mobile", async () => {
    guardarToken(tokenDePrueba(["COMUN"]));
    renderApp();
    await screen.findByRole("list", { name: "Flota" });

    expect(screen.queryByRole("navigation", { name: "Menú" })).not.toBeInTheDocument();

    const abrir = screen.getByRole("button", { name: "Abrir menú" });
    expect(abrir).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(abrir);

    const menu = screen.getByRole("navigation", { name: "Menú" });
    expect(within(menu).getByRole("link", { name: "Panel" })).toBeInTheDocument();
    expect(abrir).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(screen.getByRole("button", { name: "Cerrar menú" }));
    expect(screen.queryByRole("navigation", { name: "Menú" })).not.toBeInTheDocument();
    expect(abrir).toHaveAttribute("aria-expanded", "false");
  });

  it("al navegar desde el menú de mobile lo cierra", async () => {
    guardarToken(tokenDePrueba(["COMUN"]));
    renderApp();
    await screen.findByRole("list", { name: "Flota" });

    await userEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    await userEvent.click(within(screen.getByRole("navigation", { name: "Menú" })).getByRole("link", { name: "Solicitudes" }));

    await waitFor(() =>
      expect(screen.queryByRole("navigation", { name: "Menú" })).not.toBeInTheDocument(),
    );
  });

  it("cerrar sesión desde mobile borra el token y vuelve al login", async () => {
    guardarToken(tokenDePrueba(["COMUN"]));
    const history = renderApp();
    await screen.findByRole("list", { name: "Flota" });

    await userEvent.click(screen.getByRole("button", { name: "Abrir menú" }));
    await userEvent.click(within(screen.getByRole("navigation", { name: "Menú" })).getByRole("button", { name: "Cerrar sesión" }));

    await waitFor(() => expect(history.location.pathname).toBe("/login"));
    expect(obtenerToken()).toBeNull();
    expect(await screen.findByRole("heading", { name: "Ingresar a CentralBV" })).toBeInTheDocument();
  });

  it("cerrar sesión desde el riel también vuelve al login", async () => {
    guardarToken(tokenDePrueba(["ADMIN"]));
    const history = renderApp();
    await screen.findByRole("list", { name: "Flota" });

    await userEvent.click(within(riel()).getByRole("button", { name: "Cerrar sesión" }));

    await waitFor(() => expect(history.location.pathname).toBe("/login"));
    expect(obtenerToken()).toBeNull();
  });

  it("marca el destino activo en el riel", async () => {
    guardarToken(tokenDePrueba(["COMUN"]));
    renderApp("/dashboard");
    await screen.findByRole("list", { name: "Flota" });

    const panel = within(riel()).getByRole("link", { name: "Panel" });
    expect(panel.className).toContain("text-accent-text");
    expect(within(riel()).getByRole("link", { name: "Móviles" }).className).not.toContain("text-accent-text");
  });
});
