import { render, screen, within } from "@testing-library/react";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearRouter } from "@/app/router";
import { guardarToken } from "@/features/auth/session";
import { ErrorApi } from "@/lib/http";
import { listarSolicitudes } from "../api/solicitudesApi";

vi.mock("../api/solicitudesApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/solicitudesApi")>();
  return { ...actual, listarSolicitudes: vi.fn() };
});

const listarMock = vi.mocked(listarSolicitudes);

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
          damnificado: { nombre: "Lucía", apellido: "Fernández", dni: "30112456" },
          siniestro: { tipo: "incendio_vivienda", fechaHora: "2026-10-11T18:20", lugar: "San Martín 450", descripcion: "x" },
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

  it("avisa cuando el usuario no tiene el rol Administrativo", async () => {
    guardarToken(tokenVigente());
    listarMock.mockRejectedValue(new ErrorApi(403, "No tienes permisos suficientes para esta acción"));

    renderApp("/solicitudes");

    expect(await screen.findByRole("heading", { name: "No tenés acceso a las solicitudes" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Nueva solicitud/ })).not.toBeInTheDocument();
  });
});
