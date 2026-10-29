import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearRouter } from "@/app/router";
import { guardarToken } from "@/features/auth/session";
import { ErrorApi } from "@/lib/http";
import { crearUsuario, listarUsuarios, reenviarBienvenida } from "../api/usuariosApi";

vi.mock("../api/usuariosApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/usuariosApi")>();
  return {
    ...actual,
    listarUsuarios: vi.fn(),
    crearUsuario: vi.fn(),
    reenviarBienvenida: vi.fn(),
  };
});

const listarMock = vi.mocked(listarUsuarios);
const crearMock = vi.mocked(crearUsuario);
const reenviarMock = vi.mocked(reenviarBienvenida);

const ana = {
  id: "u1",
  nombre: "Ana",
  apellido: "Gómez",
  email: "agomez@bomberos.org",
  activo: true,
  roles: ["ADMIN"],
};

const lucia = {
  id: "u2",
  nombre: "Lucía",
  apellido: "Ríos",
  email: "lrios@bomberos.org",
  activo: true,
  roles: ["ADMINISTRATIVO", "COMUN"],
};

function tokenConRoles(roles: string[]): string {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 60, roles }));
  return `header.${payload}.firma`;
}

function renderApp(path: string) {
  const router = crearRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<RouterProvider router={router} />);
  return router;
}

async function completarFormulario() {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText(/Nombre/), "Carla");
  await user.type(screen.getByLabelText(/Apellido/), "Núñez");
  await user.type(screen.getByLabelText(/Correo electrónico/), " CMunoz@Bomberos.org ");
  await user.type(screen.getByLabelText(/Contraseña temporal/), "Cuartel2026");
  await user.selectOptions(screen.getByLabelText(/Rol/), "comun");
  return user;
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("UsuariosPage", () => {
  it("lista los usuarios con su rol y el estado del correo de bienvenida", async () => {
    guardarToken(tokenConRoles(["ADMIN"]));
    listarMock.mockResolvedValue({ items: [ana, lucia], total: 2 });

    renderApp("/usuarios");

    expect(await screen.findByText("Ana Gómez")).toBeInTheDocument();
    expect(screen.getByText("2 usuarios")).toBeInTheDocument();
    expect(screen.getByText("Administrador general")).toBeInTheDocument();
    expect(screen.getByText("Administrativo")).toBeInTheDocument();
    expect(screen.getAllByText("Enviado")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Reenviar" })).toHaveLength(2);
  });

  it("reenvía el correo de bienvenida y muestra el aviso", async () => {
    guardarToken(tokenConRoles(["ADMIN"]));
    listarMock.mockResolvedValue({ items: [lucia], total: 1 });
    reenviarMock.mockResolvedValue(undefined);

    renderApp("/usuarios");
    await userEvent.click(await screen.findByRole("button", { name: "Reenviar" }));

    await waitFor(() => expect(reenviarMock).toHaveBeenCalledWith("u2"));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Correo de bienvenida reenviado a lrios@bomberos.org",
      ),
    );
  });

  it("oculta el aviso de usuario creado a los 5 segundos", async () => {
    guardarToken(tokenConRoles(["ADMIN"]));
    listarMock.mockResolvedValue({ items: [], total: 0 });

    const router = renderApp("/usuarios");
    expect(await screen.findByRole("heading", { name: "Todavía no hay usuarios" })).toBeInTheDocument();

    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
    await router.navigate({ to: "/usuarios", state: { usuarioCreado: "cmunoz@bomberos.org" } });

    expect(await screen.findByRole("status")).toHaveTextContent("cmunoz@bomberos.org");

    const aviso = setTimeoutSpy.mock.calls.find(([, ms]) => ms === 5000);
    expect(aviso).toBeDefined();

    await act(async () => {
      (aviso![0] as () => void)();
      await Promise.resolve();
    });

    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    expect(router.state.location.state.usuarioCreado).toBeUndefined();

    setTimeoutSpy.mockRestore();
  });

  it("muestra el error de carga y permite reintentar", async () => {
    guardarToken(tokenConRoles(["ADMIN"]));
    listarMock
      .mockRejectedValueOnce(new ErrorApi(500, "El servidor tuvo un problema."))
      .mockResolvedValueOnce({ items: [], total: 0 });

    renderApp("/usuarios");

    expect(await screen.findByRole("heading", { name: "No pudimos cargar los usuarios" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByRole("heading", { name: "Todavía no hay usuarios" })).toBeInTheDocument();
    expect(listarMock).toHaveBeenCalledTimes(2);
  });

  it("avisa cuando el usuario no es administrador", async () => {
    guardarToken(tokenConRoles(["ADMINISTRATIVO"]));

    renderApp("/usuarios");

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(listarMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument();
  });
});

describe("NuevoUsuarioPage", () => {
  it("muestra los errores del formulario vacío", async () => {
    guardarToken(tokenConRoles(["ADMIN"]));
    renderApp("/usuarios/nuevo");

    await userEvent.click(await screen.findByRole("button", { name: "Agregar usuario" }));

    expect(screen.getByText("Ingresá el nombre.")).toBeInTheDocument();
    expect(screen.getByText("Ingresá el apellido.")).toBeInTheDocument();
    expect(screen.getByText("Ingresá el correo electrónico.")).toBeInTheDocument();
    expect(screen.getByText("Ingresá una contraseña temporal.")).toBeInTheDocument();
    expect(screen.getByText("Seleccioná un rol.")).toBeInTheDocument();
    expect(screen.getByText("Revisá 5 campos antes de guardar.")).toBeInTheDocument();
    expect(crearMock).not.toHaveBeenCalled();
  });

  it("crea el usuario y vuelve al listado con el aviso de bienvenida", async () => {
    guardarToken(tokenConRoles(["ADMIN"]));
    listarMock.mockResolvedValue({ items: [], total: 0 });
    crearMock.mockResolvedValue({ message: "Usuario creado exitosamente", userId: "u3" });

    const router = renderApp("/usuarios/nuevo");
    const user = await completarFormulario();
    await user.click(screen.getByRole("button", { name: "Agregar usuario" }));

    await waitFor(() =>
      expect(crearMock).toHaveBeenCalledWith({
        nombre: "Carla",
        apellido: "Núñez",
        email: "cmunoz@bomberos.org",
        password: "Cuartel2026",
        roleName: "comun",
      }),
    );
    expect(router.state.location.pathname).toBe("/usuarios");

    const correo = await screen.findByText("cmunoz@bomberos.org");
    expect(correo.closest('[role="status"]')).toHaveTextContent("Usuario creado. Enviamos el correo de bienvenida a");
  });

  it("muestra el error del back cuando el correo ya existe", async () => {
    guardarToken(tokenConRoles(["ADMIN"]));
    crearMock.mockRejectedValue(new ErrorApi(409, "El correo electrónico ya está registrado en el sistema"));

    renderApp("/usuarios/nuevo");
    const user = await completarFormulario();
    await user.click(screen.getByRole("button", { name: "Agregar usuario" }));

    expect(
      await screen.findByText("El correo electrónico ya está registrado en el sistema"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar usuario" })).toBeEnabled();
  });
});
