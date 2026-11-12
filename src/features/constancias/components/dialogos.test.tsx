import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Solicitud } from "@/types/dominio";
import CancelarSolicitudDialog from "./CancelarSolicitudDialog";
import ImprimirConstanciaDialog from "./ImprimirConstanciaDialog";
import MarcarEntregadaDialog from "./MarcarEntregadaDialog";
import RegistrarPagoDialog from "./RegistrarPagoDialog";

export const solicitud: Solicitud = {
  id: "11111111-1111-4111-8111-111111111111",
  numero: "SOL-0482",
  fechaAlta: "2026-10-12",
  estado: "firmada",
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

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CancelarSolicitudDialog", () => {
  it("exige el motivo y confirma la cancelación", async () => {
    const onConfirmar = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<CancelarSolicitudDialog numero="SOL-0482" abierto onCerrar={vi.fn()} onConfirmar={onConfirmar} />);

    expect(screen.getByRole("heading", { name: /¿Cancelar la solicitud/ })).toBeInTheDocument();
    const confirmar = screen.getByRole("button", { name: "Sí, cancelar solicitud" });
    expect(confirmar).toBeDisabled();

    await user.type(screen.getByLabelText(/^Motivo de la cancelación/), "  El pedido no corresponde  ");
    await user.click(confirmar);

    await waitFor(() => expect(onConfirmar).toHaveBeenCalledWith("El pedido no corresponde"));
    expect(screen.getByLabelText(/^Motivo de la cancelación/)).toHaveValue("");
  });

  it("muestra el error y permite volver", async () => {
    const onCerrar = vi.fn();
    const onConfirmar = vi.fn().mockRejectedValue(new Error("La solicitud ya fue entregada"));
    const user = userEvent.setup();
    render(<CancelarSolicitudDialog numero="SOL-0482" abierto onCerrar={onCerrar} onConfirmar={onConfirmar} />);

    await user.type(screen.getByLabelText(/^Motivo de la cancelación/), "Motivo");
    await user.click(screen.getByRole("button", { name: "Sí, cancelar solicitud" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("La solicitud ya fue entregada");

    await user.click(screen.getByRole("button", { name: "Volver" }));
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });

  it("se cierra con Escape", () => {
    const onCerrar = vi.fn();
    render(<CancelarSolicitudDialog numero="SOL-0482" abierto onCerrar={onCerrar} onConfirmar={vi.fn()} />);

    fireEvent(screen.getByRole("dialog"), new Event("cancel", { bubbles: true }));
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });
});

describe("RegistrarPagoDialog (US14)", () => {
  it("precarga el pago abonado y normaliza el importe al salir", async () => {
    const user = userEvent.setup();
    render(
      <RegistrarPagoDialog
        solicitud={{ ...solicitud, abono: { estado: "abonado", monto: 12000, metodoPago: "transferencia", fechaPago: "2026-10-12T13:00:00Z" } }}
        abierto
        onCerrar={vi.fn()}
        onGuardar={vi.fn()}
      />,
    );

    expect(screen.getByRole("radio", { name: "Abonado" })).toBeChecked();
    const monto = screen.getByLabelText(/^Monto abonado/);
    expect(monto).toHaveValue("12.000");
    expect(screen.getByLabelText(/^Método de pago/)).toHaveValue("transferencia");

    await user.clear(monto);
    await user.type(monto, "15000");
    await user.tab();
    expect(monto).toHaveValue("15.000");
  });

  it("valida monto y método cuando el estado es abonado", async () => {
    const onGuardar = vi.fn();
    const user = userEvent.setup();
    render(<RegistrarPagoDialog solicitud={solicitud} abierto onCerrar={vi.fn()} onGuardar={onGuardar} />);

    await user.click(screen.getByRole("button", { name: "Guardar pago" }));

    expect(screen.getByText("Ingresá el monto abonado")).toBeInTheDocument();
    expect(screen.getByText("Elegí el método de pago")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Monto abonado/)).toHaveFocus();
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it("guarda un pago abonado con importe y método", async () => {
    const onGuardar = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<RegistrarPagoDialog solicitud={solicitud} abierto onCerrar={vi.fn()} onGuardar={onGuardar} />);

    await user.type(screen.getByLabelText(/^Monto abonado/), "12.500,50");
    await user.selectOptions(screen.getByLabelText(/^Método de pago/), "debito");
    await user.click(screen.getByRole("button", { name: "Guardar pago" }));

    await waitFor(() => expect(onGuardar).toHaveBeenCalledWith({
      estado: "abonado",
      monto: 12500.5,
      metodoPago: "debito",
    }));
  });

  it("pide el motivo cuando el pago es exento", async () => {
    const onGuardar = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<RegistrarPagoDialog solicitud={solicitud} abierto onCerrar={vi.fn()} onGuardar={onGuardar} />);

    await user.click(screen.getByRole("radio", { name: "Exento" }));
    expect(screen.queryByLabelText(/^Monto abonado/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Guardar pago" }));
    expect(screen.getByText("Ingresá el motivo de la exención")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^Motivo de la exención/), "Damnificado sin recursos");
    await user.click(screen.getByRole("button", { name: "Guardar pago" }));
    await waitFor(() => expect(onGuardar).toHaveBeenCalledWith({ estado: "exento", motivoExento: "Damnificado sin recursos" }));
  });

  it("permite volver el arancel a pendiente", async () => {
    const onGuardar = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<RegistrarPagoDialog solicitud={solicitud} abierto onCerrar={vi.fn()} onGuardar={onGuardar} />);

    await user.click(screen.getByRole("radio", { name: "Pendiente" }));
    expect(screen.getByText(/El arancel vuelve a figurar como pendiente/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Guardar pago" }));

    await waitFor(() => expect(onGuardar).toHaveBeenCalledWith({ estado: "pendiente" }));
  });

  it("muestra el error de la API y permite cancelar", async () => {
    const onCerrar = vi.fn();
    const onGuardar = vi.fn().mockRejectedValue(new Error("No se pudo registrar el pago"));
    const user = userEvent.setup();
    render(<RegistrarPagoDialog solicitud={solicitud} abierto onCerrar={onCerrar} onGuardar={onGuardar} />);

    await user.click(screen.getByRole("radio", { name: "Pendiente" }));
    await user.click(screen.getByRole("button", { name: "Guardar pago" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo registrar el pago");

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });
});

describe("MarcarEntregadaDialog (US12)", () => {
  it("precarga el damnificado y confirma la entrega", async () => {
    const onConfirmar = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<MarcarEntregadaDialog solicitud={solicitud} abierto onCerrar={vi.fn()} onConfirmar={onConfirmar} />);

    expect(screen.getByText(/N.º/)).toHaveTextContent("SOL-0482");
    expect(screen.getByLabelText(/^Retira/)).toHaveValue("Roberto Acosta");
    expect(screen.getByLabelText(/^DNI de quien retira/)).toHaveValue("30.123.456");

    await user.click(screen.getByRole("button", { name: "Confirmar entrega" }));

    await waitFor(() => expect(onConfirmar).toHaveBeenCalledWith({
      nombreCompleto: "Roberto Acosta",
      dni: "30123456",
    }));
  });

  it("valida los datos de quien retira", async () => {
    const user = userEvent.setup();
    render(<MarcarEntregadaDialog solicitud={solicitud} abierto onCerrar={vi.fn()} onConfirmar={vi.fn()} />);

    await user.clear(screen.getByLabelText(/^Retira/));
    await user.clear(screen.getByLabelText(/^DNI de quien retira/));
    await user.click(screen.getByRole("button", { name: "Confirmar entrega" }));

    expect(screen.getByText("Ingresá el nombre de quien retira")).toBeInTheDocument();
    expect(screen.getByText("Ingresá el DNI de quien retira")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Retira/)).toHaveFocus();
  });

  it("rechaza un DNI inválido", async () => {
    const user = userEvent.setup();
    render(<MarcarEntregadaDialog solicitud={solicitud} abierto onCerrar={vi.fn()} onConfirmar={vi.fn()} />);

    const dni = screen.getByLabelText(/^DNI de quien retira/);
    await user.clear(dni);
    await user.type(dni, "123");
    await user.click(screen.getByRole("button", { name: "Confirmar entrega" }));

    expect(screen.getByText("Ingresá un DNI válido (7 u 8 dígitos)")).toBeInTheDocument();
  });

  it("muestra el error y permite volver", async () => {
    const onCerrar = vi.fn();
    const onConfirmar = vi.fn().mockRejectedValue(new Error("Falta registrar el pago"));
    const user = userEvent.setup();
    render(<MarcarEntregadaDialog solicitud={solicitud} abierto onCerrar={onCerrar} onConfirmar={onConfirmar} />);

    await user.click(screen.getByRole("button", { name: "Confirmar entrega" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Falta registrar el pago");

    await user.click(screen.getByRole("button", { name: "Volver" }));
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });
});

describe("ImprimirConstanciaDialog", () => {
  it("muestra las 3 hojas y las opciones de impresión", () => {
    render(<ImprimirConstanciaDialog solicitud={solicitud} abierto onCerrar={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Imprimir" })).toBeInTheDocument();
    expect(screen.getByText("Hoja 1 · Archivo del cuartel")).toBeInTheDocument();
    expect(screen.getByText("Hoja 2 · Domiciliado")).toBeInTheDocument();
    expect(screen.getByText("Hoja 3 · Domiciliado (copia)")).toBeInTheDocument();
    expect(screen.getByLabelText("Destino")).toBeInTheDocument();
    expect(screen.getByLabelText("Páginas")).toBeInTheDocument();
    expect(document.getElementById("constancia-impresion")).toBeInTheDocument();
    expect(within(document.getElementById("constancia-impresion")!).getAllByText("CONSTANCIA DE SINIESTRO").length).toBe(3);
  });

  it("cierra y abre el diálogo de impresión del sistema", async () => {
    const onCerrar = vi.fn();
    const imprimir = vi.spyOn(window, "print").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<ImprimirConstanciaDialog solicitud={solicitud} observaciones="Texto adicional" abierto onCerrar={onCerrar} />);

    await user.click(screen.getByRole("button", { name: "Imprimir" }));

    expect(onCerrar).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(imprimir).toHaveBeenCalledTimes(1));
  });

  it("cancela sin imprimir", async () => {
    const onCerrar = vi.fn();
    const imprimir = vi.spyOn(window, "print").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<ImprimirConstanciaDialog solicitud={solicitud} abierto onCerrar={onCerrar} />);

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCerrar).toHaveBeenCalledTimes(1);
    expect(imprimir).not.toHaveBeenCalled();
  });
});
