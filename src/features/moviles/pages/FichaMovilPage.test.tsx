import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearRouter } from "@/app/router";
import { guardarToken } from "@/features/auth/session";
import { ErrorApi } from "@/lib/http";
import { tokenDePrueba } from "@/test/token";
import { listarMoviles, obtenerMovil } from "../api/flotaApi";
import type { MovilFlota } from "../domain/movil";

vi.mock("../api/flotaApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/flotaApi")>();
  return { ...actual, obtenerMovil: vi.fn(), listarMoviles: vi.fn() };
});

const ID = "44444444-4444-4444-8444-444444444444";

// Como en Figma: R-01 · Rescate · Ford F-350 · AE 012 IJ.
const r01: MovilFlota = {
  id: ID,
  codigo: "R-01",
  patente: "AE012IJ",
  tipo: "Rescate",
  marca: "Ford",
  modelo: "F-350",
  estado: "observaciones",
};

function renderApp(path = `/moviles/${ID}`) {
  const history = createMemoryHistory({ initialEntries: [path] });
  render(<RouterProvider router={crearRouter(history)} />);
  return history;
}

beforeEach(() => {
  window.localStorage.clear();
  guardarToken(tokenDePrueba(["COMUN"]));
});

describe("FichaMovilPage (US06)", () => {
  it("muestra el título, el estado, el subtítulo y los datos del móvil", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    renderApp();

    expect(await screen.findByRole("heading", { level: 1, name: "R-01" })).toBeInTheDocument();
    expect(screen.getByText("Con observaciones")).toBeInTheDocument();
    expect(screen.getByText("Rescate · Ford F-350 · AE 012 IJ")).toBeInTheDocument();
    expect(obtenerMovil).toHaveBeenCalledWith(ID);

    const datos = screen.getByRole("heading", { name: "Datos del móvil" }).closest("section")!;
    expect(within(datos).getByText("N.º interno").nextSibling).toHaveTextContent("R-01");
    expect(within(datos).getByText("Patente").nextSibling).toHaveTextContent("AE 012 IJ");
    expect(within(datos).getByText("Modelo").nextSibling).toHaveTextContent("F-350");
    expect(screen.getByRole("heading", { name: "Mantenimiento y documentación" })).toBeInTheDocument();
  });

  it("tiene las tres pestañas de Figma y Datos generales es la activa", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    renderApp();

    const pestanas = await screen.findAllByRole("tab");
    expect(pestanas.map((t) => t.textContent)).toEqual(["Datos generales", "Inventario", "Última revisión"]);
    expect(screen.getByRole("tab", { name: "Datos generales" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Datos generales" })).toBeInTheDocument();
  });

  it("al hacer clic cambia el panel y guarda la pestaña en la URL", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    const history = renderApp();
    await screen.findByRole("heading", { level: 1, name: "R-01" });

    await userEvent.click(screen.getByRole("tab", { name: "Inventario" }));
    expect(screen.getByRole("heading", { name: "Este móvil todavía no tiene buches" })).toBeInTheDocument();
    expect(history.location.search).toContain("pestana=inventario");

    await userEvent.click(screen.getByRole("tab", { name: "Última revisión" }));
    expect(screen.getByRole("heading", { name: "Todavía no hay revisiones" })).toBeInTheDocument();
    expect(history.location.search).toContain("pestana=revision");
  });

  it("las flechas recorren las pestañas y mueven el foco", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    renderApp();
    await screen.findByRole("heading", { level: 1, name: "R-01" });

    screen.getByRole("tab", { name: "Datos generales" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Inventario" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Inventario" })).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Última revisión" })).toHaveFocus();
  });

  it("abre en la pestaña de la URL", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    renderApp(`/moviles/${ID}?pestana=revision`);

    expect(await screen.findByRole("heading", { name: "Todavía no hay revisiones" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Última revisión" })).toHaveAttribute("aria-selected", "true");
  });

  it.each([404, 400])("con %i muestra Móvil no encontrado", async (status) => {
    vi.mocked(obtenerMovil).mockRejectedValue(new ErrorApi(status, "no"));
    renderApp();

    expect(await screen.findByRole("heading", { name: "Móvil no encontrado" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver todos los móviles" })).toHaveAttribute("href", "/moviles");
  });

  it("otro error permite reintentar", async () => {
    vi.mocked(obtenerMovil).mockRejectedValueOnce(new ErrorApi(500, "error")).mockResolvedValue(r01);
    renderApp();

    await userEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("heading", { level: 1, name: "R-01" })).toBeInTheDocument();
  });

  it("un móvil dado de baja abre con el badge Baja definitiva", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue({ ...r01, estado: "baja_definitiva" });
    renderApp();

    expect(await screen.findByText("Baja definitiva")).toBeInTheDocument();
  });

  it("← Móviles vuelve a la lista con la misma búsqueda", async () => {
    vi.mocked(listarMoviles).mockResolvedValue({ items: [r01], total: 1 });
    vi.mocked(obtenerMovil).mockResolvedValue(r01);
    const history = renderApp("/moviles?q=r-0");

    await userEvent.click(await screen.findByRole("link", { name: "R-01" }));
    await userEvent.click(await screen.findByRole("tab", { name: "Inventario" }));
    await userEvent.click(screen.getByRole("link", { name: "Volver a Móviles" }));

    expect(await screen.findByRole("searchbox", { name: /Buscar móviles/ })).toHaveValue("r-0");
    expect(history.location.pathname).toBe("/moviles");
    expect(history.location.search).toContain("q=r-0");
  });
});
