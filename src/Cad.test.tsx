import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Cad from "@/Cad";

describe("Cad (guía de configuración de unidades)", () => {
  it("parte de un camión con los módulos y buches por defecto", () => {
    render(<Cad />);

    expect(screen.getByRole("heading", { name: "CONFIGURADOR CENITAL DE UNIDADES" })).toBeInTheDocument();
    expect(screen.getByText("MOD: TRUCK")).toBeInTheDocument();
    expect(screen.getByText("CABINA DE MANDO")).toBeInTheDocument();
    expect(screen.getByText("TECHO / ESCALAS & MONITORES")).toBeInTheDocument();
    expect(screen.getByText("MÓDULO POSTERIOR / BOMBA")).toBeInTheDocument();

    expect(screen.getAllByText("BL-1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("BL-2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("BD-1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("BD-2").length).toBeGreaterThan(0);
    expect(screen.getByText("4", { selector: "strong" })).toBeInTheDocument();
  });

  it("cambia a automóvil/SUV y oculta el techo", async () => {
    render(<Cad />);

    await userEvent.click(screen.getByRole("button", { name: "[AUTOMÓVIL / SUV]" }));

    expect(screen.getByText("MOD: SUV")).toBeInTheDocument();
    expect(screen.queryByText("Techo / Equipamiento Central")).not.toBeInTheDocument();
    expect(screen.getByText("Baúl Trasero")).toBeInTheDocument();
    expect(screen.getByText("BAÚL / EQUIPAJE CENTRAL")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "[CAMIÓN / CISTERNA]" }));
    expect(screen.getByText("MOD: TRUCK")).toBeInTheDocument();
    expect(screen.getByText("Techo / Equipamiento Central")).toBeInTheDocument();
  });

  it("agrega y quita buches de cada lado", async () => {
    render(<Cad />);
    const agregar = screen.getAllByRole("button", { name: "+ Añadir" });

    await userEvent.click(agregar[0]);
    expect(screen.getAllByText("BL-3").length).toBeGreaterThan(0);
    expect(screen.getByText("COMPARTIMENTO BL-3")).toBeInTheDocument();
    expect(screen.getByText("5", { selector: "strong" })).toBeInTheDocument();

    await userEvent.click(agregar[1]);
    expect(screen.getAllByText("BD-3").length).toBeGreaterThan(0);
    expect(screen.getByText("COMPARTIMENTO BD-3")).toBeInTheDocument();
    expect(screen.getByText("6", { selector: "strong" })).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole("button", { name: "✕" })[0]);
    expect(screen.queryByText("BL-1")).not.toBeInTheDocument();
    expect(screen.getByText("5", { selector: "strong" })).toBeInTheDocument();
  });

  it("permite renombrar un buch y cambia el estado", async () => {
    render(<Cad />);

    const nombre = screen.getAllByDisplayValue("EQUIPOS AUTÓNOMOS")[0];
    await userEvent.clear(nombre);
    await userEvent.type(nombre, "EQUIPO DE RESCATE");
    expect(screen.getByText("EQUIPO DE RESCATE")).toBeInTheDocument();
    expect(nombre).toHaveValue("EQUIPO DE RESCATE");

    const estado = screen.getAllByRole("combobox")[0];
    await userEvent.selectOptions(estado, "danger");
    expect(estado).toHaveValue("danger");
  });

  it("muestra los estados vacíos al quitar todos los buches", async () => {
    render(<Cad />);

    for (let i = 0; i < 2; i++) {
      await userEvent.click(screen.getAllByRole("button", { name: "✕" })[0]);
    }
    expect(screen.getByText("Sin buches izq")).toBeInTheDocument();

    for (let i = 0; i < 2; i++) {
      await userEvent.click(screen.getAllByRole("button", { name: "✕" })[0]);
    }
    expect(screen.getByText("Sin buches der")).toBeInTheDocument();
    expect(screen.getByText("0", { selector: "strong" })).toBeInTheDocument();
  });

  it("desactiva módulos y vacía el esquema", async () => {
    render(<Cad />);
    const checks = screen.getAllByRole("checkbox");

    await userEvent.click(checks[0]);
    expect(screen.queryAllByDisplayValue("CABINA DE MANDO")).toHaveLength(0);
    expect(screen.queryByText("ZONA DELANTERA")).not.toBeInTheDocument();

    await userEvent.click(checks[1]);
    expect(screen.getByText("TECHO DESPEJADO")).toBeInTheDocument();

    await userEvent.click(checks[2]);
    expect(screen.queryByText("MÓDULO POSTERIOR")).not.toBeInTheDocument();
  });
});
