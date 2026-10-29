import { render, screen, within } from "@testing-library/react";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearRouter } from "@/app/router";
import { guardarToken } from "@/features/auth/session";
import { tokenDePrueba } from "@/test/token";
import { listarMoviles } from "../api/flotaApi";

vi.mock("../api/flotaApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/flotaApi")>();
  return { ...actual, listarMoviles: vi.fn() };
});

function renderApp(path: string) {
  render(<RouterProvider router={crearRouter(createMemoryHistory({ initialEntries: [path] }))} />);
}

beforeEach(() => window.localStorage.clear());

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
