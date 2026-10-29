import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearRouter } from "@/app/router";
import { guardarToken } from "@/features/auth/session";
import { ErrorApi } from "@/lib/http";
import { tokenDePrueba } from "@/test/token";
import {
  crearItem,
  crearMovil,
  eliminarItem,
  listarMarcas,
  listarModelos,
  listarMoviles,
  listarTipos,
} from "../api/flotaApi";

vi.mock("../api/flotaApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/flotaApi")>();
  return {
    ...actual,
    listarTipos: vi.fn(),
    listarMarcas: vi.fn(),
    listarModelos: vi.fn(),
    listarMoviles: vi.fn(),
    crearMovil: vi.fn(),
    crearItem: vi.fn(),
    crearModelo: vi.fn(),
    renombrarItem: vi.fn(),
    eliminarItem: vi.fn(),
  };
});

const tipos = [
  { id: "t1", nombre: "Autobomba", enUso: 3 },
  { id: "t2", nombre: "Rescate", enUso: 2 },
];
const marcas = [
  { id: "m1", nombre: "Mercedes-Benz", enUso: 2 },
  { id: "m2", nombre: "Ford", enUso: 1 },
];
const modelos = [
  { id: "mo1", nombre: "Atego 1726", marcaId: "m1", enUso: 2 },
  { id: "mo2", nombre: "F-350", marcaId: "m2", enUso: 1 },
];

const movilCreado = {
  id: "44444444-4444-4444-8444-444444444444",
  codigo: "M-4",
  patente: "AJ567ST",
  tipo: "Autobomba",
  marca: "Mercedes-Benz",
  modelo: "Atego 1726",
  estado: "operativo" as const,
};

function renderApp(path: string) {
  const router = crearRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<RouterProvider router={router} />);
  return router;
}

async function elegir(user: ReturnType<typeof userEvent.setup>, campo: string, opcion: string) {
  await user.click(screen.getByRole("combobox", { name: campo }));
  await user.click(await screen.findByRole("option", { name: opcion }));
}

async function completar(user: ReturnType<typeof userEvent.setup>, patente = "aj 567 st") {
  await user.type(screen.getByLabelText(/^Número \/ denominación/), "m4");
  await user.type(screen.getByLabelText(/^Patente/), patente);
  await elegir(user, "Tipo", "Autobomba");
  await elegir(user, "Marca", "Mercedes-Benz");
  await elegir(user, "Modelo", "Atego 1726");
}

beforeEach(() => {
  window.localStorage.clear();
  vi.mocked(listarTipos).mockResolvedValue(tipos);
  vi.mocked(listarMarcas).mockResolvedValue(marcas);
  vi.mocked(listarModelos).mockResolvedValue(modelos);
  vi.mocked(listarMoviles).mockResolvedValue({ items: [movilCreado], total: 1 });
});

describe("AgregarMovilPage (US04)", () => {
  it("un usuario sin AUTOMOTORES vuelve a la lista y no ve el botón de alta", async () => {
    guardarToken(tokenDePrueba(["COMUN"]));
    renderApp("/moviles/nuevo");
    expect(await screen.findByRole("heading", { name: "Móviles" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Agregar móvil/ })).not.toBeInTheDocument();
  });

  it("ADMIN puede entrar al alta", async () => {
    guardarToken(tokenDePrueba(["ADMIN"]));
    renderApp("/moviles/nuevo");
    expect(await screen.findByRole("heading", { name: "Agregar móvil" })).toBeInTheDocument();
  });

  it("muestra los campos obligatorios con los textos de Figma y enfoca el primero", async () => {
    guardarToken(tokenDePrueba(["AUTOMOTORES"]));
    const user = userEvent.setup();
    renderApp("/moviles/nuevo");

    await user.click(await screen.findByRole("button", { name: "Guardar móvil" }));

    expect(screen.getAllByText("Este campo es obligatorio")).toHaveLength(2);
    expect(screen.getByText("Seleccioná un tipo")).toBeInTheDocument();
    expect(screen.getByText("Seleccioná una marca")).toBeInTheDocument();
    expect(screen.getByText("Seleccioná o agregá un modelo", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Número \/ denominación/)).toHaveFocus();
    expect(crearMovil).not.toHaveBeenCalled();
  });

  it("muestra el estado inicial Operativo, que no se puede elegir", async () => {
    guardarToken(tokenDePrueba(["AUTOMOTORES"]));
    renderApp("/moviles/nuevo");
    expect(await screen.findByText("Disponible · se asigna automáticamente")).toBeInTheDocument();
    expect(screen.getByText("Operativo")).toBeInTheDocument();
  });

  it("el modelo se habilita al elegir la marca y se limpia al cambiarla", async () => {
    guardarToken(tokenDePrueba(["AUTOMOTORES"]));
    const user = userEvent.setup();
    renderApp("/moviles/nuevo");

    const modelo = await screen.findByRole("combobox", { name: "Modelo" });
    expect(modelo).toBeDisabled();

    await elegir(user, "Marca", "Mercedes-Benz");
    expect(modelo).toBeEnabled();
    await user.click(modelo);
    const lista = screen.getByRole("listbox");
    expect(within(lista).getAllByRole("option").map((o) => o.textContent)).toEqual(["Atego 1726"]);
    await user.click(within(lista).getByRole("option", { name: "Atego 1726" }));
    expect(modelo).toHaveTextContent("Atego 1726");

    await elegir(user, "Marca", "Ford");
    expect(modelo).toHaveTextContent("Seleccioná o agregá un modelo");
  });

  it("normaliza denominación y patente al salir del campo", async () => {
    guardarToken(tokenDePrueba(["AUTOMOTORES"]));
    const user = userEvent.setup();
    renderApp("/moviles/nuevo");

    await user.type(await screen.findByLabelText(/^Número \/ denominación/), "m 4");
    await user.type(screen.getByLabelText(/^Patente/), "aj567st");
    await user.tab();

    expect(screen.getByLabelText(/^Número \/ denominación/)).toHaveValue("M-4");
    expect(screen.getByLabelText(/^Patente/)).toHaveValue("AJ 567 ST");
  });

  it("guarda y vuelve a la lista con el aviso de Figma", async () => {
    guardarToken(tokenDePrueba(["AUTOMOTORES"]));
    vi.mocked(crearMovil).mockResolvedValue(movilCreado);
    const user = userEvent.setup();
    renderApp("/moviles/nuevo");

    await screen.findByRole("heading", { name: "Agregar móvil" });
    await completar(user);
    await user.click(screen.getByRole("button", { name: "Guardar móvil" }));

    expect(crearMovil).toHaveBeenCalledWith(
      { denominacion: "M-4", patente: "AJ 567 ST", tipoId: "t1", marcaId: "m1", modeloId: "mo1" },
      { confirmarPatenteEspecial: false },
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Móvil M-4 creado con estado Operativo.");
    expect(screen.getByRole("heading", { name: "Móviles" })).toBeInTheDocument();
  });

  it("muestra debajo de Patente el duplicado que informa el back", async () => {
    guardarToken(tokenDePrueba(["AUTOMOTORES"]));
    vi.mocked(crearMovil).mockRejectedValue(
      new ErrorApi(409, "Ya existe un móvil con esa patente", { campo: "patente", codigo: "PATENTE_DUPLICADA" }),
    );
    const user = userEvent.setup();
    renderApp("/moviles/nuevo");

    await screen.findByRole("heading", { name: "Agregar móvil" });
    await completar(user);
    await user.click(screen.getByRole("button", { name: "Guardar móvil" }));

    const patente = screen.getByLabelText(/^Patente/);
    expect(await screen.findByText("Ya existe un móvil con esa patente")).toBeInTheDocument();
    expect(patente).toHaveAttribute("aria-invalid", "true");
    expect(patente).toHaveFocus();

    // Al corregir el campo, el error se va.
    await user.type(patente, "X");
    expect(screen.queryByText("Ya existe un móvil con esa patente")).not.toBeInTheDocument();
  });

  it("pide confirmación para una patente especial y la manda confirmada", async () => {
    guardarToken(tokenDePrueba(["AUTOMOTORES"]));
    vi.mocked(crearMovil).mockResolvedValue({ ...movilCreado, patente: "BV01" });
    const user = userEvent.setup();
    renderApp("/moviles/nuevo");

    await screen.findByRole("heading", { name: "Agregar móvil" });
    await completar(user, "bv-01");
    await user.click(screen.getByRole("button", { name: "Guardar móvil" }));

    const dialogo = await screen.findByRole("dialog", { name: "Patente con formato especial" });
    expect(within(dialogo).getByText("BV01")).toBeInTheDocument();
    expect(crearMovil).not.toHaveBeenCalled();

    await user.click(within(dialogo).getByRole("button", { name: "Guardar igual" }));
    expect(crearMovil).toHaveBeenCalledWith(expect.objectContaining({ patente: "BV01" }), {
      confirmarPatenteEspecial: true,
    });
  });

  it("Revisar cierra la confirmación y vuelve a la patente", async () => {
    guardarToken(tokenDePrueba(["AUTOMOTORES"]));
    const user = userEvent.setup();
    renderApp("/moviles/nuevo");

    await screen.findByRole("heading", { name: "Agregar móvil" });
    await completar(user, "bv01");
    await user.click(screen.getByRole("button", { name: "Guardar móvil" }));
    await user.click(await screen.findByRole("button", { name: "Revisar" }));

    await waitFor(() => expect(screen.getByLabelText(/^Patente/)).toHaveFocus());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(crearMovil).not.toHaveBeenCalled();
  });

  it("agrega una marca nueva desde el selector y la deja elegida", async () => {
    guardarToken(tokenDePrueba(["AUTOMOTORES"]));
    vi.mocked(crearItem).mockResolvedValue({ id: "m3", nombre: "Scania", enUso: 0 });
    const user = userEvent.setup();
    renderApp("/moviles/nuevo");

    await user.click(await screen.findByRole("combobox", { name: "Marca" }));
    await user.click(screen.getByRole("button", { name: "Agregar marca nueva" }));

    const dialogo = await screen.findByRole("dialog", { name: "Agregar marca nueva" });
    vi.mocked(listarMarcas).mockResolvedValue([...marcas, { id: "m3", nombre: "Scania", enUso: 0 }]);
    await user.type(within(dialogo).getByLabelText(/^Nombre de la marca/), "Scania");
    await user.click(within(dialogo).getByRole("button", { name: "Guardar" }));

    expect(crearItem).toHaveBeenCalledWith("marcas", "Scania");
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Marca" })).toHaveTextContent("Scania"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Gestionar marcas muestra por qué no se puede eliminar una marca en uso", async () => {
    guardarToken(tokenDePrueba(["AUTOMOTORES"]));
    vi.mocked(eliminarItem).mockRejectedValue(
      new ErrorApi(409, "No se puede eliminar Ford: la usa 1 móvil (M-3)."),
    );
    const user = userEvent.setup();
    renderApp("/moviles/nuevo");

    await user.click(await screen.findByRole("combobox", { name: "Marca" }));
    await user.click(screen.getByRole("button", { name: "Gestionar marcas" }));

    const dialogo = await screen.findByRole("dialog", { name: "Gestionar marcas" });
    expect(within(dialogo).getByText("2 móviles")).toBeInTheDocument();
    await user.click(within(dialogo).getByRole("button", { name: "Eliminar Ford" }));

    expect(eliminarItem).toHaveBeenCalledWith("marcas", "m2");
    expect(await within(dialogo).findByText("No se puede eliminar Ford: la usa 1 móvil (M-3).")).toBeInTheDocument();
  });

  it("un ítem sin móviles pide confirmación antes de eliminarse", async () => {
    guardarToken(tokenDePrueba(["AUTOMOTORES"]));
    vi.mocked(listarMarcas).mockResolvedValue([...marcas, { id: "m9", nombre: "Volkswagen", enUso: 0 }]);
    vi.mocked(eliminarItem).mockResolvedValue();
    const user = userEvent.setup();
    renderApp("/moviles/nuevo");

    await user.click(await screen.findByRole("combobox", { name: "Marca" }));
    await user.click(screen.getByRole("button", { name: "Gestionar marcas" }));
    const dialogo = await screen.findByRole("dialog", { name: "Gestionar marcas" });

    await user.click(within(dialogo).getByRole("button", { name: "Eliminar Volkswagen" }));
    expect(eliminarItem).not.toHaveBeenCalled();
    await act(async () => {
      await user.click(within(dialogo).getByRole("button", { name: "Eliminar" }));
    });
    expect(eliminarItem).toHaveBeenCalledWith("marcas", "m9");
  });

  it("el selector se maneja con teclado", async () => {
    guardarToken(tokenDePrueba(["AUTOMOTORES"]));
    const user = userEvent.setup();
    renderApp("/moviles/nuevo");

    const tipo = await screen.findByRole("combobox", { name: "Tipo" });
    tipo.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("listbox")).toHaveFocus();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(tipo).toHaveTextContent("Rescate");
    expect(tipo).toHaveFocus();
  });
});
