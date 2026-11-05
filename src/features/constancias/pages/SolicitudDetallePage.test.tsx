import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearRouter } from "@/app/router";
import { guardarToken } from "@/features/auth/session";
import type { Solicitud } from "@/types/dominio";
import { listarSolicitudes, marcarEntregada, obtenerSolicitud, registrarPago } from "../api/solicitudesApi";

vi.mock("../api/solicitudesApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/solicitudesApi")>();
  return {
    ...actual,
    obtenerSolicitud: vi.fn(),
    registrarPago: vi.fn(),
    marcarEntregada: vi.fn(),
    listarSolicitudes: vi.fn(),
  };
});

const obtenerMock = vi.mocked(obtenerSolicitud);
const pagoMock = vi.mocked(registrarPago);
const entregarMock = vi.mocked(marcarEntregada);
const listarMock = vi.mocked(listarSolicitudes);

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
  entregarMock.mockReset();
  listarMock.mockReset();
});

describe("SolicitudDetallePage · entrega (US12)", () => {
  const entregada: Solicitud = {
    ...abonada,
    estado: "entregada",
    retiradoEn: "2026-10-17T14:05:00+00:00",
    retiradoPorNombre: "María López",
    retiradoPorDni: "30112456",
  };

  it("con el arancel pendiente el botón queda deshabilitado", async () => {
    obtenerMock.mockResolvedValue(base);

    renderApp();

    expect(await screen.findByRole("button", { name: "Marcar como entregada" })).toBeDisabled();
    expect(screen.getByText(/Entrega bloqueada/)).toBeInTheDocument();
  });

  it("con el arancel exento se puede entregar", async () => {
    obtenerMock.mockResolvedValue({ ...base, abono: { estado: "exento", motivoExento: "Acción social", fechaPago: "x" } });

    renderApp();

    expect(await screen.findByRole("button", { name: "Marcar como entregada" })).toBeEnabled();
  });

  it.each(["pendiente", "constancia_generada", "entregada", "cancelada"] as const)(
    "no ofrece entregar una solicitud en estado %s",
    async (estado) => {
      obtenerMock.mockResolvedValue({ ...abonada, estado });

      renderApp();

      await screen.findByRole("heading", { name: /Solicitud N.º/ });
      expect(screen.queryByRole("button", { name: "Marcar como entregada" })).not.toBeInTheDocument();
    },
  );

  it("confirma con los datos precargados y vuelve a la lista avisando que pasó al historial", async () => {
    obtenerMock.mockResolvedValue(abonada);
    entregarMock.mockResolvedValue(entregada);
    listarMock.mockResolvedValue({ items: [], total: 0, pagina: 1, paginas: 0 });
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole("button", { name: "Marcar como entregada" }));
    const modal = await screen.findByRole("dialog", { name: "Marcar como entregada" });
    expect(within(modal).getByLabelText(/^Retira/)).toHaveValue("Roberto Acosta");
    expect(within(modal).getByLabelText(/DNI de quien retira/)).toHaveValue("30.123.456");

    await user.click(within(modal).getByRole("button", { name: "Confirmar entrega" }));

    expect(entregarMock).toHaveBeenCalledWith(base.id, { nombreCompleto: "Roberto Acosta", dni: "30123456" });
    expect(await screen.findByText(/entregada\. Pasó al historial\./)).toHaveTextContent(
      "Solicitud N.º SOL-0482 entregada. Pasó al historial.",
    );
  });

  it("registra a otra persona si retira alguien distinto del damnificado", async () => {
    obtenerMock.mockResolvedValue(abonada);
    entregarMock.mockResolvedValue(entregada);
    listarMock.mockResolvedValue({ items: [], total: 0, pagina: 1, paginas: 0 });
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole("button", { name: "Marcar como entregada" }));
    const modal = await screen.findByRole("dialog", { name: "Marcar como entregada" });
    const nombre = within(modal).getByLabelText(/^Retira/);
    const dni = within(modal).getByLabelText(/DNI de quien retira/);
    await user.clear(nombre);
    await user.type(nombre, "María López");
    await user.clear(dni);
    await user.type(dni, "30112456");
    await user.click(within(modal).getByRole("button", { name: "Confirmar entrega" }));

    expect(entregarMock).toHaveBeenCalledWith(base.id, { nombreCompleto: "María López", dni: "30112456" });
  });

  it("no envía si faltan los datos de quien retira y marca el primer error", async () => {
    obtenerMock.mockResolvedValue(abonada);
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole("button", { name: "Marcar como entregada" }));
    const modal = await screen.findByRole("dialog", { name: "Marcar como entregada" });
    await user.clear(within(modal).getByLabelText(/^Retira/));
    await user.clear(within(modal).getByLabelText(/DNI de quien retira/));
    await user.click(within(modal).getByRole("button", { name: "Confirmar entrega" }));

    expect(within(modal).getByText("Ingresá el nombre de quien retira")).toBeInTheDocument();
    expect(within(modal).getByText("Ingresá el DNI de quien retira")).toBeInTheDocument();
    expect(within(modal).getByLabelText(/^Retira/)).toHaveFocus();
    expect(entregarMock).not.toHaveBeenCalled();
  });

  it("deja el modal abierto con el error si el back rechaza la entrega", async () => {
    obtenerMock.mockResolvedValue(abonada);
    entregarMock.mockRejectedValue(new Error("Solo se pueden entregar solicitudes firmadas con abono registrado"));
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole("button", { name: "Marcar como entregada" }));
    const modal = await screen.findByRole("dialog", { name: "Marcar como entregada" });
    await user.click(within(modal).getByRole("button", { name: "Confirmar entrega" }));

    expect(await within(modal).findByRole("alert")).toHaveTextContent(/firmadas con abono registrado/);
    expect(within(modal).getByRole("button", { name: "Confirmar entrega" })).toBeEnabled();
  });

  it("una solicitud entregada muestra cuándo y quién la retiró", async () => {
    obtenerMock.mockResolvedValue(entregada);

    renderApp();

    const cierre = await screen.findByRole("region", { name: "Cierre" });
    expect(within(cierre).getByText("17/10/2026 11:05")).toBeInTheDocument();
    expect(within(cierre).getByText("María López · DNI 30.112.456")).toBeInTheDocument();
  });
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
