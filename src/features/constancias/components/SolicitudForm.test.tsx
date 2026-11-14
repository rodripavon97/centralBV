import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SolicitudForm from "./SolicitudForm";
import type { DatosSolicitud } from "../domain/validacion";

async function completarFormulario(
  user: ReturnType<typeof userEvent.setup>,
  { fecha = "10/10/2026", hora = "18:20" }: { fecha?: string; hora?: string } = {},
) {
  await user.type(screen.getByLabelText(/^Nombre y apellido/), "  Lucía   Fernández ");
  await user.type(screen.getByLabelText(/^DNI/), "30.112.456");
  await user.type(screen.getByLabelText(/^Teléfono/), "11 5555-1234");
  await user.selectOptions(screen.getByLabelText(/^Tipo de siniestro/), "vivienda");
  await user.type(screen.getByLabelText(/^Fecha/), fecha);
  await user.type(screen.getByLabelText(/^Hora/), hora);
  await user.type(screen.getByLabelText(/^Domicilio del hecho/), "San Martín 450");
  await user.type(screen.getByLabelText(/^N.º de parte/), "P-1");
  await user.type(screen.getByLabelText(/^Motivo/), "Incendio de cocina");
  await user.type(screen.getByLabelText(/^Localidad/), "Morón");
  await user.type(screen.getByLabelText(/^Partido/), "Morón");
  await user.type(screen.getByLabelText(/^Pérdidas/), "Cocina y mobiliario");
  await user.selectOptions(screen.getByLabelText(/^Destino/), "accion_social");
  await user.type(screen.getByLabelText(/^Para ser presentado/), "Acción Social Morón");
}

describe("SolicitudForm", () => {
  it("muestra los campos condicionales según el tipo y el destino", async () => {
    const user = userEvent.setup();
    render(<SolicitudForm textoGuardar="Guardar solicitud" onGuardar={vi.fn()} onCancelar={vi.fn()} />);

    expect(screen.queryByLabelText(/^Patente del vehículo/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^N.º de póliza/)).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/^Tipo de siniestro/), "vehicular");
    await user.selectOptions(screen.getByLabelText(/^Destino/), "seguro");

    expect(screen.getByLabelText(/^Patente del vehículo/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^N.º de póliza/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/^Tipo de siniestro/), "vivienda");
    await user.selectOptions(screen.getByLabelText(/^Destino/), "accion_social");

    expect(screen.queryByLabelText(/^Patente del vehículo/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^N.º de póliza/)).not.toBeInTheDocument();
  });

  it("valida antes de guardar, enfoca el primer campo y no llama a onGuardar", async () => {
    const user = userEvent.setup();
    const onGuardar = vi.fn();
    render(<SolicitudForm textoGuardar="Guardar solicitud" onGuardar={onGuardar} onCancelar={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Guardar solicitud" }));

    expect(onGuardar).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/Revisá \d+ campos? antes de guardar/);
    expect(screen.getByLabelText(/^Nombre y apellido/)).toHaveFocus();
    expect(screen.getAllByText("Este campo es obligatorio").length).toBeGreaterThan(0);

    await user.type(screen.getByLabelText(/^Teléfono/), "12345");
    expect(screen.getByText("Ingresá un teléfono válido (10 dígitos)")).toBeInTheDocument();
  });

  it("no deja guardar una hora futura si el siniestro es de hoy", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 10, 13, 14, 30));

    try {
      const user = userEvent.setup();
      const onGuardar = vi.fn();
      render(<SolicitudForm textoGuardar="Guardar solicitud" onGuardar={onGuardar} onCancelar={vi.fn()} />);

      await completarFormulario(user, { fecha: "13/11/2026", hora: "14:31" });
      await user.click(screen.getByRole("button", { name: "Guardar solicitud" }));

      expect(onGuardar).not.toHaveBeenCalled();
      expect(screen.getByText("La hora no puede ser posterior a la hora actual")).toBeInTheDocument();
      expect(screen.getByLabelText(/^Hora/)).toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });

  it("envía los datos normalizados cuando el formulario es válido", async () => {
    const user = userEvent.setup();
    const onGuardar = vi.fn<(datos: DatosSolicitud) => Promise<void>>().mockResolvedValue(undefined);
    render(<SolicitudForm textoGuardar="Guardar solicitud" onGuardar={onGuardar} onCancelar={vi.fn()} />);

    await completarFormulario(user);
    await user.click(screen.getByRole("button", { name: "Guardar solicitud" }));

    await waitFor(() => expect(onGuardar).toHaveBeenCalledTimes(1));
    expect(onGuardar).toHaveBeenCalledWith({
      damnificado: {
        nombre: "Lucía Fernández",
        dni: "30112456",
        telefono: "11 5555-1234",
      },
      siniestro: {
        tipo: "vivienda",
        fecha: "2026-10-10",
        hora: "18:20",
        direccion: "San Martín 450",
        numeroParte: "P-1",
        motivo: "Incendio de cocina",
        localidad: "Morón",
        partido: "Morón",
        perdidas: "Cocina y mobiliario",
        patenteVehiculo: undefined,
      },
      constancia: {
        destino: "accion_social",
        razonSocial: "Acción Social Morón",
        numeroPoliza: undefined,
      },
    });
  });

  it("incluye patente y póliza cuando corresponden", async () => {
    const user = userEvent.setup();
    const onGuardar = vi.fn<(datos: DatosSolicitud) => Promise<void>>().mockResolvedValue(undefined);
    render(<SolicitudForm textoGuardar="Guardar cambios" onGuardar={onGuardar} onCancelar={vi.fn()} />);

    await completarFormulario(user);
    await user.selectOptions(screen.getByLabelText(/^Tipo de siniestro/), "vehicular");
    await user.type(screen.getByLabelText(/^Patente del vehículo/), "ab 123 cd");
    await user.selectOptions(screen.getByLabelText(/^Destino/), "seguro");
    await user.type(screen.getByLabelText(/^N.º de póliza/), "POL-99");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(onGuardar).toHaveBeenCalledTimes(1));
    const datos = onGuardar.mock.calls[0][0];
    expect(datos.siniestro.patenteVehiculo).toBe("AB 123 CD");
    expect(datos.constancia).toEqual({
      destino: "seguro",
      razonSocial: "Acción Social Morón",
      numeroPoliza: "POL-99",
    });
  });

  it("muestra el error de guardado y vuelve a habilitar el botón", async () => {
    const user = userEvent.setup();
    const onGuardar = vi.fn().mockRejectedValue(new Error("No se pudo guardar la solicitud"));
    render(<SolicitudForm textoGuardar="Guardar solicitud" onGuardar={onGuardar} onCancelar={vi.fn()} />);

    await completarFormulario(user);
    await user.click(screen.getByRole("button", { name: "Guardar solicitud" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo guardar la solicitud");
    expect(screen.getByRole("button", { name: "Guardar solicitud" })).toBeEnabled();
  });

  it("muestra el estado inicial en el alta y avisa al cancelar", async () => {
    const user = userEvent.setup();
    const onCancelar = vi.fn();
    render(
      <SolicitudForm
        textoGuardar="Guardar solicitud"
        mostrarEstadoInicial
        onGuardar={vi.fn()}
        onCancelar={onCancelar}
      />,
    );

    expect(screen.getByText("Estado inicial")).toBeInTheDocument();
    expect(screen.getByText("Pendiente")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancelar).toHaveBeenCalledTimes(1);
  });

  it("no permite ingresar letras en DNI ni en teléfono", async () => {
    const user = userEvent.setup();
    render(<SolicitudForm textoGuardar="Guardar solicitud" onGuardar={vi.fn()} onCancelar={vi.fn()} />);

    const inputDni = screen.getByLabelText(/^DNI/);
    await user.type(inputDni, "30abc112def.456");
    expect(inputDni).toHaveValue("30112.456");

    const inputTel = screen.getByLabelText(/^Teléfono/);
    await user.type(inputTel, "11abc 5555-def1234");
    expect(inputTel).toHaveValue("11 5555-1234");
  });
});
