import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearRouter } from "@/app/router";
import { guardarToken } from "@/features/auth/session";
import type { Solicitud } from "@/types/dominio";
import { firmarSolicitud, generarConstancia, obtenerSolicitud } from "../api/solicitudesApi";

vi.mock("../api/solicitudesApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/solicitudesApi")>();
  return { ...actual, obtenerSolicitud: vi.fn(), generarConstancia: vi.fn(), firmarSolicitud: vi.fn() };
});

const obtenerMock = vi.mocked(obtenerSolicitud);
const generarMock = vi.mocked(generarConstancia);
const firmarMock = vi.mocked(firmarSolicitud);

const solicitud: Solicitud = {
  id: "11111111-1111-4111-8111-111111111111",
  numero: "SOL-0042",
  fechaAlta: "2026-10-11",
  estado: "pendiente",
  damnificado: { nombre: "Paula Herrera", dni: "31222333" },
  siniestro: {
    tipo: "vivienda",
    fecha: "2026-10-05",
    hora: "22:15",
    direccion: "Calle Italia 55",
    numeroParte: "P-2026-0009",
    motivo: "Constancia para acción social",
    localidad: "Morón",
    partido: "Morón",
    perdidas: "Daños en tablero eléctrico",
  },
  constancia: { destino: "accion_social", razonSocial: "Acción Social Morón" },
};

function tokenVigente(): string {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 60 }));
  return `header.${payload}.firma`;
}

function renderApp() {
  const router = crearRouter(createMemoryHistory({ initialEntries: [`/solicitudes/${solicitud.id}/generar`] }));
  render(<RouterProvider router={router} />);
}

beforeEach(() => {
  window.localStorage.clear();
  guardarToken(tokenVigente());
  obtenerMock.mockReset();
  generarMock.mockReset();
  firmarMock.mockReset();
});

describe("GenerarConstanciaPage (US10)", () => {
  it("abre la plantilla con los datos y el texto adicional cuando está pendiente", async () => {
    obtenerMock.mockResolvedValue(solicitud);

    renderApp();

    expect(await screen.findByRole("heading", { name: "Generar constancia" })).toBeInTheDocument();
    expect(screen.getByText("PAULA HERRERA")).toBeInTheDocument();
    expect(screen.getByLabelText("Observaciones (se suma al final de los datos)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar constancia" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Descargar PDF/ })).not.toBeInTheDocument();
  });

  it("guarda el texto adicional y pasa al visor de la constancia", async () => {
    obtenerMock.mockResolvedValue(solicitud);
    generarMock.mockResolvedValue({ blob: new Blob(["pdf"]), filename: "Constancia.pdf" });
    const user = userEvent.setup();

    renderApp();

    await user.type(
      await screen.findByLabelText("Observaciones (se suma al final de los datos)"),
      "Intervinieron dos unidades.",
    );
    await user.click(screen.getByRole("button", { name: "Guardar constancia" }));

    expect(await screen.findByRole("heading", { name: /Constancia N.º/ })).toBeInTheDocument();
    expect(generarMock).toHaveBeenCalledWith(solicitud.id, "Intervinieron dos unidades.");
    expect(screen.getByRole("button", { name: "Descargar PDF (3 hojas)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Imprimir" })).toBeInTheDocument();
  });

  it("muestra directamente el visor con descarga cuando ya fue generada", async () => {
    obtenerMock.mockResolvedValue({ ...solicitud, estado: "firmada", observaciones: "Texto guardado" });

    renderApp();

    expect(await screen.findByRole("heading", { name: /Constancia N.º/ })).toBeInTheDocument();
    expect(screen.getByText("Firmada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descargar PDF (3 hojas)" })).toBeInTheDocument();
  });

  it("marca como firmada una constancia generada (T31)", async () => {
    obtenerMock.mockResolvedValue({ ...solicitud, estado: "constancia_generada" });
    firmarMock.mockResolvedValue({ ...solicitud, estado: "firmada" });
    const user = userEvent.setup();

    renderApp();

    await user.click(await screen.findByRole("button", { name: "Marcar como firmada" }));

    expect(firmarMock).toHaveBeenCalledWith(solicitud.id);
    expect(await screen.findByText("Constancia marcada como firmada. Ya se puede entregar.")).toBeInTheDocument();
    expect(screen.getByText("Firmada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Marcar como firmada" })).not.toBeInTheDocument();
  });

  it("muestra el error si el back no deja firmar", async () => {
    obtenerMock.mockResolvedValue({ ...solicitud, estado: "constancia_generada" });
    firmarMock.mockRejectedValue(new Error("La solicitud no se puede firmar"));
    const user = userEvent.setup();

    renderApp();

    await user.click(await screen.findByRole("button", { name: "Marcar como firmada" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("La solicitud no se puede firmar");
    expect(screen.getByRole("button", { name: "Marcar como firmada" })).toBeEnabled();
  });

  it("no ofrece firmar si ya está firmada", async () => {
    obtenerMock.mockResolvedValue({ ...solicitud, estado: "firmada" });

    renderApp();

    await screen.findByRole("heading", { name: /Constancia N.º/ });
    expect(screen.queryByRole("button", { name: "Marcar como firmada" })).not.toBeInTheDocument();
  });

  it("no permite generar una constancia cancelada", async () => {
    obtenerMock.mockResolvedValue({ ...solicitud, estado: "cancelada" });

    renderApp();

    expect(await screen.findByRole("heading", { name: "La solicitud está cancelada" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar constancia" })).not.toBeInTheDocument();
  });
});
