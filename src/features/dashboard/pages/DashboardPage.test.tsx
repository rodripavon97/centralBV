import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearRouter } from "@/app/router";
import { guardarToken } from "@/features/auth/session";
import { listarFlota, listarTipos, obtenerResumenFlota } from "@/features/moviles/api/flotaApi";
import type { MovilFlota } from "@/features/moviles/domain/movil";
import { tokenDePrueba } from "@/test/token";

vi.mock("@/features/moviles/api/flotaApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/moviles/api/flotaApi")>();
  return { ...actual, listarFlota: vi.fn(), listarTipos: vi.fn(), obtenerResumenFlota: vi.fn() };
});

const TIPO = "11111111-1111-4111-8111-111111111111";

const movil = (n: number, estado: MovilFlota["estado"] = "operativo"): MovilFlota => ({
  id: String(n),
  codigo: `M-${n}`,
  patente: "AB123CD",
  tipo: "Autobomba",
  marca: "Iveco",
  modelo: "Tector",
  estado,
});

function renderApp(path = "/dashboard") {
  const history = createMemoryHistory({ initialEntries: [path] });
  render(<RouterProvider router={crearRouter(history)} />);
  return history;
}

beforeEach(() => {
  window.localStorage.clear();
  vi.mocked(listarTipos).mockResolvedValue([{ id: TIPO, nombre: "Autobomba", enUso: 2 }]);
  vi.mocked(obtenerResumenFlota).mockResolvedValue({
    total: 2,
    porEstado: { operativo: 1, observaciones: 0, fuera_de_servicio: 1, mantenimiento: 0 },
  });
});

describe("DashboardPage (US05)", () => {
  it("muestra los contadores y las tarjetas con estado, tipo y patente", async () => {
    guardarToken(tokenDePrueba(["COMUN"]));
    vi.mocked(listarFlota).mockResolvedValue([movil(1), movil(2, "fuera_de_servicio")]);
    renderApp();

    const flota = await screen.findByRole("list", { name: "Flota" });
    const tarjeta = within(flota).getByRole("heading", { name: "M-2" }).closest("li")!;
    expect(within(tarjeta).getByText("Fuera de servicio")).toBeInTheDocument();
    expect(within(tarjeta).getByText("Autobomba")).toBeInTheDocument();
    expect(within(tarjeta).getByText("AB 123 CD")).toBeInTheDocument();

    const resumen = screen.getByRole("list", { name: "Resumen de la flota" });
    const fuera = within(resumen).getByText("Fuera de servicio").closest("li")!;
    expect(within(fuera).getByText("1")).toBeInTheDocument();
    expect(screen.getByText(/Estado de la flota · actualizado \d\d:\d\d/)).toBeInTheDocument();
  });

  it("filtra por estado y tipo desde la URL", async () => {
    guardarToken(tokenDePrueba(["COMUN"]));
    vi.mocked(listarFlota).mockResolvedValue([movil(1)]);
    renderApp(`/dashboard?estado=operativo&tipo=${TIPO}`);

    await screen.findByRole("list", { name: "Flota" });
    expect(listarFlota).toHaveBeenLastCalledWith({ estado: "operativo", tipoId: TIPO });
    expect(screen.getByLabelText("Filtrar por estado")).toHaveValue("operativo");
    expect(screen.getByLabelText("Filtrar por tipo de vehículo")).toHaveValue(TIPO);
  });

  it("al elegir un estado vuelve a pedir la flota y lo guarda en la URL", async () => {
    guardarToken(tokenDePrueba(["COMUN"]));
    vi.mocked(listarFlota).mockResolvedValue([movil(1)]);
    const history = renderApp();
    await screen.findByRole("list", { name: "Flota" });

    await userEvent.selectOptions(screen.getByLabelText("Filtrar por estado"), "mantenimiento");

    expect(listarFlota).toHaveBeenLastCalledWith({ estado: "mantenimiento", tipoId: undefined });
    expect(history.location.search).toContain("estado=mantenimiento");
  });

  it("pagina de a 6 en mobile, en orden natural", async () => {
    guardarToken(tokenDePrueba(["COMUN"]));
    vi.mocked(listarFlota).mockResolvedValue(Array.from({ length: 8 }, (_, i) => movil(i + 1)));
    renderApp();

    const flota = await screen.findByRole("list", { name: "Flota" });
    expect(within(flota).getAllByRole("heading").map((h) => h.textContent)).toEqual(["M-1", "M-2", "M-3", "M-4", "M-5", "M-6"]);
    expect(screen.getByText("1–6 de 8")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getByText("7–8 de 8")).toBeInTheDocument();
    expect(listarFlota).toHaveBeenCalledTimes(1); // la página no vuelve a pedir la flota
  });

  it("sin coincidencias ofrece limpiar los filtros", async () => {
    guardarToken(tokenDePrueba(["COMUN"]));
    vi.mocked(listarFlota).mockResolvedValue([]);
    renderApp("/dashboard?estado=mantenimiento");

    expect(await screen.findByRole("heading", { name: "Ningún móvil coincide con los filtros" })).toBeInTheDocument();
    vi.mocked(listarFlota).mockResolvedValue([movil(1)]);
    await userEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(await screen.findByRole("list", { name: "Flota" })).toBeInTheDocument();
  });

  it("sin móviles, automotores ve el acceso al alta", async () => {
    guardarToken(tokenDePrueba(["AUTOMOTORES"]));
    vi.mocked(obtenerResumenFlota).mockResolvedValue({
      total: 0,
      porEstado: { operativo: 0, observaciones: 0, fuera_de_servicio: 0, mantenimiento: 0 },
    });
    vi.mocked(listarFlota).mockResolvedValue([]);
    renderApp();

    expect(await screen.findByRole("heading", { name: "Todavía no hay móviles" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Agregar móvil/ })).toHaveAttribute("href", "/moviles/nuevo");
  });

  it("sin móviles, el resto no ve la acción de alta", async () => {
    guardarToken(tokenDePrueba(["COMUN"]));
    vi.mocked(obtenerResumenFlota).mockResolvedValue({
      total: 0,
      porEstado: { operativo: 0, observaciones: 0, fuera_de_servicio: 0, mantenimiento: 0 },
    });
    vi.mocked(listarFlota).mockResolvedValue([]);
    renderApp();

    expect(await screen.findByRole("heading", { name: "Todavía no hay móviles" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Agregar móvil/ })).not.toBeInTheDocument();
  });

  it("si falla la carga permite reintentar", async () => {
    guardarToken(tokenDePrueba(["COMUN"]));
    vi.mocked(listarFlota).mockRejectedValueOnce(new Error("sin red")).mockResolvedValue([movil(1)]);
    renderApp();

    await userEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("list", { name: "Flota" })).toBeInTheDocument();
  });
});
