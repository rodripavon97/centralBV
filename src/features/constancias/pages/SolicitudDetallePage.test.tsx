import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearRouter } from "@/app/router";
import { guardarToken } from "@/features/auth/session";
import type { Solicitud } from "@/types/dominio";
import {
  cancelarSolicitud,
  firmarSolicitud,
  listarSolicitudes,
  marcarEntregada,
  obtenerSolicitud,
  registrarPago,
} from "../api/solicitudesApi";

vi.mock("../api/solicitudesApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/solicitudesApi")>();
  return {
    ...actual,
    obtenerSolicitud: vi.fn(),
    registrarPago: vi.fn(),
    marcarEntregada: vi.fn(),
    firmarSolicitud: vi.fn(),
    cancelarSolicitud: vi.fn(),
    listarSolicitudes: vi.fn(),
  };
});

const obtenerMock = vi.mocked(obtenerSolicitud);
const pagoMock = vi.mocked(registrarPago);
const entregarMock = vi.mocked(marcarEntregada);
const firmarMock = vi.mocked(firmarSolicitud);
const cancelarMock = vi.mocked(cancelarSolicitud);
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

function renderApp(path = `/solicitudes/${base.id}`, state?: { editada?: boolean }) {
  const history = createMemoryHistory({ initialEntries: [path] });
  if (state) history.replace(path, state);
  render(<RouterProvider router={crearRouter(history)} />);
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
  firmarMock.mockReset();
  cancelarMock.mockReset();
  listarMock.mockReset();
});

describe("SolicitudDetallePage · carga", () => {
  it("muestra el estado de carga mientras llega la solicitud", async () => {
    obtenerMock.mockImplementation(() => new Promise(() => undefined));

    renderApp();

    expect(await screen.findByRole("status")).toHaveTextContent("Cargando solicitud…");
  });

  it("muestra el error de carga y permite reintentar", async () => {
    obtenerMock.mockRejectedValueOnce(new Error("red caída")).mockResolvedValueOnce(base);
    const user = userEvent.setup();
    renderApp();

    expect(await screen.findByText("No pudimos cargar la solicitud")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByRole("heading", { name: /Solicitud N.º/ })).toBeInTheDocument();
    expect(obtenerMock).toHaveBeenCalledTimes(2);
  });

  it("muestra el vacío si la solicitud no existe", async () => {
    obtenerMock.mockResolvedValue(null);

    renderApp();

    expect(await screen.findByText("No encontramos la solicitud")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a solicitudes" })).toBeInTheDocument();
  });

  it("avisa cuando se llega tras editar", async () => {
    obtenerMock.mockResolvedValue({ ...base, estado: "pendiente" });

    renderApp(`/solicitudes/${base.id}`, { editada: true });

    expect(await screen.findByText("Cambios guardados.")).toBeInTheDocument();
  });
});

describe("SolicitudDetallePage · firma (US44)", () => {
  it("con constancia generada ofrece marcar como firmada y Ver constancia secundario", async () => {
    obtenerMock.mockResolvedValue({ ...base, estado: "constancia_generada" });

    renderApp();

    expect(await screen.findByRole("button", { name: "Marcar como firmada" })).toBeEnabled();
    expect(screen.getByText(/constancia ya fue generada: no se puede editar ni cancelar/i)).toBeInTheDocument();
    const ver = screen.getByRole("link", { name: "Ver constancia" });
    expect(ver).not.toHaveClass("bg-accent-fill");
    expect(ver).toHaveClass("border-border-strong");
  });

  it("en entregada Ver constancia es el botón primario", async () => {
    obtenerMock.mockResolvedValue({ ...abonada, estado: "entregada" });

    renderApp();

    const ver = await screen.findByRole("link", { name: "Ver constancia" });
    expect(ver).toHaveClass("bg-accent-fill");
  });

  it("marca como firmada y pasa al layout de entrega", async () => {
    obtenerMock.mockResolvedValue({ ...base, estado: "constancia_generada" });
    firmarMock.mockResolvedValue({ ...base, estado: "firmada" });
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole("button", { name: "Marcar como firmada" }));

    expect(firmarMock).toHaveBeenCalledWith(base.id);
    expect(await screen.findByText("Constancia marcada como firmada. Ya se puede entregar.")).toBeInTheDocument();
    expect(screen.getByText("Firmada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Marcar como firmada" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Marcar como entregada" })).toBeInTheDocument();
  });

  it("muestra Marcando… mientras espera al back", async () => {
    obtenerMock.mockResolvedValue({ ...base, estado: "constancia_generada" });
    let resolver!: (s: Solicitud) => void;
    firmarMock.mockImplementation(() => new Promise((resolve) => {
      resolver = resolve;
    }));
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole("button", { name: "Marcar como firmada" }));

    expect(screen.getByRole("button", { name: "Marcando…" })).toBeDisabled();
    resolver({ ...base, estado: "firmada" });
    expect(await screen.findByText("Constancia marcada como firmada. Ya se puede entregar.")).toBeInTheDocument();
  });

  it("muestra el error si el back no deja firmar", async () => {
    obtenerMock.mockResolvedValue({ ...base, estado: "constancia_generada" });
    firmarMock.mockRejectedValue(new Error("La solicitud no se puede firmar"));
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole("button", { name: "Marcar como firmada" }));

    expect(await screen.findByText("La solicitud no se puede firmar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Marcar como firmada" })).toBeEnabled();
  });

  it("usa un mensaje genérico si el rechazo no es un Error", async () => {
    obtenerMock.mockResolvedValue({ ...base, estado: "constancia_generada" });
    firmarMock.mockRejectedValue("falló");
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole("button", { name: "Marcar como firmada" }));

    expect(await screen.findByText("No se pudo marcar como firmada")).toBeInTheDocument();
  });

  it("al reintentar limpia el error anterior y muestra el aviso de éxito", async () => {
    obtenerMock.mockResolvedValue({ ...base, estado: "constancia_generada" });
    firmarMock
      .mockRejectedValueOnce(new Error("La solicitud no se puede firmar"))
      .mockResolvedValueOnce({ ...base, estado: "firmada" });
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole("button", { name: "Marcar como firmada" }));
    expect(await screen.findByText("La solicitud no se puede firmar")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Marcar como firmada" }));

    expect(await screen.findByText("Constancia marcada como firmada. Ya se puede entregar.")).toBeInTheDocument();
    expect(screen.queryByText("La solicitud no se puede firmar")).not.toBeInTheDocument();
  });

  it.each(["pendiente", "firmada", "entregada", "cancelada"] as const)(
    "no ofrece firmar una solicitud en estado %s",
    async (estado) => {
      obtenerMock.mockResolvedValue({ ...abonada, estado });

      renderApp();

      await screen.findByRole("heading", { name: /Solicitud N.º/ });
      expect(screen.queryByRole("button", { name: "Marcar como firmada" })).not.toBeInTheDocument();
    },
  );
});

describe("SolicitudDetallePage · pendiente y cancelación (US13)", () => {
  it("en pendiente permite editar, generar y cancelar", async () => {
    obtenerMock.mockResolvedValue({ ...base, estado: "pendiente" });

    renderApp();

    expect(await screen.findByRole("link", { name: "Editar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generar constancia" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Cancelar solicitud" })).toBeEnabled();
    expect(screen.queryByRole("link", { name: "Ver constancia" })).not.toBeInTheDocument();
  });

  it("cancela la solicitud pendiente y muestra el motivo", async () => {
    obtenerMock.mockResolvedValue({ ...base, estado: "pendiente" });
    cancelarMock.mockResolvedValue({
      ...base,
      estado: "cancelada",
      motivoCancelacion: "Pedido duplicado",
    });
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole("button", { name: "Cancelar solicitud" }));
    const modal = await screen.findByRole("dialog", { name: /Cancelar la solicitud/ });
    await user.type(within(modal).getByLabelText(/Motivo de la cancelación/), "Pedido duplicado");
    await user.click(within(modal).getByRole("button", { name: "Sí, cancelar solicitud" }));

    expect(cancelarMock).toHaveBeenCalledWith(base.id, "Pedido duplicado");
    expect(await screen.findByText("Solicitud cancelada")).toBeInTheDocument();
    expect(screen.getByText(/Pedido duplicado/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar solicitud" })).toBeDisabled();
  });

  it("deja el modal abierto si el back rechaza la cancelación", async () => {
    obtenerMock.mockResolvedValue({ ...base, estado: "pendiente" });
    cancelarMock.mockRejectedValue(new Error("Solo se pueden cancelar solicitudes pendientes"));
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole("button", { name: "Cancelar solicitud" }));
    const modal = await screen.findByRole("dialog", { name: /Cancelar la solicitud/ });
    await user.type(within(modal).getByLabelText(/Motivo de la cancelación/), "Motivo");
    await user.click(within(modal).getByRole("button", { name: "Sí, cancelar solicitud" }));

    expect(await within(modal).findByRole("alert")).toHaveTextContent(/Solo se pueden cancelar/);
    expect(within(modal).getByRole("button", { name: "Sí, cancelar solicitud" })).toBeEnabled();
  });
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
