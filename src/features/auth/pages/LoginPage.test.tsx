import { AxiosError } from "axios";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { crearRouter } from "@/app/router";
import { iniciarSesion } from "@/features/auth/api/authApi";
import { guardarToken, obtenerToken } from "@/features/auth/session";

vi.mock("@/features/auth/api/authApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth/api/authApi")>();
  return { ...actual, iniciarSesion: vi.fn() };
});

const iniciarSesionMock = vi.mocked(iniciarSesion);

function crearToken(expEnSegundos: number): string {
  const payload = btoa(JSON.stringify({ exp: expEnSegundos }));
  return `header.${payload}.firma`;
}

function tokenVigente(): string {
  return crearToken(Math.floor(Date.now() / 1000) + 60 * 60);
}

function tokenVencido(): string {
  return crearToken(Math.floor(Date.now() / 1000) - 60 * 60);
}

function errorCredenciales(): AxiosError {
  const error = new AxiosError("Unauthorized");
  Object.assign(error, { response: { status: 401 } });
  return error;
}

async function renderApp(path: string) {
  const router = crearRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<RouterProvider router={router} />);
  await screen.findByRole("heading", { name: "Ingresar a CentralBV" });
}

async function completarCredenciales() {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText("Correo electrónico"), "irios@bomberos.org");
  await user.type(screen.getByLabelText("Contraseña"), "clave-segura");
  return user;
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("LoginPage", () => {
  it("redirige al login y avisa cuando la sesión está vencida", async () => {
    guardarToken(tokenVencido());

    await renderApp("/dashboard");

    expect(screen.getByRole("heading", { name: "Ingresar a CentralBV" })).toBeInTheDocument();
    expect(
      screen.getByText("Tu sesión expiró por seguridad. Volvé a ingresar."),
    ).toBeInTheDocument();
    expect(obtenerToken()).toBeNull();
  });

  it("ingresa al dashboard cuando las credenciales son válidas", async () => {
    const token = tokenVigente();
    iniciarSesionMock.mockResolvedValue({ token });

    await renderApp("/login");
    const user = await completarCredenciales();
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(obtenerToken()).toBe(token);
    expect(iniciarSesionMock).toHaveBeenCalledWith({
      email: "irios@bomberos.org",
      password: "clave-segura",
    });
  });

  it("muestra y oculta la contraseña", async () => {
    await renderApp("/login");
    const user = userEvent.setup();
    const contrasena = screen.getByLabelText("Contraseña");

    expect(contrasena).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Ver contraseña" }));
    expect(contrasena).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Ocultar contraseña" }));
    expect(contrasena).toHaveAttribute("type", "password");
  });

  it("muestra el error cuando el usuario o la contraseña son incorrectos", async () => {
    iniciarSesionMock.mockRejectedValue(errorCredenciales());

    await renderApp("/login");
    const user = await completarCredenciales();
    await user.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(
      await screen.findByText("Usuario o contraseña incorrectos"),
    ).toBeInTheDocument();
    expect(obtenerToken()).toBeNull();
  });
});
