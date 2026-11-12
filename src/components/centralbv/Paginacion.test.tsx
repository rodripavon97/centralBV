import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Paginacion } from "./Paginacion";

describe("Paginacion", () => {
  it("muestra el rango y deshabilita Anterior en la primera página", () => {
    render(<Paginacion pagina={1} paginas={3} desde={1} hasta={12} total={31} onPagina={vi.fn()} />);

    expect(screen.getByText("1–12 de 31")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeEnabled();
  });

  it("navega a la página anterior y siguiente", async () => {
    const onPagina = vi.fn();
    const user = userEvent.setup();
    render(<Paginacion pagina={2} paginas={3} desde={13} hasta={24} total={31} onPagina={onPagina} />);

    await user.click(screen.getByRole("button", { name: "Anterior" }));
    expect(onPagina).toHaveBeenLastCalledWith(1);

    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(onPagina).toHaveBeenLastCalledWith(3);
  });

  it("deshabilita Siguiente en la última página", () => {
    render(<Paginacion pagina={3} paginas={3} desde={25} hasta={31} total={31} onPagina={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Anterior" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });
});
