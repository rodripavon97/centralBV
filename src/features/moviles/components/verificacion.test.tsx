import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import EstadoVerificacion from "./EstadoVerificacion";
import SeccionRevision, { FilaRevision } from "./SeccionRevision";

describe("EstadoVerificacion", () => {
  it("muestra las tres opciones y la marcada", () => {
    render(<EstadoVerificacion nombre="Frenos" valor="atencion" onCambiar={vi.fn()} />);

    const grupo = screen.getByRole("radiogroup", { name: "Frenos" });
    expect(grupo).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Ok" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("radio", { name: "Atención" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Crítico" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("radio", { name: "Atención" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("radio", { name: "Ok" })).toHaveAttribute("tabindex", "-1");
  });

  it("sin valor, la primera opción recibe el foco", () => {
    render(<EstadoVerificacion nombre="Frenos" onCambiar={vi.fn()} />);
    expect(screen.getByRole("radio", { name: "Ok" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("radio", { name: "Atención" })).toHaveAttribute("aria-checked", "false");
  });

  it("cambia la opción al hacer clic", async () => {
    const onCambiar = vi.fn();
    const user = userEvent.setup();
    render(<EstadoVerificacion nombre="Frenos" valor="ok" onCambiar={onCambiar} />);

    await user.click(screen.getByRole("radio", { name: "Crítico" }));
    expect(onCambiar).toHaveBeenCalledWith("critico");
  });

  it("navega con flechas y da la vuelta", async () => {
    const onCambiar = vi.fn();
    const user = userEvent.setup();
    render(<EstadoVerificacion nombre="Frenos" valor="ok" onCambiar={onCambiar} />);

    await user.click(screen.getByRole("radio", { name: "Ok" }));
    await user.keyboard("{ArrowRight}");
    expect(onCambiar).toHaveBeenLastCalledWith("atencion");
    expect(screen.getByRole("radio", { name: "Atención" })).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(onCambiar).toHaveBeenLastCalledWith("ok");

    await user.keyboard("{ArrowLeft}");
    expect(onCambiar).toHaveBeenLastCalledWith("critico");
  });

  it("deshabilita las opciones", () => {
    render(<EstadoVerificacion nombre="Frenos" valor="ok" onCambiar={vi.fn()} disabled />);
    for (const nombre of ["Ok", "Atención", "Crítico"]) {
      expect(screen.getByRole("radio", { name: nombre })).toBeDisabled();
    }
  });
});

describe("SeccionRevision", () => {
  it("renderiza el título y las filas", () => {
    render(
      <SeccionRevision titulo="Mecánica y fluidos">
        <FilaRevision etiqueta="Nivel de aceite" ayuda="Revisar en frío">
          <p>Control</p>
        </FilaRevision>
      </SeccionRevision>,
    );

    expect(screen.getByRole("heading", { name: "Mecánica y fluidos" })).toBeInTheDocument();
    expect(screen.getByText("Nivel de aceite")).toBeInTheDocument();
    expect(screen.getByText("Revisar en frío")).toBeInTheDocument();
    expect(screen.getByText("Control")).toBeInTheDocument();
  });

  it("usa label cuando recibe htmlFor", () => {
    render(
      <FilaRevision etiqueta="Comentario general" htmlFor="comentario">
        <textarea id="comentario" />
      </FilaRevision>,
    );

    expect(screen.getByLabelText("Comentario general")).toBeInTheDocument();
  });
});
