import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BajaMovilDialog from "./BajaMovilDialog";
import Dialogo from "./Dialogo";
import PatenteEspecialDialog from "./PatenteEspecialDialog";

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});

describe("Dialogo", () => {
  it("no muestra contenido cuando está cerrado", () => {
    render(
      <Dialogo abierto={false} titulo="Título" tituloId="dialogo-titulo" onCerrar={vi.fn()}>
        <p>Contenido</p>
      </Dialogo>,
    );

    expect(screen.queryByText("Contenido")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("abre con título y contenido, y cierra con cancel", () => {
    const onCerrar = vi.fn();
    render(
      <Dialogo abierto titulo="Título" tituloId="dialogo-titulo" onCerrar={onCerrar}>
        <p>Contenido</p>
      </Dialogo>,
    );

    expect(screen.getByRole("heading", { name: "Título" })).toBeInTheDocument();
    expect(screen.getByText("Contenido")).toBeInTheDocument();

    const dialogo = screen.getByRole("dialog");
    fireEvent(dialogo, new Event("cancel", { bubbles: true }));
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it("se cierra cuando el padre cambia abierto a false", () => {
    const { rerender } = render(
      <Dialogo abierto titulo="Título" tituloId="dialogo-titulo" onCerrar={vi.fn()}>
        <p>Contenido</p>
      </Dialogo>,
    );
    expect(screen.getByText("Contenido")).toBeInTheDocument();

    rerender(
      <Dialogo abierto={false} titulo="Título" tituloId="dialogo-titulo" onCerrar={vi.fn()}>
        <p>Contenido</p>
      </Dialogo>,
    );
    expect(screen.queryByText("Contenido")).not.toBeInTheDocument();
  });
});

describe("PatenteEspecialDialog", () => {
  it("muestra la patente normalizada y permite revisar o guardar igual", async () => {
    const onRevisar = vi.fn();
    const onGuardarIgual = vi.fn();
    const user = userEvent.setup();
    render(
      <PatenteEspecialDialog
        abierto
        patente="ab 123 cd"
        guardando={false}
        onRevisar={onRevisar}
        onGuardarIgual={onGuardarIgual}
      />,
    );

    expect(screen.getByText("AB123CD")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Revisar" }));
    expect(onRevisar).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Guardar igual" }));
    expect(onGuardarIgual).toHaveBeenCalledTimes(1);
  });

  it("deshabilita las acciones mientras guarda", () => {
    render(
      <PatenteEspecialDialog abierto patente="XX" guardando onRevisar={vi.fn()} onGuardarIgual={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "Revisar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Guardando…" })).toBeDisabled();
  });
});

describe("BajaMovilDialog", () => {
  it("exige el motivo antes de habilitar la baja", async () => {
    const onConfirmar = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<BajaMovilDialog codigo="M-1" abierto onCerrar={vi.fn()} onConfirmar={onConfirmar} />);

    expect(screen.getByRole("button", { name: "Sí, dar de baja" })).toBeDisabled();

    await user.type(screen.getByLabelText(/^Motivo de la baja/), "  Fin de vida útil  ");
    await user.click(screen.getByRole("button", { name: "Sí, dar de baja" }));

    await waitFor(() => expect(onConfirmar).toHaveBeenCalledWith("Fin de vida útil"));
    expect(await screen.findByLabelText(/^Motivo de la baja/)).toHaveValue("");
  });

  it("muestra el error de la API y mantiene el diálogo abierto", async () => {
    const onConfirmar = vi.fn().mockRejectedValue(new Error("El móvil tiene una revisión activa"));
    const user = userEvent.setup();
    render(<BajaMovilDialog codigo="M-1" abierto onCerrar={vi.fn()} onConfirmar={onConfirmar} />);

    await user.type(screen.getByLabelText(/^Motivo de la baja/), "Baja");
    await user.click(screen.getByRole("button", { name: "Sí, dar de baja" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("El móvil tiene una revisión activa");
    expect(screen.getByRole("button", { name: "Sí, dar de baja" })).toBeEnabled();
  });

  it("vuelve sin confirmar y limpia el motivo", async () => {
    const onCerrar = vi.fn();
    const user = userEvent.setup();
    render(<BajaMovilDialog codigo="M-1" abierto onCerrar={onCerrar} onConfirmar={vi.fn()} />);

    await user.type(screen.getByLabelText(/^Motivo de la baja/), "algo");
    await user.click(screen.getByRole("button", { name: "Volver" }));

    expect(onCerrar).toHaveBeenCalledTimes(1);
  });
});
