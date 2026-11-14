import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MovilFlota } from "../domain/movil";
import type { RevisionMovil } from "../domain/revision";
import { DetalleRevision, PanelDatosGenerales } from "./PanelesFicha";

const movil: MovilFlota = {
  id: "v1",
  codigo: "M-1",
  patente: "AB123CD",
  tipo: "Autobomba",
  marca: "Ford",
  modelo: "F-100",
  tipoId: "t1",
  marcaId: "m1",
  modeloId: "mo1",
  estado: "operativo",
};

describe("PanelesFicha", () => {
  it("muestra los datos generales del móvil", () => {
    render(<PanelDatosGenerales movil={movil} />);

    expect(screen.getByRole("heading", { name: "Datos del móvil" })).toBeInTheDocument();
    expect(screen.getByText("M-1")).toBeInTheDocument();
    expect(screen.getByText("AB 123 CD")).toBeInTheDocument();
    expect(screen.getByText("Autobomba")).toBeInTheDocument();
    expect(screen.getByText("Ford")).toBeInTheDocument();
    expect(screen.getByText("F-100")).toBeInTheDocument();
    expect(screen.queryByText("Motivo de baja")).not.toBeInTheDocument();
  });

  it("muestra el motivo cuando el móvil está dado de baja", () => {
    render(<PanelDatosGenerales movil={{ ...movil, estado: "baja_definitiva", motivoBaja: "Fin de vida útil" }} />);

    expect(screen.getByText("Motivo de baja")).toBeInTheDocument();
    expect(screen.getByText("Fin de vida útil")).toBeInTheDocument();
  });

  it("muestra el detalle de una revisión con verificaciones faltantes", () => {
    const revision: RevisionMovil = {
      id: "r1",
      realizadaEn: "2026-10-24T02:50:00Z",
      resultado: "fuera_de_servicio",
      revisadoPor: "Ana Gómez",
      comentario: "Frenos sin presión.\nRevisar urgente.",
      items: [
        { codigo: "ACEITE", estado: "ok" },
        { codigo: "FRENOS", estado: "critico", detalle: "Sin presión" },
      ],
    };

    render(<DetalleRevision revision={revision} />);

    expect(screen.getByLabelText("Resumen de la revisión")).toBeInTheDocument();
    expect(screen.getByText("23/10/2026 23:50")).toBeInTheDocument();
    expect(screen.getByText("Ana Gómez")).toBeInTheDocument();
    expect(screen.getByText("Fuera de servicio")).toBeInTheDocument();
    expect(screen.getAllByText("Sin presión").length).toBeGreaterThan(0);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.getByText(/Frenos sin presión/)).toBeInTheDocument();
  });

  it("usa guiones cuando falta quien revisó y el comentario", () => {
    const revision: RevisionMovil = {
      id: "r2",
      realizadaEn: "2026-10-24T02:50:00Z",
      resultado: "operativo",
      items: [],
    };

    render(<DetalleRevision revision={revision} />);

    expect(screen.getByText("Operativo")).toBeInTheDocument();
    expect(screen.queryByLabelText("Comentario general")).not.toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
