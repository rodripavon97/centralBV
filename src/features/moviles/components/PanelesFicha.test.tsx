import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { MovilFlota } from "../domain/movil";
import type { RevisionMovil } from "../domain/revision";
import { DetalleRevision, PanelDatosGenerales, PanelInventario } from "./PanelesFicha";

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
  it("muestra los datos generales y el código QR del móvil", () => {
    render(<PanelDatosGenerales movil={movil} />);

    const datos = screen.getByRole("heading", { name: "Datos del móvil" }).closest("section")!;
    expect(within(datos).getByText("M-1")).toBeInTheDocument();
    expect(within(datos).getByText("AB 123 CD")).toBeInTheDocument();
    expect(within(datos).getByText("Autobomba")).toBeInTheDocument();
    expect(within(datos).getByText("Ford")).toBeInTheDocument();
    expect(within(datos).getByText("F-100")).toBeInTheDocument();
    expect(screen.queryByText("Motivo de baja")).not.toBeInTheDocument();

    const qr = screen.getByRole("heading", { name: "Código QR" }).closest("section")!;
    expect(within(qr).getAllByRole("img", { name: "QR de revisión de M-1" }).length).toBeGreaterThanOrEqual(1);
    expect(within(qr).getByRole("button", { name: "Imprimir" })).toBeInTheDocument();
    // Portal de impresión (oculto en pantalla) también monta el QR.
    expect(document.getElementById("etiqueta-movil-impresion")).toBeInTheDocument();
  });

  it("abre el diálogo de impresión de la etiqueta QR", async () => {
    const imprimir = vi.spyOn(window, "print").mockImplementation(() => {});
    render(<PanelDatosGenerales movil={movil} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Imprimir" }));
    const dialogo = screen.getByRole("heading", { name: "Imprimir etiqueta" }).closest("dialog")!;
    expect(dialogo).toBeInTheDocument();

    await user.click(within(dialogo).getByRole("button", { name: "Imprimir" }));
    await waitFor(() => expect(imprimir).toHaveBeenCalled());
    imprimir.mockRestore();
  });

  it("muestra el motivo cuando el móvil está dado de baja", () => {
    render(<PanelDatosGenerales movil={{ ...movil, estado: "baja_definitiva", motivoBaja: "Fin de vida útil" }} />);

    expect(screen.getByText("Motivo de baja")).toBeInTheDocument();
    expect(screen.getByText("Fin de vida útil")).toBeInTheDocument();
  });

  it("muestra el estado vacío del inventario", () => {
    render(<PanelInventario />);

    expect(screen.getByRole("heading", { name: "Este móvil todavía no tiene buches" })).toBeInTheDocument();
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
