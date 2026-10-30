import { render, screen, within } from "@testing-library/react";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearRouter } from "@/app/router";
import { guardarToken } from "@/features/auth/session";
import { ErrorApi } from "@/lib/http";
import { listarHistorial, listarSolicitudes } from "../api/solicitudesApi";

vi.mock("../api/solicitudesApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/solicitudesApi")>();
  return { ...actual, listarSolicitudes: vi.fn(), listarHistorial: vi.fn() };
});

const listarMock = vi.mocked(listarSolicitudes);
const historialMock = vi.mocked(listarHistorial);

function tokenVigente(): string {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 60 }));
  return `header.${payload}.firma`;
}

function renderApp(path: string) {
  const router = crearRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<RouterProvider router={router} />);
}

beforeEach(() => {
  window.localStorage.clear();
  listarMock.mockReset();
  historialMock.mockReset();
});

describe("SolicitudesPage (US09)", () => {
  it("sin sesión manda al login", async () => {
    renderApp("/solicitudes");
    expect(await screen.findByRole("heading", { name: "Ingresar a CentralBV" })).toBeInTheDocument();
    expect(listarMock).not.toHaveBeenCalled();
  });

  it("lista las solicitudes con el filtro que viene en la URL", async () => {
    guardarToken(tokenVigente());
    listarMock.mockResolvedValue({
      items: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          numero: "SOL-0001",
          fechaAlta: "2026-10-11",
          estado: "pendiente",
          damnificado: { nombre: "Lucía Fernández", dni: "30112456" },
          siniestro: {
            tipo: "vivienda",
            fecha: "2026-10-11",
            hora: "18:20",
            direccion: "San Martín 450",
            numeroParte: "P-1",
            motivo: "Incendio de cocina",
            localidad: "Morón",
            partido: "Morón",
            perdidas: "Cocina",
          },
          constancia: { destino: "accion_social", razonSocial: "Acción Social Morón" },
        },
      ],
      total: 1,
      pagina: 1,
      paginas: 1,
    });

    renderApp("/solicitudes?estado=pendiente");

    const fila = (await screen.findByRole("link", { name: "SOL-0001" })).closest("tr")!;
    expect(within(fila).getByText("30.112.456")).toBeInTheDocument();
    expect(within(fila).getByText("Pendiente")).toBeInTheDocument();
    expect(screen.getByText("1 solicitud")).toBeInTheDocument();
    expect(listarMock).toHaveBeenCalledWith({ busqueda: "", estado: "pendiente", orden: "desc", pagina: 1 });
  });

  it("descarta los filtros inválidos de la URL", async () => {
    guardarToken(tokenVigente());
    listarMock.mockResolvedValue({ items: [], total: 0, pagina: 1, paginas: 0 });

    renderApp("/solicitudes?estado=roto&orden=cualquiera&pagina=-3&q=%20%20");

    await screen.findByRole("heading", { name: "Solicitudes" });
    expect(listarMock).toHaveBeenCalledWith({ busqueda: "", estado: undefined, orden: "desc", pagina: 1 });
  });

  it("muestra el historial de entregadas con quién retiró y cuándo (US47)", async () => {
    guardarToken(tokenVigente());
    historialMock.mockResolvedValue({
      items: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          numero: "SOL-0007",
          fechaAlta: "2026-10-12",
          estado: "entregada",
          damnificado: { nombre: "Roberto Acosta", dni: "30123456" },
          siniestro: {
            tipo: "vivienda",
            fecha: "2026-10-12",
            hora: "10:00",
            direccion: "Av. Mitre 1250",
            numeroParte: "212",
            motivo: "Incendio de vivienda",
            localidad: "José C. Paz",
            partido: "José C. Paz",
            perdidas: "No se estiman",
          },
          constancia: { destino: "seguro", razonSocial: "Sancor Seguros", numeroPoliza: "1" },
          // 14:05 UTC son las 11:05 en Argentina.
          retiradoEn: "2026-10-17T14:05:00+00:00",
          retiradoPorNombre: "Roberto Acosta",
          retiradoPorDni: "30123456",
        },
      ],
      total: 1,
      pagina: 1,
      paginas: 1,
    });

    renderApp("/solicitudes?vista=historial&estado=pendiente");

    const fila = (await screen.findByRole("link", { name: "SOL-0007" })).closest("tr")!;
    expect(within(fila).getByText("Entregada")).toBeInTheDocument();
    expect(within(fila).getByText("17/10/2026 11:05")).toBeInTheDocument();
    expect(within(fila).getByText("DNI 30.123.456")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Historial" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("combobox", { name: "Filtrar por estado" })).not.toBeInTheDocument();
    expect(historialMock).toHaveBeenCalledWith({ busqueda: "", orden: "desc", pagina: 1 });
    expect(listarMock).not.toHaveBeenCalled();
  });

  it("avisa cuando el historial está vacío", async () => {
    guardarToken(tokenVigente());
    historialMock.mockResolvedValue({ items: [], total: 0, pagina: 1, paginas: 0 });

    renderApp("/solicitudes?vista=historial");

    expect(await screen.findByRole("heading", { name: "El historial está vacío" })).toBeInTheDocument();
  });

  it("avisa cuando el usuario no tiene el rol Administrativo", async () => {
    guardarToken(tokenVigente());
    listarMock.mockRejectedValue(new ErrorApi(403, "No tienes permisos suficientes para esta acción"));

    renderApp("/solicitudes");

    expect(await screen.findByRole("heading", { name: "No tenés acceso a las solicitudes" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Nueva solicitud/ })).not.toBeInTheDocument();
  });
});
