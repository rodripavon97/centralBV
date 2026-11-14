import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DatePicker } from "./DatePicker";

function Campo({ inicial = "", disabled }: { inicial?: string; disabled?: boolean }) {
  const [valor, setValor] = useState(inicial);
  return <DatePicker id="fecha" value={valor} onChange={setValor} disabled={disabled} />;
}

const input = () => screen.getByPlaceholderText("dd/mm/aaaa");

function dia(numero: number) {
  const dialogo = screen.getByRole("dialog", { name: "Elegir fecha" });
  const boton = within(dialogo)
    .getAllByRole("button")
    .find((candidato) => candidato.textContent === String(numero));
  if (!boton) throw new Error(`No se encontró el día ${numero}`);
  return boton;
}

describe("DatePicker", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 10, 13, 10, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("abre el calendario, elige un día y devuelve la fecha como dd/mm/aaaa", async () => {
    const user = userEvent.setup();
    render(<Campo />);

    await user.click(screen.getByRole("button", { name: "Abrir calendario" }));
    expect(screen.getByRole("dialog", { name: "Elegir fecha" })).toBeInTheDocument();

    await user.click(dia(10));

    expect(input()).toHaveValue("10/11/2026");
    expect(input()).toHaveFocus();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("no deja elegir días posteriores a hoy", async () => {
    const user = userEvent.setup();
    render(<Campo />);

    await user.click(screen.getByRole("button", { name: "Abrir calendario" }));

    expect(dia(13)).toBeEnabled();
    expect(dia(14)).toBeDisabled();
    expect(dia(30)).toBeDisabled();
  });

  it("marca el día que ya tenía cargado", async () => {
    const user = userEvent.setup();
    render(<Campo inicial="10/11/2026" />);

    await user.click(screen.getByRole("button", { name: "Abrir calendario" }));

    expect(dia(10)).toHaveClass("react-calendar__tile--active");
  });

  it("permite escribir la fecha a mano", async () => {
    const user = userEvent.setup();
    render(<Campo />);

    await user.type(input(), "10/10/2026");

    expect(input()).toHaveValue("10/10/2026");
  });

  it("cierra con Escape y devuelve el foco al botón del calendario", async () => {
    const user = userEvent.setup();
    render(<Campo />);

    await user.click(screen.getByRole("button", { name: "Abrir calendario" }));
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir calendario" })).toHaveFocus();
  });

  it("sigue abierto al navegar de mes", async () => {
    const user = userEvent.setup();
    render(<Campo />);

    await user.click(screen.getByRole("button", { name: "Abrir calendario" }));
    await user.click(screen.getByRole("button", { name: "Mes anterior" }));

    expect(screen.getByRole("dialog", { name: "Elegir fecha" })).toBeInTheDocument();
  });

  it("Escape sobre el campo también cierra el calendario", async () => {
    const user = userEvent.setup();
    render(<Campo />);

    await user.click(screen.getByRole("button", { name: "Abrir calendario" }));
    input().focus();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("cierra al hacer clic afuera", async () => {
    const user = userEvent.setup();
    render(<Campo />);

    await user.click(screen.getByRole("button", { name: "Abrir calendario" }));
    await user.click(document.body);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("el mismo botón cierra el calendario", async () => {
    const user = userEvent.setup();
    render(<Campo />);

    await user.click(screen.getByRole("button", { name: "Abrir calendario" }));
    await user.click(screen.getByRole("button", { name: "Cerrar calendario" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("deshabilitado no abre el calendario", async () => {
    const user = userEvent.setup();
    render(<Campo disabled />);

    expect(input()).toBeDisabled();
    expect(screen.getByRole("button", { name: "Abrir calendario" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Abrir calendario" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
