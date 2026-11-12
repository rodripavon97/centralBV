import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearRouter } from "@/app/router";
import { guardarToken } from "@/features/auth/session";
import { ErrorApi } from "@/lib/http";
import type { Usuario } from "../domain/usuario";
import { actualizarUsuario, obtenerUsuario } from "../api/usuariosApi";

vi.mock("../api/usuariosApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/usuariosApi")>();
  return { ...actual, obtenerUsuario: vi.fn(), actualizarUsuario: vi.fn() };
});

const obtenerMock = vi.mocked(obtenerUsuario);
const actualizarMock = vi.mocked(actualizarUsuario);

const lucia: Usuario = {
  id: "u2",
  nombre: "Lucía",
  apellido: "Ríos",
  email: "lrios@bomberos.org",
  activo: true,
  roles: ["ADMINISTRATIVO", "COMUN"],
};

function tokenAdmin(): string {
  const payload = btoa(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 60, roles: ["ADMIN"] }),
  );
  return `header.${payload}.firma`;
}

function renderApp(path: string) {
  const history = createMemoryHistory({ initialEntries: [path] });
  render(<RouterProvider router={crearRouter(history)} />);
  return history;
}

beforeEach(() => {
  window.localStorage.clear();
  obtenerMock.mockReset();
  actualizarMock.mockReset();
});

describe("UsuarioFichaPage", () => {
  it("muestra el estado de carga", async () => {
    guardarToken(tokenAdmin());
    obtenerMock.mockImplementation(() => new Promise(() => {}));

    renderApp("/usuarios/u2");

    expect(await screen.findByRole("status")).toHaveTextContent("Cargando usuario…");
  });

  it("muestra el error de carga y reintenta", async () => {
    guardarToken(tokenAdmin());
    obtenerMock
      .mockRejectedValueOnce(new ErrorApi(500, "El servidor tuvo un problema."))
      .mockResolvedValueOnce(lucia);

    const user = userEvent.setup();
    renderApp("/usuarios/u2");

    expect(await screen.findByRole("heading", { name: "No pudimos cargar el usuario" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByRole("heading", { name: "Detalle del usuario" })).toBeInTheDocument();
  });

  it("avisa cuando el usuario no existe", async () => {
    guardarToken(tokenAdmin());
    // La API tipa el detalle como no nulo, pero la página cubre la respuesta vacía.
    obtenerMock.mockResolvedValue(null as unknown as Usuario);

    renderApp("/usuarios/u2");

    expect(await screen.findByRole("heading", { name: "No encontramos el usuario" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a usuarios" })).toBeInTheDocument();
  });

  it("en modo detalle muestra los datos en solo lectura y el acceso a editar", async () => {
    guardarToken(tokenAdmin());
    obtenerMock.mockResolvedValue(lucia);

    renderApp("/usuarios/u2");

    expect(await screen.findByRole("heading", { name: "Detalle del usuario" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nombre/)).toHaveValue("Lucía");
    expect(screen.getByLabelText(/^Nombre/)).toBeDisabled();
    expect(screen.getByLabelText(/^Correo electrónico/)).toBeDisabled();
    expect(screen.getByLabelText(/^Rol/)).toBeDisabled();
    expect(screen.getByLabelText(/^Rol/)).toHaveValue("administrativo");
    expect(screen.queryByLabelText(/^Contraseña temporal/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Editar" })).toHaveAttribute("href", "/usuarios/u2/editar");
    expect(screen.queryByRole("button", { name: "Guardar cambios" })).not.toBeInTheDocument();
  });

  it("en modo edición guarda los cambios y vuelve al detalle", async () => {
    guardarToken(tokenAdmin());
    obtenerMock.mockResolvedValue(lucia);
    actualizarMock.mockResolvedValue({ ...lucia, nombre: "Lucía María" });

    const history = renderApp("/usuarios/u2/editar");
    const user = userEvent.setup();

    expect(await screen.findByRole("heading", { name: "Editar usuario" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Contraseña temporal/)).not.toBeInTheDocument();

    const nombre = screen.getByLabelText(/^Nombre/);
    await user.clear(nombre);
    await user.type(nombre, "Lucía María");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(actualizarMock).toHaveBeenCalledTimes(1));
    expect(actualizarMock).toHaveBeenCalledWith("u2", {
      nombre: "Lucía María",
      apellido: "Ríos",
      email: "lrios@bomberos.org",
      roleName: "administrativo",
    });
    await waitFor(() => expect(history.location.pathname).toBe("/usuarios/u2"));
  });

  it("cancelar la edición vuelve al listado sin guardar", async () => {
    guardarToken(tokenAdmin());
    obtenerMock.mockResolvedValue(lucia);

    const history = renderApp("/usuarios/u2/editar");
    const user = userEvent.setup();

    await screen.findByRole("heading", { name: "Editar usuario" });
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(history.location.pathname).toBe("/usuarios"));
    expect(actualizarMock).not.toHaveBeenCalled();
  });

  it("muestra el error al guardar sin perder los datos", async () => {
    guardarToken(tokenAdmin());
    obtenerMock.mockResolvedValue(lucia);
    actualizarMock.mockRejectedValue(new ErrorApi(500, "No pudimos guardar el usuario."));

    renderApp("/usuarios/u2/editar");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos guardar el usuario.");
    expect(screen.getByLabelText(/^Nombre/)).toHaveValue("Lucía");
  });

  it("marca el correo duplicado y enfoca el campo email", async () => {
    guardarToken(tokenAdmin());
    obtenerMock.mockResolvedValue(lucia);
    actualizarMock.mockRejectedValue(new ErrorApi(409, "El correo ya está en uso"));

    renderApp("/usuarios/u2/editar");
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("El correo ya está en uso")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Correo electrónico/)).toHaveFocus();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
