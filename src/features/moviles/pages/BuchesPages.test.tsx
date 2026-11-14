import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearRouter } from "@/app/router";
import { guardarToken } from "@/features/auth/session";
import { ErrorApi } from "@/lib/http";
import { tokenDePrueba } from "@/test/token";
import {
  cambiarEstadoBuche,
  crearBuche,
  editarBuche,
  eliminarBuche,
  generarBuches,
  listarBuches,
  listarRevisiones,
  obtenerMovil,
} from "../api/flotaApi";
import type { Buche } from "../domain/buches";
import type { MovilFlota } from "../domain/movil";

vi.mock("../api/flotaApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/flotaApi")>();
  return {
    ...actual,
    obtenerMovil: vi.fn(),
    listarRevisiones: vi.fn(),
    listarBuches: vi.fn(),
    generarBuches: vi.fn(),
    crearBuche: vi.fn(),
    editarBuche: vi.fn(),
    cambiarEstadoBuche: vi.fn(),
    eliminarBuche: vi.fn(),
  };
});

const ID = "44444444-4444-4444-8444-444444444444";
const B1 = "11111111-1111-4111-8111-111111111111";
const B2 = "22222222-2222-4222-8222-222222222222";
const B3 = "33333333-3333-4333-8333-333333333333";

const r01: MovilFlota = {
  id: ID,
  codigo: "R-01",
  patente: "AE012IJ",
  tipo: "Rescate",
  marca: "Ford",
  modelo: "F-350",
  tipoId: "t1",
  marcaId: "m1",
  modeloId: "mo1",
  estado: "operativo",
};

const buches: Buche[] = [
  { id: B1, nombre: "LC-1", zona: "lado_conductor", orden: 1, estado: "operativo" },
  { id: B2, nombre: "LC-2", zona: "lado_conductor", orden: 2, estado: "observaciones" },
  { id: B3, nombre: "TE-1", zona: "techo", orden: 1, estado: "fuera_de_uso" },
];

function renderApp(path: string) {
  const history = createMemoryHistory({ initialEntries: [path] });
  render(<RouterProvider router={crearRouter(history)} />);
  return history;
}

const comoRol = (...roles: string[]) => guardarToken(tokenDePrueba(roles));

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
  comoRol("AUTOMOTORES");
  vi.mocked(obtenerMovil).mockResolvedValue(r01);
  vi.mocked(listarBuches).mockResolvedValue(buches);
  vi.mocked(listarRevisiones).mockResolvedValue({ items: [], total: 0, pagina: 1, paginas: 1 });
});

describe("Inventario de la ficha", () => {
  const inventario = `/moviles/${ID}?pestana=inventario`;

  it("muestra el plano y el primer buche elegido con el aviso de materiales", async () => {
    renderApp(inventario);

    expect(await screen.findByRole("heading", { name: "LC-1" })).toBeInTheDocument();
    const plano = screen.getByRole("figure", { name: "Plano del móvil" });
    expect(within(plano).getByRole("button", { name: "LC-1, Lado conductor, Operativo" })).toHaveAttribute("aria-pressed", "true");
    expect(within(plano).getByRole("button", { name: "TE-1, Techo · escalas, Fuera de uso" })).toBeInTheDocument();
    expect(screen.getByText("Estamos trabajando en esto")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Generar / editar buches" })).toBeInTheDocument();
    expect(screen.queryByText(/Solo el encargado de automotores/)).not.toBeInTheDocument();
  });

  it("al tocar un buche lo elige y lo guarda en la URL", async () => {
    const history = renderApp(inventario);
    await userEvent.click(await screen.findByRole("button", { name: /^LC-2,/ }));

    expect(screen.getByRole("heading", { name: "LC-2" })).toBeInTheDocument();
    expect(history.location.search).toContain(`buche=${B2}`);
    expect(screen.getByRole("link", { name: "Editar buche" })).toHaveAttribute("href", expect.stringContaining(`buche=${B2}`));
  });

  it("elegir un buche no sube la página al tope", async () => {
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    renderApp(inventario);
    const lc2 = await screen.findByRole("button", { name: /^LC-2,/ });
    scroll.mockClear();
    await userEvent.click(lc2);
    await screen.findByRole("heading", { name: "LC-2" });
    expect(scroll).not.toHaveBeenCalled();
  });

  it("abre el buche de la URL", async () => {
    renderApp(`${inventario}&buche=${B3}`);
    expect(await screen.findByRole("heading", { name: "TE-1" })).toBeInTheDocument();
  });

  it("cualquier usuario cambia el estado de un buche", async () => {
    comoRol("COMUN");
    vi.mocked(cambiarEstadoBuche).mockResolvedValue({ ...buches[0], estado: "fuera_de_uso" });
    renderApp(inventario);
    await screen.findByRole("heading", { name: "LC-1" });

    expect(screen.getByText(/Solo el encargado de automotores puede configurar los buches/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Generar / editar buches" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generar / editar buches" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Editar buche" })).toBeDisabled();

    // El estado actual no hace nada.
    await userEvent.click(screen.getByRole("button", { name: "Operativo", pressed: true }));
    expect(cambiarEstadoBuche).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Fuera de uso", pressed: false }));
    expect(cambiarEstadoBuche).toHaveBeenCalledWith(ID, B1, "fuera_de_uso");
    expect(await screen.findByText("LC-1 quedó Fuera de uso.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "LC-1, Lado conductor, Fuera de uso" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Fuera de uso", pressed: true })).toBeInTheDocument();

    // Al elegir otro buche se va el aviso.
    await userEvent.click(screen.getByRole("button", { name: /^LC-2,/ }));
    expect(screen.queryByText("LC-1 quedó Fuera de uso.")).not.toBeInTheDocument();
  });

  it("tiene los 4 estados de Figma: en la leyenda y como botones, incluido Dañado", async () => {
    vi.mocked(cambiarEstadoBuche).mockResolvedValue({ ...buches[0], estado: "danado" });
    renderApp(inventario);
    const plano = await screen.findByRole("figure", { name: "Plano del móvil" });
    for (const estado of ["Operativo", "Con observaciones", "Dañado", "Fuera de uso"]) {
      expect(within(plano).getByText(estado)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: estado })).toBeInTheDocument();
    }
    await userEvent.click(screen.getByRole("button", { name: "Dañado" }));
    expect(cambiarEstadoBuche).toHaveBeenCalledWith(ID, B1, "danado");
    expect(await screen.findByText("LC-1 quedó Dañado.")).toBeInTheDocument();
    expect(within(plano).getByRole("button", { name: "LC-1, Lado conductor, Dañado" })).toBeInTheDocument();
  });

  it("avisa si no se pudo cambiar el estado", async () => {
    vi.mocked(cambiarEstadoBuche).mockRejectedValue(new ErrorApi(409, "El vehículo ya está dado de baja definitiva"));
    renderApp(inventario);
    await userEvent.click(await screen.findByRole("button", { name: "Con observaciones", pressed: false }));
    expect(await screen.findByRole("alert")).toHaveTextContent("El vehículo ya está dado de baja definitiva");
  });

  it("en un móvil dado de baja es de solo lectura", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue({ ...r01, estado: "baja_definitiva", motivoBaja: "Fin" });
    renderApp(inventario);
    await screen.findByRole("heading", { name: "LC-1" });

    expect(screen.getByRole("button", { name: "Fuera de uso", pressed: false })).toBeDisabled();
    expect(screen.queryByRole("link", { name: "Generar / editar buches" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Editar buche" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar buche" })).toBeDisabled();
  });

  it("sin buches ofrece generarlos solo a automotores", async () => {
    vi.mocked(listarBuches).mockResolvedValue([]);
    renderApp(inventario);
    expect(await screen.findByRole("link", { name: "Generar buches" })).toHaveAttribute("href", `/moviles/${ID}/buches/generar`);
  });

  it("sin buches y sin permiso solo lo cuenta", async () => {
    comoRol("COMUN");
    vi.mocked(listarBuches).mockResolvedValue([]);
    renderApp(inventario);
    expect(await screen.findByText(/Los buches los configura el encargado de automotores/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Generar buches" })).not.toBeInTheDocument();
  });

  it("si falla la carga permite reintentar", async () => {
    vi.mocked(listarBuches).mockRejectedValueOnce(new Error("caído"));
    renderApp(inventario);
    await userEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("heading", { name: "LC-1" })).toBeInTheDocument();
  });

  it("al volver de guardar muestra el aviso", async () => {
    const history = createMemoryHistory({ initialEntries: [inventario] });
    history.replace(inventario, { buchesGuardados: true, __TSR_index: 0 });
    render(<RouterProvider router={crearRouter(history)} />);
    expect(await screen.findByText("Cambios en los buches guardados.")).toBeInTheDocument();
  });
});

describe("Generar buches", () => {
  const generar = `/moviles/${ID}/buches/generar`;

  beforeEach(() => vi.mocked(listarBuches).mockResolvedValue([]));

  it("arranca con el ejemplo de Figma y arma la vista previa", async () => {
    renderApp(generar);

    expect(await screen.findByRole("heading", { level: 1, name: "Generar buches" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "R-01 · Inventario" })).toBeInTheDocument();
    expect(
      screen.getByText("Se van a crear 9 buches: LC-1 a LC-5, LA-1 a LA-2, TR-1 y TE-1. Todos arrancan vacíos y Operativos."),
    ).toBeInTheDocument();
    const previa = screen.getByRole("figure", { name: "Vista previa del plano" });
    expect(within(previa).getByLabelText("LC-5, Lado conductor, Operativo")).toBeInTheDocument();
    expect(within(previa).queryByLabelText(/^CB-1,/)).not.toBeInTheDocument();
  });

  it("los contadores respetan los límites y los interruptores suman techo y cabina", async () => {
    renderApp(generar);
    const quitarTrasero = await screen.findByRole("button", { name: "Quitar un buche de trasero" });
    const agregarTrasero = screen.getByRole("button", { name: "Agregar un buche a trasero" });

    await userEvent.click(quitarTrasero);
    expect(quitarTrasero).toBeDisabled();
    expect(screen.getByText("Sin buches")).toBeInTheDocument();
    for (let i = 0; i < 3; i++) await userEvent.click(agregarTrasero);
    expect(agregarTrasero).toBeDisabled();
    expect(screen.getByText("Buches TR-1 a TR-3")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("switch", { name: /Cabina/ }));
    expect(screen.getByRole("switch", { name: /Cabina/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText("CB-1, Cabina, Operativo")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("switch", { name: /Techo/ }));
    expect(screen.queryByLabelText("TE-1, Techo · escalas, Operativo")).not.toBeInTheDocument();
  });

  it("pide al menos un buche", async () => {
    renderApp(generar);
    await screen.findByRole("heading", { level: 1, name: "Generar buches" });
    await userEvent.click(screen.getByRole("switch", { name: /Techo/ }));
    for (const [zona, veces] of [["lado conductor", 5], ["lado acompañante", 2], ["trasero", 1]] as const) {
      for (let i = 0; i < veces; i++) await userEvent.click(screen.getByRole("button", { name: `Quitar un buche de ${zona}` }));
    }
    await userEvent.click(screen.getByRole("button", { name: "Generar buches" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Elegí al menos un buche para generar.");
    expect(generarBuches).not.toHaveBeenCalled();
  });

  it("genera y vuelve al inventario con el aviso", async () => {
    vi.mocked(generarBuches).mockResolvedValue(buches);
    const history = renderApp(generar);
    await userEvent.click(await screen.findByRole("button", { name: "Generar buches" }));

    expect(generarBuches).toHaveBeenCalledWith(ID, { ladoConductor: 5, ladoAcompanante: 2, trasero: 1, techo: true, cabina: false });
    vi.mocked(listarBuches).mockResolvedValue(buches);
    expect(await screen.findByText("Cambios en los buches guardados.")).toBeInTheDocument();
    expect(history.location.pathname).toBe(`/moviles/${ID}`);
    expect(history.location.search).toContain("pestana=inventario");
  });

  it("muestra el error del back", async () => {
    vi.mocked(generarBuches).mockRejectedValue(new ErrorApi(409, "El móvil ya tiene buches", { codigo: "COMPARTIMENTOS_YA_GENERADOS" }));
    renderApp(generar);
    await userEvent.click(await screen.findByRole("button", { name: "Generar buches" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("El móvil ya tiene buches");
    expect(screen.getByRole("button", { name: "Generar buches" })).toBeEnabled();
  });

  it("Cancelar vuelve al inventario", async () => {
    const history = renderApp(generar);
    await userEvent.click(await screen.findByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(history.location.pathname).toBe(`/moviles/${ID}`));
    expect(screen.queryByText("Cambios en los buches guardados.")).not.toBeInTheDocument();
  });

  it("si el móvil ya tiene buches manda a editarlos", async () => {
    vi.mocked(listarBuches).mockResolvedValue(buches);
    renderApp(generar);
    expect(await screen.findByText(/R-01 ya tiene 3 buches/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Editar buches" })).toHaveAttribute("href", `/moviles/${ID}/buches`);
  });

  it("dice 1 buche en singular", async () => {
    vi.mocked(listarBuches).mockResolvedValue([buches[0]]);
    renderApp(generar);
    expect(await screen.findByText(/R-01 ya tiene 1 buche\./)).toBeInTheDocument();
  });

  it("no deja generar en un móvil dado de baja", async () => {
    vi.mocked(obtenerMovil).mockResolvedValue({ ...r01, estado: "baja_definitiva" });
    renderApp(generar);
    expect(await screen.findByRole("heading", { name: "El móvil está dado de baja" })).toBeInTheDocument();
  });

  it("móvil inexistente y error de carga", async () => {
    vi.mocked(obtenerMovil).mockRejectedValueOnce(new ErrorApi(404, "No existe"));
    renderApp(generar);
    expect(await screen.findByRole("heading", { name: "Móvil no encontrado" })).toBeInTheDocument();
  });

  it("si falla la carga permite reintentar", async () => {
    vi.mocked(obtenerMovil).mockRejectedValueOnce(new Error("caído"));
    renderApp(generar);
    await userEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Generar buches" })).toBeInTheDocument();
  });

  it("sin el rol vuelve al inventario", async () => {
    comoRol("COMUN");
    const history = renderApp(generar);
    await waitFor(() => expect(history.location.pathname).toBe(`/moviles/${ID}`));
    expect(history.location.search).toContain("pestana=inventario");
  });
});

describe("Editar buches", () => {
  const editar = `/moviles/${ID}/buches`;
  const aviso = "Cambios en los buches guardados.";

  it("sin buche elegido muestra la ayuda; al tocar uno abre su panel", async () => {
    const history = renderApp(editar);
    expect(await screen.findByRole("heading", { level: 1, name: "Editar buches" })).toBeInTheDocument();
    expect(screen.getByText(/Elegí un buche del plano/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /^LC-2,/ }));
    expect(screen.getByRole("heading", { name: "LC-2 · Lado conductor" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /Nombre/ })).toHaveValue("LC-2");
    expect(screen.getByText("Estamos trabajando en esto")).toBeInTheDocument();
    expect(history.location.search).toContain(`buche=${B2}`);
  });

  it("Cancelar vuelve al inventario con el buche elegido y sin aviso", async () => {
    const history = renderApp(`${editar}?buche=${B2}`);
    await userEvent.click(await screen.findByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(history.location.pathname).toBe(`/moviles/${ID}`));
    expect(history.location.search).toContain(`buche=${B2}`);
    expect(await screen.findByRole("heading", { name: "LC-2" })).toBeInTheDocument();
    expect(screen.queryByText(aviso)).not.toBeInTheDocument();
  });

  it("renombra y mueve de zona un buche, y vuelve al inventario con el aviso", async () => {
    vi.mocked(editarBuche).mockResolvedValue({ ...buches[1], nombre: "LA 9", zona: "lado_acompanante" });
    const history = renderApp(`${editar}?buche=${B2}`);
    const nombre = await screen.findByRole("textbox", { name: /Nombre/ });
    await userEvent.clear(nombre);
    await userEvent.type(nombre, " la  9 ");
    await userEvent.selectOptions(screen.getByRole("combobox", { name: /Zona/ }), "lado_acompanante");
    expect(screen.getByText(/queda último en la zona nueva/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(editarBuche).toHaveBeenCalledWith(ID, B2, { nombre: "LA 9", zona: "lado_acompanante" });
    expect(await screen.findByText(aviso)).toBeInTheDocument();
    expect(history.location.pathname).toBe(`/moviles/${ID}`);
    expect(history.location.search).toContain(`buche=${B2}`);
  });

  it("guardar sin cambios vuelve al inventario sin llamar al back", async () => {
    const history = renderApp(`${editar}?buche=${B1}`);
    await userEvent.click(await screen.findByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(history.location.pathname).toBe(`/moviles/${ID}`));
    expect(editarBuche).not.toHaveBeenCalled();
    expect(screen.queryByText(aviso)).not.toBeInTheDocument();
  });

  it("valida el nombre antes de enviar y muestra el duplicado del back", async () => {
    renderApp(`${editar}?buche=${B1}`);
    const nombre = await screen.findByRole("textbox", { name: /Nombre/ });
    await userEvent.clear(nombre);
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(screen.getByText("Indicá el nombre del buche")).toBeInTheDocument();

    await userEvent.type(nombre, "lc-2");
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(screen.getByText("Ya existe un buche con ese nombre")).toBeInTheDocument();
    expect(editarBuche).not.toHaveBeenCalled();

    vi.mocked(editarBuche).mockRejectedValueOnce(new ErrorApi(409, "Ya existe un buche con ese nombre", { campo: "nombre" }));
    await userEvent.clear(nombre);
    await userEvent.type(nombre, "LC-7");
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Ya existe un buche con ese nombre")).toBeInTheDocument();
    expect(nombre).toHaveAttribute("aria-invalid", "true");

    vi.mocked(editarBuche).mockRejectedValueOnce(new ErrorApi(500, "El servidor tuvo un problema. Intentá de nuevo."));
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("El servidor tuvo un problema");
  });

  it("Agregar buche cambia el título, abre Nuevo buche y vuelve al inventario con el nuevo elegido", async () => {
    const nuevo = "99999999-9999-4999-8999-999999999999";
    vi.mocked(crearBuche).mockResolvedValue({ id: nuevo, nombre: "TR-1", zona: "trasero", orden: 1, estado: "operativo" });
    const history = renderApp(editar);
    await userEvent.click(await screen.findByRole("button", { name: "Agregar buche" }));
    expect(screen.getByRole("heading", { level: 1, name: "Agregar buche" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nuevo buche" })).toBeInTheDocument();
    expect(screen.queryByText("Estamos trabajando en esto")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /Nombre/ })).toHaveAttribute("placeholder", "Ej.: LC-3");

    await userEvent.selectOptions(screen.getByRole("combobox", { name: /Zona/ }), "trasero");
    await userEvent.type(screen.getByRole("textbox", { name: /Nombre/ }), "tr-1");
    await userEvent.click(screen.getByRole("button", { name: "Agregar buche" }));

    expect(crearBuche).toHaveBeenCalledWith(ID, { nombre: "TR-1", zona: "trasero" });
    expect(await screen.findByText(aviso)).toBeInTheDocument();
    expect(history.location.search).toContain(`buche=${nuevo}`);
  });

  it("cancelar el alta vuelve a Editar buches", async () => {
    renderApp(editar);
    await userEvent.click(await screen.findByRole("button", { name: "Agregar buche" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("heading", { level: 1, name: "Editar buches" })).toBeInTheDocument();
    expect(screen.getByText(/Elegí un buche del plano/)).toBeInTheDocument();
  });

  it("elimina un buche tras confirmar, avisa si tiene materiales y vuelve al inventario", async () => {
    vi.mocked(eliminarBuche)
      .mockRejectedValueOnce(new ErrorApi(409, "No se puede eliminar TE-1: tiene materiales asignados.", { codigo: "COMPARTIMENTO_CON_MATERIALES" }))
      .mockResolvedValueOnce(undefined);
    const history = renderApp(`${editar}?buche=${B3}`);
    await userEvent.click(await screen.findByRole("button", { name: "Eliminar buche" }));
    const dialogo = screen.getByRole("dialog", { name: "¿Eliminar TE-1?" });

    await userEvent.click(within(dialogo).getByRole("button", { name: "Eliminar buche" }));
    expect(await within(dialogo).findByRole("alert")).toHaveTextContent("tiene materiales asignados");

    vi.mocked(listarBuches).mockResolvedValue(buches.slice(0, 2));
    await userEvent.click(within(dialogo).getByRole("button", { name: "Eliminar buche" }));
    expect(await screen.findByText(aviso)).toBeInTheDocument();
    expect(eliminarBuche).toHaveBeenCalledWith(ID, B3);
    expect(history.location.pathname).toBe(`/moviles/${ID}`);
    expect(history.location.search).not.toContain("buche=");
  });

  it("cancelar la confirmación no elimina", async () => {
    renderApp(`${editar}?buche=${B3}`);
    await userEvent.click(await screen.findByRole("button", { name: "Eliminar buche" }));
    const dialogo = screen.getByRole("dialog", { name: "¿Eliminar TE-1?" });
    await userEvent.click(within(dialogo).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(eliminarBuche).not.toHaveBeenCalled();
  });

  it("sin buches invita a agregar uno", async () => {
    vi.mocked(listarBuches).mockResolvedValue([]);
    renderApp(editar);
    expect(await screen.findByText(/Este móvil no tiene buches/)).toBeInTheDocument();
  });

  it("elegir un buche no sube la página al tope", async () => {
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    renderApp(editar);
    const lc2 = await screen.findByRole("button", { name: /^LC-2,/ });
    scroll.mockClear();
    await userEvent.click(lc2);
    await screen.findByRole("heading", { name: "LC-2 · Lado conductor" });
    expect(scroll).not.toHaveBeenCalled();
  });

  it("sin el rol vuelve al inventario", async () => {
    comoRol("COMUN");
    const history = renderApp(editar);
    await waitFor(() => expect(history.location.pathname).toBe(`/moviles/${ID}`));
  });
});
