import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearRouter } from "@/app/router";
import { restablecerContrasena, solicitarEnlaceRecuperacion } from "@/features/auth/api/authApi";
import {
  guardarEmailRecuperacion,
  leerTokenRecuperacion,
  marcarTokenRecuperacionUsado,
  tokenRecuperacionUsado,
} from "@/features/auth/recuperacion";
import { ErrorApi } from "@/lib/http";

vi.mock("@/features/auth/api/authApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth/api/authApi")>();
  return {
    ...actual,
    solicitarEnlaceRecuperacion: vi.fn(),
    restablecerContrasena: vi.fn(),
  };
});

const solicitarMock = vi.mocked(solicitarEnlaceRecuperacion);
const restablecerMock = vi.mocked(restablecerContrasena);

function crearToken(expEnSegundos = Math.floor(Date.now() / 1000) + 60 * 60): string {
  const payload = btoa(JSON.stringify({ exp: expEnSegundos }));
  return `header.${payload}.firma`;
}

function renderApp(path: string) {
  const router = crearRouter(createMemoryHistory({ initialEntries: [path] }));
  render(<RouterProvider router={router} />);
  return router;
}

function abrirEnlace(token: string) {
  window.history.replaceState(
    {},
    "",
    `/restablecer-contrasena#access_token=${encodeURIComponent(token)}&type=recovery`,
  );
  return renderApp("/restablecer-contrasena");
}

async function completarNuevaContrasena(nueva = "Cuartel2026", confirmar = "Cuartel2026") {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText("Nueva contraseña"), nueva);
  await user.type(screen.getByLabelText("Confirmar nueva contraseña"), confirmar);
  return user;
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});

afterEach(() => {
  window.history.replaceState({}, "", "/");
});

describe("RecuperarContrasenaPage", () => {
  it("el enlace del login lleva a recuperar la contraseña", async () => {
    renderApp("/login");

    await userEvent.click(
      await screen.findByRole("link", { name: "¿Olvidaste tu contraseña?" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Recuperá tu contraseña" }),
    ).toBeInTheDocument();
  });

  it("muestra el formato inválido sin llamar al back", async () => {
    renderApp("/recuperar-contrasena");
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Correo electrónico"), "no-es-correo");
    await user.click(screen.getByRole("button", { name: "Enviar enlace" }));

    expect(screen.getByText("Ingresá un correo válido.")).toBeInTheDocument();
    expect(solicitarMock).not.toHaveBeenCalled();
  });

  it("envía el enlace y muestra la confirmación", async () => {
    solicitarMock.mockResolvedValue({
      message: "Si el correo está registrado, recibirás un enlace en breve.",
    });

    renderApp("/recuperar-contrasena");
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Correo electrónico"), " IRios@Bomberos.org ");
    await user.click(screen.getByRole("button", { name: "Enviar enlace" }));

    expect(await screen.findByRole("heading", { name: "Revisá tu correo" })).toBeInTheDocument();
    expect(solicitarMock).toHaveBeenCalledWith("irios@bomberos.org");
  });

  it("muestra el estado enviando mientras espera", async () => {
    solicitarMock.mockReturnValue(new Promise(() => {}));

    renderApp("/recuperar-contrasena");
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Correo electrónico"), "irios@bomberos.org");
    await user.click(screen.getByRole("button", { name: "Enviar enlace" }));

    expect(screen.getByRole("button", { name: /Enviando/ })).toBeDisabled();
  });
});

describe("RecuperarEnviadoPage", () => {
  it("permite reenviar el enlace al correo guardado", async () => {
    guardarEmailRecuperacion("irios@bomberos.org");
    solicitarMock.mockResolvedValue({ message: "ok" });

    renderApp("/recuperar-contrasena/enviado");
    await userEvent.click(await screen.findByRole("button", { name: "Reenviar enlace" }));

    await waitFor(() => expect(solicitarMock).toHaveBeenCalledWith("irios@bomberos.org"));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Te enviamos un enlace nuevo. Revisá tu correo.",
    );
  });
});

describe("RestablecerContrasenaPage", () => {
  it("muestra el formulario cuando el enlace trae un token vigente", async () => {
    abrirEnlace(crearToken());

    expect(
      await screen.findByRole("heading", { name: "Creá tu nueva contraseña" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Mínimo 8 caracteres/)).toBeInTheDocument();
  });

  it("muestra el enlace inválido cuando no hay token", async () => {
    renderApp("/restablecer-contrasena");

    expect(
      await screen.findByRole("heading", { name: "El enlace ya no es válido" }),
    ).toBeInTheDocument();
  });

  it("muestra el enlace inválido cuando el token venció", async () => {
    abrirEnlace(crearToken(Math.floor(Date.now() / 1000) - 60));

    expect(
      await screen.findByRole("heading", { name: "El enlace ya no es válido" }),
    ).toBeInTheDocument();
  });

  it("muestra el enlace inválido cuando el token ya se usó", async () => {
    const token = crearToken();
    marcarTokenRecuperacionUsado(token);
    abrirEnlace(token);

    expect(
      await screen.findByRole("heading", { name: "El enlace ya no es válido" }),
    ).toBeInTheDocument();
  });

  it("avisa cuando las contraseñas no coinciden", async () => {
    abrirEnlace(crearToken());
    const user = await completarNuevaContrasena("Cuartel2026", "Cuartel2027");

    await user.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    expect(screen.getByText("Las contraseñas no coinciden.")).toBeInTheDocument();
    expect(restablecerMock).not.toHaveBeenCalled();
  });

  it("muestra el estado guardando mientras espera", async () => {
    restablecerMock.mockReturnValue(new Promise(() => {}));
    abrirEnlace(crearToken());
    const user = await completarNuevaContrasena();

    await user.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    expect(screen.getByRole("button", { name: /Guardando/ })).toBeDisabled();
  });

  it("restablece, inhabilita el token y muestra la confirmación", async () => {
    const token = crearToken();
    restablecerMock.mockResolvedValue({ message: "Contraseña actualizada correctamente." });
    abrirEnlace(token);
    const user = await completarNuevaContrasena();

    await user.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    expect(
      await screen.findByRole("heading", { name: "Contraseña restablecida" }),
    ).toBeInTheDocument();
    expect(restablecerMock).toHaveBeenCalledWith({
      token,
      newPassword: "Cuartel2026",
      confirmPassword: "Cuartel2026",
    });
    expect(leerTokenRecuperacion()).toBeNull();
    expect(tokenRecuperacionUsado(token)).toBe(true);
    expect(window.location.hash).toBe("");
  });

  it("muestra el aviso exacto cuando la nueva es igual a la anterior", async () => {
    restablecerMock.mockRejectedValue(
      new ErrorApi(400, "La contraseña nueva no puede ser igual a la anterior."),
    );
    abrirEnlace(crearToken());
    const user = await completarNuevaContrasena();

    await user.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    expect(
      await screen.findByText("La contraseña nueva no puede ser igual a la anterior"),
    ).toBeInTheDocument();
  });

  it("muestra el enlace inválido si el back lo rechaza y lo marca como usado", async () => {
    const token = crearToken();
    restablecerMock.mockRejectedValue(
      new ErrorApi(400, "El enlace ha expirado o ya fue utilizado. Por favor, solicita uno nuevo."),
    );
    abrirEnlace(token);
    const user = await completarNuevaContrasena();

    await user.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    expect(
      await screen.findByRole("heading", { name: "El enlace ya no es válido" }),
    ).toBeInTheDocument();
    expect(tokenRecuperacionUsado(token)).toBe(true);
  });
});
