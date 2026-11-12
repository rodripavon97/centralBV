import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearRouter } from "@/app/router";
import { guardarToken } from "@/features/auth/session";
import { ErrorApi } from "@/lib/http";
import type { Solicitud } from "@/types/dominio";
import { actualizarSolicitud, obtenerSolicitud } from "../api/solicitudesApi";

vi.mock("../api/solicitudesApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/solicitudesApi")>();
  return { ...actual, obtenerSolicitud: vi.fn(), actualizarSolicitud: vi.fn() };
});

const obtenerMock = vi.mocked(obtenerSolicitud);
const actualizarMock = vi.mocked(actualizarSolicitud);

const pendiente: Solicitud = {
  id: "11111111-1111-4111-8111-111111111111",
  numero: "SOL-0482",
  fechaAlta: "2026-10-12",
  estado: "pendiente",
  damnificado: { nombre: "Roberto Acosta", dni: "30123456", telefono: "1144445555" },
  siniestro: {
    tipo: "vivienda",
    fecha: "2026-10-12",
    hora: "15:07",
    direccion: "Av. Mitre 1250",
    numeroParte: "212",
    motivo: "Incendio de vivienda",
    localidad: "José C. Paz",
    partido: "José C. Paz",
    perdidas: "No se estiman",
  },
  constancia: { destino: "seguro", razonSocial: "SANCOR SEGUROS", numeroPoliza: "POL-1" },
};

const ruta = `/solicitudes/${pendiente.id}/editar`;

function tokenVigente(): string {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 60 }));
  return `header.${payload}.firma`;
}

function renderApp(path = ruta) {
  const history = createMemoryHistory({ initialEntries: [path] });
  render(<RouterProvider router={crearRouter(history)} />);
  return history;
}

beforeEach(() => {
  window.localStorage.clear();
  obtenerMock.mockReset();
  actualizarMock.mockReset();
});

describe("EditarSolicitudPage (US13)", () => {
  it("muestra el estado de carga", async () => {
    guardarToken(tokenVigente());
    obtenerMock.mockImplementation(() => new Promise(() => {}));

    renderApp();

    expect(await screen.findByRole("status")).toHaveTextContent("Cargando solicitud…");
  });

  it("muestra el error y permite reintentar", async () => {
    guardarToken(tokenVigente());
    obtenerMock.mockRejectedValueOnce(new ErrorApi(500, "El servidor tuvo un problema."));
    obtenerMock.mockResolvedValueOnce(pendiente);

    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByRole("heading", { name: "No pudimos cargar la solicitud" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByRole("heading", { name: "Editar solicitud" })).toBeInTheDocument();
    expect(obtenerMock).toHaveBeenCalledTimes(2);
  });

  it("avisa cuando la solicitud no existe", async () => {
    guardarToken(tokenVigente());
    obtenerMock.mockResolvedValue(null);

    renderApp();

    expect(await screen.findByRole("heading", { name: "No encontramos la solicitud" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a solicitudes" })).toBeInTheDocument();
  });

  it("bloquea la edición si la solicitud ya no está pendiente", async () => {
    guardarToken(tokenVigente());
    obtenerMock.mockResolvedValue({ ...pendiente, estado: "entregada" });

    renderApp();

    expect(await screen.findByRole("heading", { name: "Esta solicitud no se puede editar" })).toBeInTheDocument();
    expect(screen.getByText(/SOL-0482 está entregada/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar cambios" })).not.toBeInTheDocument();
  });

  it("precarga los datos y guarda los cambios", async () => {
    guardarToken(tokenVigente());
    obtenerMock.mockResolvedValue(pendiente);
    actualizarMock.mockResolvedValue({ ...pendiente, damnificado: { ...pendiente.damnificado, nombre: "Roberto Acosta" } });

    const history = renderApp();
    const user = userEvent.setup();

    expect(await screen.findByRole("heading", { name: "Editar solicitud" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nombre y apellido/)).toHaveValue("Roberto Acosta");
    expect(screen.getByLabelText(/^DNI/)).toHaveValue("30.123.456");

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(actualizarMock).toHaveBeenCalledTimes(1));
    expect(actualizarMock).toHaveBeenCalledWith(pendiente.id, expect.objectContaining({
      damnificado: expect.objectContaining({ nombre: "Roberto Acosta", dni: "30123456" }),
    }));
    await waitFor(() => expect(history.location.pathname).toBe(`/solicitudes/${pendiente.id}`));
  });

  it("cancelar vuelve al detalle", async () => {
    guardarToken(tokenVigente());
    obtenerMock.mockResolvedValue(pendiente);

    const history = renderApp();
    const user = userEvent.setup();

    await screen.findByRole("heading", { name: "Editar solicitud" });
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(history.location.pathname).toBe(`/solicitudes/${pendiente.id}`));
    expect(actualizarMock).not.toHaveBeenCalled();
  });
});
