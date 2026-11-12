import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearRouter } from "@/app/router";
import { guardarToken } from "@/features/auth/session";
import type { Solicitud } from "@/types/dominio";
import { crearSolicitud, listarSolicitudes } from "../api/solicitudesApi";

vi.mock("../api/solicitudesApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/solicitudesApi")>();
  return { ...actual, crearSolicitud: vi.fn(), listarSolicitudes: vi.fn() };
});

const crearMock = vi.mocked(crearSolicitud);
const listarMock = vi.mocked(listarSolicitudes);

const creada: Solicitud = {
  id: "11111111-1111-4111-8111-111111111111",
  numero: "SOL-0009",
  fechaAlta: "2026-10-20",
  estado: "pendiente",
  damnificado: { nombre: "Lucía Fernández", dni: "30112456", telefono: "1155551234" },
  siniestro: {
    tipo: "vivienda",
    fecha: "2026-10-20",
    hora: "18:20",
    direccion: "San Martín 450",
    numeroParte: "P-1",
    motivo: "Incendio de cocina",
    localidad: "Morón",
    partido: "Morón",
    perdidas: "Cocina y mobiliario",
  },
  constancia: { destino: "accion_social", razonSocial: "Acción Social Morón" },
};

function tokenVigente(): string {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 60 }));
  return `header.${payload}.firma`;
}

function renderApp(path: string) {
  const history = createMemoryHistory({ initialEntries: [path] });
  render(<RouterProvider router={crearRouter(history)} />);
  return history;
}

async function completarFormulario(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Nombre y apellido/), "Lucía Fernández");
  await user.type(screen.getByLabelText(/^DNI/), "30112456");
  await user.type(screen.getByLabelText(/^Teléfono/), "1155551234");
  await user.selectOptions(screen.getByLabelText(/^Tipo de siniestro/), "vivienda");
  await user.type(screen.getByLabelText(/^Fecha/), "20/10/2026");
  await user.type(screen.getByLabelText(/^Hora/), "18:20");
  await user.type(screen.getByLabelText(/^Domicilio del hecho/), "San Martín 450");
  await user.type(screen.getByLabelText(/^N.º de parte/), "P-1");
  await user.type(screen.getByLabelText(/^Motivo/), "Incendio de cocina");
  await user.type(screen.getByLabelText(/^Localidad/), "Morón");
  await user.type(screen.getByLabelText(/^Partido/), "Morón");
  await user.type(screen.getByLabelText(/^Pérdidas/), "Cocina y mobiliario");
  await user.selectOptions(screen.getByLabelText(/^Destino/), "accion_social");
  await user.type(screen.getByLabelText(/^Para ser presentado/), "Acción Social Morón");
}

beforeEach(() => {
  window.localStorage.clear();
  crearMock.mockReset();
  listarMock.mockReset();
  listarMock.mockResolvedValue({ items: [], total: 0, pagina: 1, paginas: 0 });
});

describe("NuevaSolicitudPage (US08)", () => {
  it("sin sesión redirige al login", async () => {
    renderApp("/solicitudes/nueva");
    expect(await screen.findByRole("heading", { name: "Ingresar a CentralBV" })).toBeInTheDocument();
    expect(crearMock).not.toHaveBeenCalled();
  });

  it("crea la solicitud y vuelve a la lista con el número creado", async () => {
    guardarToken(tokenVigente());
    crearMock.mockResolvedValue(creada);
    const history = renderApp("/solicitudes/nueva");
    const user = userEvent.setup();

    expect(await screen.findByRole("heading", { name: "Nueva solicitud" })).toBeInTheDocument();
    expect(screen.getByText("Estado inicial")).toBeInTheDocument();

    await completarFormulario(user);
    await user.click(screen.getByRole("button", { name: "Guardar solicitud" }));

    await waitFor(() => expect(crearMock).toHaveBeenCalledTimes(1));
    expect(crearMock).toHaveBeenCalledWith(
      expect.objectContaining({
        damnificado: { nombre: "Lucía Fernández", dni: "30112456", telefono: "1155551234" },
        constancia: { destino: "accion_social", razonSocial: "Acción Social Morón", numeroPoliza: undefined },
      }),
    );
    await waitFor(() => expect(history.location.pathname).toBe("/solicitudes"));
    expect(history.location.state).toMatchObject({ creada: "SOL-0009" });
  });

  it("muestra el error de la API y permanece en el formulario", async () => {
    guardarToken(tokenVigente());
    crearMock.mockRejectedValue(new Error("El servidor tuvo un problema. Intentá de nuevo."));
    const history = renderApp("/solicitudes/nueva");
    const user = userEvent.setup();

    await screen.findByRole("heading", { name: "Nueva solicitud" });
    await completarFormulario(user);
    await user.click(screen.getByRole("button", { name: "Guardar solicitud" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("El servidor tuvo un problema");
    expect(history.location.pathname).toBe("/solicitudes/nueva");
  });

  it("cancelar vuelve a la lista sin guardar", async () => {
    guardarToken(tokenVigente());
    const history = renderApp("/solicitudes/nueva");
    const user = userEvent.setup();

    await screen.findByRole("heading", { name: "Nueva solicitud" });
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(history.location.pathname).toBe("/solicitudes"));
    expect(crearMock).not.toHaveBeenCalled();
  });
});
