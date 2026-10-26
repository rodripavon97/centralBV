import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearRouter } from "@/app/router";
import { guardarToken } from "@/features/auth/session";
import type { Solicitud } from "@/types/dominio";
import { obtenerSolicitud, registrarPago } from "../api/solicitudesApi";

vi.mock("../api/solicitudesApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/solicitudesApi")>();
  return { ...actual, obtenerSolicitud: vi.fn(), registrarPago: vi.fn() };
});

const obtenerMock = vi.mocked(obtenerSolicitud);
const pagoMock = vi.mocked(registrarPago);

const base: Solicitud = {
  id: "11111111-1111-4111-8111-111111111111",
  numero: "SOL-0482",
  fechaAlta: "2026-10-12",
  estado: "firmada",
  damnificado: { nombre: "Roberto Acosta", dni: "30123456" },
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

const abonada: Solicitud = {
  ...base,
  abono: { estado: "abonado", monto: 12000, metodoPago: "transferencia", fechaPago: "2026-10-12T13:00:00Z" },
};

function tokenVigente(): string {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 60 }));
  return `header.${payload}.firma`;
}

function renderApp() {
  const router = crearRouter(createMemoryHistory({ initialEntries: [`/solicitudes/${base.id}`] }));
  render(<RouterProvider router={router} />);
}

beforeEach(() => {
  // jsdom no implementa el <dialog> modal.
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  window.localStorage.clear();
  guardarToken(tokenVigente());
  obtenerMock.mockReset();
  pagoMock.mockReset();
});

describe("SolicitudDetallePage · arancel (US14)", () => {
  it("firmada con arancel pendiente muestra el aviso de entrega bloqueada", async () => {
    obtenerMock.mockResolvedValue(base);

    renderApp();

    const arancel = await screen.findByRole("region", { name: "Arancel" });
    expect(within(arancel).getByText("Pendiente")).toBeInTheDocument();
    expect(within(arancel).getByRole("button", { name: "Registrar pago" })).toBeInTheDocument();
    expect(screen.getByText(/Entrega bloqueada: el arancel figura como pendiente/)).toBeInTheDocument();
  });

  it("con el pago registrado muestra monto y método, sin aviso, y permite modificarlo", async () => {
    obtenerMock.mockResolvedValue(abonada);

    renderApp();

    const arancel = await screen.findByRole("region", { name: "Arancel" });
    expect(within(arancel).getByText("Abonado")).toBeInTheDocument();
    expect(within(arancel).getByText("$ 12.000")).toBeInTheDocument();
    expect(within(arancel).getByText("Transferencia")).toBeInTheDocument();
    expect(within(arancel).getByRole("button", { name: "Modificar pago" })).toBeInTheDocument();
    expect(screen.queryByText(/Entrega bloqueada/)).not.toBeInTheDocument();
  });

  it("un pago exento muestra su motivo", async () => {
    obtenerMock.mockResolvedValue({
      ...base,
      abono: { estado: "exento", motivoExento: "Acción social", fechaPago: "2026-10-12T13:00:00Z" },
    });

    renderApp();

    const arancel = await screen.findByRole("region", { name: "Arancel" });
    expect(within(arancel).getByText("Exento")).toBeInTheDocument();
    expect(within(arancel).getByText("Acción social")).toBeInTheDocument();
  });

  it("no deja registrar el pago en solicitudes entregadas y no lo muestra en canceladas", async () => {
    obtenerMock.mockResolvedValue({ ...abonada, estado: "entregada" });
    renderApp();
    const arancel = await screen.findByRole("region", { name: "Arancel" });
    expect(within(arancel).queryByRole("button")).not.toBeInTheDocument();
  });

  it("no muestra el arancel si la solicitud está cancelada", async () => {
    obtenerMock.mockResolvedValue({ ...base, estado: "cancelada", motivoCancelacion: "Duplicada" });
    renderApp();
    await screen.findByText("Solicitud cancelada");
    expect(screen.queryByRole("region", { name: "Arancel" })).not.toBeInTheDocument();
  });

  it("valida el modal y guarda el pago abonado", async () => {
    obtenerMock.mockResolvedValue(base);
    pagoMock.mockResolvedValue(abonada);
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole("button", { name: "Registrar pago" }));
    const modal = await screen.findByRole("dialog", { name: "Registrar pago del arancel" });

    await user.click(within(modal).getByRole("button", { name: "Guardar pago" }));
    expect(within(modal).getByText("Ingresá el monto abonado")).toBeInTheDocument();
    expect(within(modal).getByText("Elegí el método de pago")).toBeInTheDocument();
    expect(pagoMock).not.toHaveBeenCalled();

    await user.type(within(modal).getByLabelText(/Monto abonado/), "12.000");
    await user.selectOptions(within(modal).getByLabelText(/Método de pago/), "transferencia");
    await user.click(within(modal).getByRole("button", { name: "Guardar pago" }));

    expect(pagoMock).toHaveBeenCalledWith(base.id, { estado: "abonado", monto: 12000, metodoPago: "transferencia" });
    expect(await screen.findByText("Pago guardado.")).toBeInTheDocument();
    expect(screen.queryByText(/Entrega bloqueada/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Modificar pago" })).toBeInTheDocument();
  });

  it("registra una exención pidiendo el motivo", async () => {
    obtenerMock.mockResolvedValue(base);
    pagoMock.mockResolvedValue({ ...base, abono: { estado: "exento", motivoExento: "Acción social", fechaPago: "x" } });
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole("button", { name: "Registrar pago" }));
    const modal = await screen.findByRole("dialog", { name: "Registrar pago del arancel" });
    await user.click(within(modal).getByLabelText("Exento"));
    await user.click(within(modal).getByRole("button", { name: "Guardar pago" }));
    expect(within(modal).getByText("Ingresá el motivo de la exención")).toBeInTheDocument();

    await user.type(within(modal).getByLabelText(/Motivo de la exención/), "Acción social");
    await user.click(within(modal).getByRole("button", { name: "Guardar pago" }));

    expect(pagoMock).toHaveBeenCalledWith(base.id, { estado: "exento", motivoExento: "Acción social" });
  });

  it("al modificar precarga el monto con miles y enfoca el estado vigente", async () => {
    obtenerMock.mockResolvedValue(abonada);
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole("button", { name: "Modificar pago" }));
    const modal = await screen.findByRole("dialog", { name: "Registrar pago del arancel" });
    expect(within(modal).getByLabelText(/Monto abonado/)).toHaveValue("12.000");
    expect(within(modal).getByLabelText("Abonado")).toHaveFocus();
  });

  it("formatea el monto con miles al salir del campo", async () => {
    obtenerMock.mockResolvedValue(base);
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole("button", { name: "Registrar pago" }));
    const modal = await screen.findByRole("dialog", { name: "Registrar pago del arancel" });
    const monto = within(modal).getByLabelText(/Monto abonado/);
    await user.type(monto, "15000");
    await user.tab();
    expect(monto).toHaveValue("15.000");
  });

  it("muestra el error del servidor dentro del modal", async () => {
    obtenerMock.mockResolvedValue(base);
    pagoMock.mockRejectedValue(new Error("No se puede registrar el abono de una solicitud cancelada o entregada"));
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole("button", { name: "Registrar pago" }));
    const modal = await screen.findByRole("dialog", { name: "Registrar pago del arancel" });
    await user.click(within(modal).getByLabelText("Pendiente"));
    await user.click(within(modal).getByRole("button", { name: "Guardar pago" }));

    expect(await within(modal).findByRole("alert")).toHaveTextContent(/cancelada o entregada/);
  });
});
