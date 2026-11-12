import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import BuscadorMoviles, { DEMORA_BUSQUEDA_MS } from "./BuscadorMoviles";

describe("BuscadorMoviles", () => {
  it("busca con retraso y recorta el texto", async () => {
    const onBuscar = vi.fn();
    render(<BuscadorMoviles valor="" onBuscar={onBuscar} />);

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "  m-1 " } });

    await waitFor(() => expect(onBuscar).toHaveBeenCalledWith("m-1"), { timeout: DEMORA_BUSQUEDA_MS + 1000 });
    expect(onBuscar).toHaveBeenCalledTimes(1);
  });

  it("busca al presionar Enter y limpia con Escape", async () => {
    const onBuscar = vi.fn();
    const user = userEvent.setup();
    render(<BuscadorMoviles valor="" onBuscar={onBuscar} />);

    const input = screen.getByRole("searchbox");
    await user.type(input, "AB123CD");
    await user.keyboard("{Enter}");
    expect(onBuscar).toHaveBeenCalledWith("AB123CD");

    await user.keyboard("{Escape}");
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(onBuscar).toHaveBeenLastCalledWith("");
  });

  it("muestra el botón de borrar y limpia la búsqueda", async () => {
    const onBuscar = vi.fn();
    const user = userEvent.setup();
    render(<BuscadorMoviles valor="M-1" onBuscar={onBuscar} />);

    expect(screen.getByRole("searchbox")).toHaveValue("M-1");
    await user.click(screen.getByRole("button", { name: "Borrar el texto de búsqueda" }));

    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(onBuscar).toHaveBeenCalledWith("");
  });

  it("sincroniza el texto cuando cambia el valor que viene de la URL", () => {
    const { rerender } = render(<BuscadorMoviles valor="M-1" onBuscar={vi.fn()} />);
    expect(screen.getByRole("searchbox")).toHaveValue("M-1");

    rerender(<BuscadorMoviles valor="M-2" onBuscar={vi.fn()} />);
    expect(screen.getByRole("searchbox")).toHaveValue("M-2");
  });

  it("no busca si el texto coincide con el valor actual", async () => {
    const onBuscar = vi.fn();
    render(<BuscadorMoviles valor="M-1" onBuscar={onBuscar} />);

    await new Promise((resolve) => setTimeout(resolve, DEMORA_BUSQUEDA_MS + 50));
    expect(onBuscar).not.toHaveBeenCalled();
  });
});
