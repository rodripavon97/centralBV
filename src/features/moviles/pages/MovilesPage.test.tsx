import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearRouter } from "@/app/router";
import { guardarToken } from "@/features/auth/session";
import { tokenDePrueba } from "@/test/token";
import type { MovilFlota } from "../domain/movil";
import { listarMoviles, obtenerMovil } from "../api/flotaApi";
import { DEMORA_BUSQUEDA_MS } from "../components/BuscadorMoviles";

vi.mock("../api/flotaApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/flotaApi")>();
  return { ...actual, listarMoviles: vi.fn(), obtenerMovil: vi.fn() };
});

function renderApp(path: string) {
  const history = createMemoryHistory({ initialEntries: [path] });
  render(<RouterProvider router={crearRouter(history)} />);
  return history;
}

const movil = (codigo: string, extra: Partial<MovilFlota> = {}): MovilFlota => ({
  id: `id-${codigo}`,
  codigo,
  patente: "AE012IJ",
  tipo: "Rescate",
  marca: "Ford",
  modelo: "F-350",
  estado: "operativo",
  ...extra,
});

beforeEach(() => window.localStorage.clear());
afterEach(() => vi.useRealTimers());

describe("MovilesPage", () => {
  it("lista los móviles con la patente agrupada", async () => {
    guardarToken(tokenDePrueba(["AUTOMOTORES"]));
    vi.mocked(listarMoviles).mockResolvedValue({
      items: [
        {
          id: "1",
          codigo: "M-1",
          patente: "AB123CD",
          tipo: "Autobomba",
          marca: "Mercedes-Benz",
          modelo: "Atego 1726",
          estado: "operativo",
        },
      ],
      total: 1,
    });
    renderApp("/moviles");

    const fila = (await screen.findByRole("rowheader", { name: "M-1" })).closest("tr")!;
    expect(within(fila).getByText("AB 123 CD")).toBeInTheDocument();
    expect(within(fila).getByText("Mercedes-Benz Atego 1726")).toBeInTheDocument();
    expect(within(fila).getByText("Operativo")).toBeInTheDocument();
    expect(screen.getByText("1 móvil")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Agregar móvil/ })).toBeInTheDocument();
  });

  it("sin móviles invita a registrar el primero", async () => {
    guardarToken(tokenDePrueba(["AUTOMOTORES"]));
    vi.mocked(listarMoviles).mockResolvedValue({ items: [], total: 0 });
    renderApp("/moviles");
    expect(await screen.findByRole("heading", { name: "Todavía no hay móviles" })).toBeInTheDocument();
  });

  it("Móviles aparece habilitado en el riel", async () => {
    guardarToken(tokenDePrueba(["COMUN"]));
    vi.mocked(listarMoviles).mockResolvedValue({ items: [], total: 0 });
    renderApp("/moviles");
    const nav = await screen.findByRole("navigation", { name: "Navegación principal" });
    expect(within(nav).getByRole("link", { name: "Móviles" })).toHaveAttribute("href", "/moviles");
  });

  it("en mobile la navegación se abre con el botón de menú y se cierra al elegir un destino", async () => {
    guardarToken(tokenDePrueba(["COMUN"]));
    vi.mocked(listarMoviles).mockResolvedValue({ items: [], total: 0 });
    renderApp("/moviles");

    const abrir = await screen.findByRole("button", { name: "Abrir menú" });
    expect(screen.queryByRole("navigation", { name: "Menú" })).not.toBeInTheDocument();
    await userEvent.click(abrir);

    const menu = screen.getByRole("navigation", { name: "Menú" });
    expect(within(menu).getByRole("link", { name: "Móviles" })).toHaveAttribute("href", "/moviles");
    expect(within(menu).getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument();
    expect(within(menu).queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument(); // solo ADMIN

    await userEvent.click(within(menu).getByRole("link", { name: "Móviles" }));
    expect(screen.queryByRole("navigation", { name: "Menú" })).not.toBeInTheDocument();
  });

  it("muestra los móviles en orden natural aunque el back los mande en orden de texto", async () => {
    guardarToken(tokenDePrueba(["AUTOMOTORES"]));
    const movil = (codigo: string) => ({
      id: codigo,
      codigo,
      patente: "AB123CD",
      tipo: "Autobomba",
      marca: "Ford",
      modelo: "F-350",
      estado: "operativo" as const,
    });
    vi.mocked(listarMoviles).mockResolvedValue({ items: ["M-1", "M-17", "M-2", "M-3"].map(movil), total: 4 });
    renderApp("/moviles");

    await screen.findByRole("rowheader", { name: "M-1" });
    expect(screen.getAllByRole("rowheader").map((c) => c.textContent)).toEqual(["M-1", "M-2", "M-3", "M-17"]);
  });
});

describe("MovilesPage · búsqueda (US06)", () => {
  it("escribir busca con una pequeña demora y deja ?q= en la URL", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    guardarToken(tokenDePrueba(["COMUN"]));
    vi.mocked(listarMoviles).mockResolvedValue({ items: [movil("R-01")], total: 1 });
    const history = renderApp("/moviles");
    const buscador = await screen.findByRole("searchbox", { name: /Buscar móviles/ });

    fireEvent.change(buscador, { target: { value: "AE 012" } });
    expect(listarMoviles).toHaveBeenCalledTimes(1); // todavía no busca
    await act(() => vi.advanceTimersByTimeAsync(DEMORA_BUSQUEDA_MS));

    expect(listarMoviles).toHaveBeenLastCalledWith({ busqueda: "AE 012" });
    expect(history.location.search).toContain("q=AE+012");
    expect(await screen.findByText("1 resultado")).toBeInTheDocument();
  });

  it("abre con la búsqueda de la URL", async () => {
    guardarToken(tokenDePrueba(["COMUN"]));
    vi.mocked(listarMoviles).mockResolvedValue({ items: [movil("M-1")], total: 1 });
    renderApp("/moviles?q=m1");

    expect(await screen.findByRole("searchbox", { name: /Buscar móviles/ })).toHaveValue("m1");
    expect(listarMoviles).toHaveBeenLastCalledWith({ busqueda: "m1" });
  });

  it("sin resultados muestra Móvil no encontrado y permite limpiar la búsqueda", async () => {
    guardarToken(tokenDePrueba(["COMUN"]));
    vi.mocked(listarMoviles).mockResolvedValue({ items: [], total: 0 });
    renderApp("/moviles?q=ZZ999");

    expect(await screen.findByRole("heading", { name: "Móvil no encontrado" })).toBeInTheDocument();
    expect(screen.getByText("No hay ningún móvil con ese número interno o patente.")).toBeInTheDocument();

    vi.mocked(listarMoviles).mockResolvedValue({ items: [movil("M-1")], total: 1 });
    await userEvent.click(screen.getByRole("button", { name: "Limpiar búsqueda" }));
    expect(await screen.findByRole("rowheader", { name: "M-1" })).toBeInTheDocument();
    expect(listarMoviles).toHaveBeenLastCalledWith({ busqueda: "" });
  });

  it("si falla permite reintentar", async () => {
    guardarToken(tokenDePrueba(["COMUN"]));
    vi.mocked(listarMoviles).mockRejectedValueOnce(new Error("sin red")).mockResolvedValue({ items: [movil("M-1")], total: 1 });
    renderApp("/moviles");

    await userEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("rowheader", { name: "M-1" })).toBeInTheDocument();
  });

  it("cada fila es un link a la ficha y Enter la abre", async () => {
    guardarToken(tokenDePrueba(["COMUN"]));
    vi.mocked(listarMoviles).mockResolvedValue({ items: [movil("R-01")], total: 1 });
    vi.mocked(obtenerMovil).mockResolvedValue(movil("R-01"));
    const history = renderApp("/moviles?q=r");

    const link = await screen.findByRole("link", { name: "R-01" });
    expect(link).toHaveAttribute("href", "/moviles/id-R-01");
    link.focus();
    await userEvent.keyboard("{Enter}");
    expect(await screen.findByRole("tab", { name: "Datos generales" })).toBeInTheDocument();
    expect(history.location.pathname).toBe("/moviles/id-R-01");
  });

  it("pagina de a 20", async () => {
    guardarToken(tokenDePrueba(["COMUN"]));
    vi.mocked(listarMoviles).mockResolvedValue({
      items: Array.from({ length: 23 }, (_, i) => movil(`M-${i + 1}`)),
      total: 23,
    });
    renderApp("/moviles");

    await screen.findByRole("rowheader", { name: "M-1" });
    expect(screen.getAllByRole("rowheader")).toHaveLength(20);
    expect(screen.getByText("1–20 de 23")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(screen.getAllByRole("rowheader").map((c) => c.textContent)).toEqual(["M-21", "M-22", "M-23"]);
  });
});
