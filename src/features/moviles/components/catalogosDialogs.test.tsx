import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AgregarCatalogoDialog from "./AgregarCatalogoDialog";
import GestionarCatalogoDialog, { type FilaCatalogo } from "./GestionarCatalogoDialog";

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});

const filas: FilaCatalogo[] = [
  { id: "1", nombre: "Ford", enUso: 1 },
  { id: "2", nombre: "Chevrolet", enUso: 0, detalle: "Usada por M-2" },
];

function renderGestionar(overrides: Partial<Parameters<typeof GestionarCatalogoDialog>[0]> = {}) {
  return render(
    <GestionarCatalogoDialog
      abierto
      titulo="Marcas"
      descripcion="Renombrá o eliminá marcas."
      filas={filas}
      onRenombrar={vi.fn().mockResolvedValue(undefined)}
      onEliminar={vi.fn().mockResolvedValue(undefined)}
      onCerrar={vi.fn()}
      {...overrides}
    />,
  );
}

describe("GestionarCatalogoDialog", () => {
  it("muestra el estado vacío", () => {
    renderGestionar({ filas: [] });
    expect(screen.getByText("Todavía no hay ítems cargados.")).toBeInTheDocument();
  });

  it("lista los ítems con su uso y detalle", () => {
    renderGestionar();

    expect(screen.getByText("Ford")).toBeInTheDocument();
    expect(screen.getByText("Usada por M-2")).toBeInTheDocument();
    expect(screen.getByText("1 móvil")).toBeInTheDocument();
    expect(screen.getByText("Sin móviles")).toBeInTheDocument();
  });

  it("renombra un ítem", async () => {
    const onRenombrar = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderGestionar({ onRenombrar });

    await user.click(screen.getByRole("button", { name: "Renombrar Ford" }));
    const input = screen.getByLabelText("Nuevo nombre para Ford");
    await user.clear(input);
    await user.type(input, "Ford Argentina");
    await user.click(screen.getByRole("button", { name: "Guardar nombre" }));

    await waitFor(() => expect(onRenombrar).toHaveBeenCalledWith("1", "Ford Argentina"));
    expect(screen.queryByLabelText("Nuevo nombre para Ford")).not.toBeInTheDocument();
  });

  it("no renombra si el nombre no cambió", async () => {
    const onRenombrar = vi.fn();
    const user = userEvent.setup();
    renderGestionar({ onRenombrar });

    await user.click(screen.getByRole("button", { name: "Renombrar Ford" }));
    await user.click(screen.getByRole("button", { name: "Guardar nombre" }));

    expect(onRenombrar).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Nuevo nombre para Ford")).not.toBeInTheDocument();
  });

  it("cancela la edición con el botón o con Escape", async () => {
    const user = userEvent.setup();
    renderGestionar();

    await user.click(screen.getByRole("button", { name: "Renombrar Ford" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByLabelText("Nuevo nombre para Ford")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Renombrar Ford" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByLabelText("Nuevo nombre para Ford")).not.toBeInTheDocument();
  });

  it("pide confirmación antes de eliminar un ítem sin uso", async () => {
    const onEliminar = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderGestionar({ onEliminar });

    await user.click(screen.getByRole("button", { name: "Eliminar Chevrolet" }));
    expect(screen.getByText(/¿Eliminar/)).toBeInTheDocument();
    expect(onEliminar).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "No" }));
    expect(screen.queryByText(/¿Eliminar/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Eliminar Chevrolet" }));
    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(onEliminar).toHaveBeenCalledWith("2"));
  });

  it("elimina directo un ítem en uso y muestra el error del back", async () => {
    const onEliminar = vi.fn().mockRejectedValue(new Error("No se puede eliminar Ford: la usa 1 móvil (M-1)."));
    const user = userEvent.setup();
    renderGestionar({ onEliminar });

    await user.click(screen.getByRole("button", { name: "Eliminar Ford" }));

    await waitFor(() => expect(onEliminar).toHaveBeenCalledWith("1"));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se puede eliminar Ford: la usa 1 móvil (M-1).");
  });

  it("cierra con Listo y no si está ocupado", async () => {
    const onCerrar = vi.fn();
    const user = userEvent.setup();
    renderGestionar({ onCerrar });

    await user.click(screen.getByRole("button", { name: "Listo" }));
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });
});

describe("AgregarCatalogoDialog", () => {
  function renderAgregar(overrides: Partial<Parameters<typeof AgregarCatalogoDialog>[0]> = {}) {
    return render(
      <AgregarCatalogoDialog
        abierto
        titulo="Agregar marca"
        descripcion="Sumá una marca nueva."
        etiqueta="Nombre de la marca"
        placeholder="Ej.: Ford"
        onGuardar={vi.fn().mockResolvedValue(undefined)}
        onCerrar={vi.fn()}
        {...overrides}
      />,
    );
  }

  it("muestra la marca cuando se agrega un modelo", () => {
    renderAgregar({ marca: "Ford" });
    expect(screen.getByText("Marca")).toBeInTheDocument();
    expect(screen.getByText("Ford")).toBeInTheDocument();
  });

  it("valida que el nombre no esté vacío", async () => {
    const onGuardar = vi.fn();
    const user = userEvent.setup();
    renderAgregar({ onGuardar });

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(screen.getByText("Este campo es obligatorio")).toBeInTheDocument();
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it("guarda el nombre recortado y limpia el campo", async () => {
    const onGuardar = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderAgregar({ onGuardar });

    const input = screen.getByLabelText(/^Nombre de la marca/);
    await user.type(input, "  Iveco  ");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(onGuardar).toHaveBeenCalledWith("Iveco"));
    expect(input).toHaveValue("");
  });

  it("muestra el error al guardar", async () => {
    const onGuardar = vi.fn().mockRejectedValue(new Error("La marca ya existe"));
    const user = userEvent.setup();
    renderAgregar({ onGuardar });

    await user.type(screen.getByLabelText(/^Nombre de la marca/), "Ford");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("La marca ya existe");
    expect(screen.getByLabelText(/^Nombre de la marca/)).toHaveValue("Ford");
  });

  it("cancela y cierra el diálogo", async () => {
    const onCerrar = vi.fn();
    const user = userEvent.setup();
    renderAgregar({ onCerrar });

    await user.type(screen.getByLabelText(/^Nombre de la marca/), "Ford");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCerrar).toHaveBeenCalledTimes(1);
  });
});
