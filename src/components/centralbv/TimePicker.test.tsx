import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { TimePicker } from "./TimePicker";

function Campo({ inicial = "", max, disabled }: { inicial?: string; max?: string; disabled?: boolean }) {
  const [valor, setValor] = useState(inicial);
  return <TimePicker id="hora" value={valor} onChange={setValor} max={max} disabled={disabled} />;
}

const input = () => screen.getByPlaceholderText("hh:mm");

function enGrupo(grupo: "Hora" | "Minutos", texto: string) {
  const dialogo = screen.getByRole("dialog", { name: "Elegir hora" });
  return within(within(dialogo).getByRole("group", { name: grupo })).getByRole("button", { name: texto });
}

describe("TimePicker", () => {
  it("abre la lista, elige hora y minutos, y devuelve hh:mm", async () => {
    const user = userEvent.setup();
    render(<Campo />);

    await user.click(screen.getByRole("button", { name: "Abrir selector de hora" }));
    await user.click(enGrupo("Hora", "18"));
    expect(screen.getByRole("dialog", { name: "Elegir hora" })).toBeInTheDocument();
    await user.click(enGrupo("Minutos", "20"));

    expect(input()).toHaveValue("18:20");
    expect(input()).toHaveFocus();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("si se elige un minuto sin hora, usa las 00", async () => {
    const user = userEvent.setup();
    render(<Campo />);

    await user.click(screen.getByRole("button", { name: "Abrir selector de hora" }));
    await user.click(enGrupo("Minutos", "30"));

    expect(input()).toHaveValue("00:30");
  });

  it("deshabilita las horas y los minutos posteriores al máximo", async () => {
    const user = userEvent.setup();
    render(<Campo max="14:05" />);

    await user.click(screen.getByRole("button", { name: "Abrir selector de hora" }));

    expect(enGrupo("Hora", "14")).toBeEnabled();
    expect(enGrupo("Hora", "15")).toBeDisabled();

    await user.click(enGrupo("Hora", "14"));

    expect(enGrupo("Minutos", "05")).toBeEnabled();
    expect(enGrupo("Minutos", "06")).toBeDisabled();
  });

  it("ajusta el minuto si la hora elegida es la máxima", async () => {
    const user = userEvent.setup();
    render(<Campo inicial="18:30" max="14:05" />);

    await user.click(screen.getByRole("button", { name: "Abrir selector de hora" }));
    await user.click(enGrupo("Hora", "14"));

    expect(input()).toHaveValue("14:05");
  });

  it("permite escribir la hora a mano", async () => {
    const user = userEvent.setup();
    render(<Campo />);

    await user.type(input(), "18:20");

    expect(input()).toHaveValue("18:20");
  });

  it("cierra con Escape y devuelve el foco al botón del selector", async () => {
    const user = userEvent.setup();
    render(<Campo />);

    await user.click(screen.getByRole("button", { name: "Abrir selector de hora" }));
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Abrir selector de hora" })).toHaveFocus();
  });

  it("Escape sobre el campo también cierra la lista", async () => {
    const user = userEvent.setup();
    render(<Campo />);

    await user.click(screen.getByRole("button", { name: "Abrir selector de hora" }));
    input().focus();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("cierra al hacer clic afuera o al volver a tocar el botón", async () => {
    const user = userEvent.setup();
    render(<Campo />);

    await user.click(screen.getByRole("button", { name: "Abrir selector de hora" }));
    await user.click(document.body);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Abrir selector de hora" }));
    await user.click(screen.getByRole("button", { name: "Cerrar selector de hora" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("deshabilitado no abre la lista", async () => {
    const user = userEvent.setup();
    render(<Campo disabled />);

    expect(input()).toBeDisabled();
    expect(screen.getByRole("button", { name: "Abrir selector de hora" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Abrir selector de hora" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
