import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearRouter } from "@/app/router";
import { guardarToken } from "@/features/auth/session";
import { tokenDePrueba } from "@/test/token";
import {
  actualizarMovil,
  listarMarcas,
  listarModelos,
  listarMoviles,
  listarTipos,
  obtenerMovil,
} from "../api/flotaApi";
import type { MovilFlota } from "../domain/movil";

vi.mock("../api/flotaApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/flotaApi")>();
  return {
    ...actual,
    obtenerMovil: vi.fn(),
    actualizarMovil: vi.fn(),
    listarMoviles: vi.fn(),
    listarTipos: vi.fn(),
    listarMarcas: vi.fn(),
    listarModelos: vi.fn(),
  };
});

const ID = "44444444-4444-4444-8444-444444444444";

const r01: MovilFlota = {
  id: ID,
  codigo: "R-01",
  patente: "AE012IJ",
  tipo: "Rescate",
  marca: "Ford",
  modelo: "F-350",
  tipoId: "t2",
  marcaId: "m2",
  modeloId: "mo2",
  estado: "observaciones",
};

function renderApp(path = `/moviles/${ID}/editar`) {
  const history = createMemoryHistory({ initialEntries: [path] });
  render(<RouterProvider router={crearRouter(history)} />);
  return history;
}

beforeEach(() => {
  window.localStorage.clear();
  guardarToken(tokenDePrueba(["AUTOMOTORES"]));
  vi.mocked(listarMoviles).mockResolvedValue({ items: [r01], total: 1 });
  vi.mocked(listarTipos).mockResolvedValue([
    { id: "t1", nombre: "Autobomba", enUso: 1 },
    { id: "t2", nombre: "Rescate", enUso: 1 },
  ]);
  vi.mocked(listarMarcas).mockResolvedValue([
    { id: "m1", nombre: "Mercedes-Benz", enUso: 1 },
    { id: "m2", nombre: "Ford", enUso: 1 },
  ]);
  vi.mocked(listarModelos).mockResolvedValue([
    { id: "mo1", nombre: "Atego 1726", marcaId: "m1", enUso: 1 },
    { id: "mo2", nombre: "F-350", marcaId: "m2", enUso: 1 },
  ]);
  vi.mocked(obtenerMovil).mockResolvedValue(r01);
});

describe("EditarMovilPage (US48)", () => {
  it("sin AUTOMOTORES redirige a la lista", async () => {
    guardarToken(tokenDePrueba(["COMUN"]));
    renderApp();
    expect(await screen.findByRole("heading", { name: "Móviles" })).toBeInTheDocument();
  });

  it("precarga los datos y muestra el estado actual", async () => {
    renderApp();

    expect(await screen.findByRole("heading", { name: "Editar móvil" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Número \/ denominación/)).toHaveValue("R-01");
    expect(screen.getByLabelText(/^Patente/)).toHaveValue("AE012IJ");
    expect(screen.getByRole("combobox", { name: "Tipo" })).toHaveTextContent("Rescate");
    expect(screen.getByRole("combobox", { name: "Marca" })).toHaveTextContent("Ford");
    expect(screen.getByRole("combobox", { name: "Modelo" })).toHaveTextContent("F-350");
    expect(screen.getByText("Estado actual")).toBeInTheDocument();
    expect(screen.getByText("Con observaciones")).toBeInTheDocument();
  });

  it("un móvil dado de baja no se edita", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue({ ...r01, estado: "baja_definitiva" });
    renderApp();

    expect(await screen.findByRole("heading", { name: "Este móvil no se puede editar" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver ficha" })).toHaveAttribute("href", `/moviles/${ID}`);
  });

  it("guarda y vuelve a la ficha con aviso de cambios", async () => {
    vi.mocked(actualizarMovil).mockResolvedValue({ ...r01, codigo: "R-02" });
    const history = renderApp();

    await screen.findByRole("heading", { name: "Editar móvil" });
    const denominacion = screen.getByLabelText(/^Número \/ denominación/);
    await userEvent.clear(denominacion);
    await userEvent.type(denominacion, "R-02");
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(actualizarMovil).toHaveBeenCalledWith(
      ID,
      expect.objectContaining({ denominacion: "R-02", tipoId: "t2", marcaId: "m2", modeloId: "mo2" }),
      expect.any(Object),
    );
    expect(history.location.pathname).toBe(`/moviles/${ID}`);
    expect(history.location.state).toMatchObject({ movilEditado: true });
    expect(await screen.findByText("Cambios guardados.")).toBeInTheDocument();
  });

  it("Cancelar vuelve a la ficha sin guardar", async () => {
    const history = renderApp();
    await screen.findByRole("heading", { name: "Editar móvil" });
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(actualizarMovil).not.toHaveBeenCalled();
    expect(history.location.pathname).toBe(`/moviles/${ID}`);
  });
});
