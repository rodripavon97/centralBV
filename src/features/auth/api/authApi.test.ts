import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorApi, http } from "@/lib/http";
import {
  esErrorDeConfirmacion,
  esErrorDeContrasenaIgual,
  esErrorDeEnlace,
  iniciarSesion,
  restablecerContrasena,
  solicitarEnlaceRecuperacion,
} from "./authApi";

describe("iniciarSesion", () => {
  afterEach(() => vi.restoreAllMocks());

  it("devuelve el access_token que responde POST /auth/login del back", async () => {
    const post = vi.spyOn(http, "post").mockResolvedValue({
      data: {
        access_token: "header.payload.firma",
        user: { id: "u1", nombre: "Ivana", email: "irios@bomberos.org", roles: ["ADMINISTRATIVO"] },
      },
    });

    const respuesta = await iniciarSesion({ email: "irios@bomberos.org", password: "clave-segura" });

    expect(post).toHaveBeenCalledWith("/auth/login", { email: "irios@bomberos.org", password: "clave-segura" });
    expect(respuesta).toEqual({ token: "header.payload.firma" });
  });
});

describe("recuperación de contraseña", () => {
  afterEach(() => vi.restoreAllMocks());

  it("pide el enlace a POST /auth/forgot-password", async () => {
    const post = vi.spyOn(http, "post").mockResolvedValue({
      data: { message: "Si el correo está registrado, recibirás un enlace en breve." },
    });

    const respuesta = await solicitarEnlaceRecuperacion("irios@bomberos.org");

    expect(post).toHaveBeenCalledWith("/auth/forgot-password", { email: "irios@bomberos.org" });
    expect(respuesta.message).toContain("Si el correo está registrado");
  });

  it("restablece con POST /auth/reset-password y el token del enlace", async () => {
    const post = vi.spyOn(http, "post").mockResolvedValue({
      data: { message: "Contraseña actualizada correctamente." },
    });

    await restablecerContrasena({
      token: "header.payload.firma",
      newPassword: "Cuartel2026",
      confirmPassword: "Cuartel2026",
    });

    expect(post).toHaveBeenCalledWith("/auth/reset-password", {
      token: "header.payload.firma",
      newPassword: "Cuartel2026",
      confirmPassword: "Cuartel2026",
    });
  });

  it("reconoce los errores de enlace, contraseña igual y confirmación", () => {
    expect(
      esErrorDeEnlace(
        new ErrorApi(400, "El enlace ha expirado o ya fue utilizado. Por favor, solicita uno nuevo."),
      ),
    ).toBe(true);
    expect(
      esErrorDeContrasenaIgual(
        new ErrorApi(400, "La contraseña nueva no puede ser igual a la anterior."),
      ),
    ).toBe(true);
    expect(
      esErrorDeConfirmacion(new ErrorApi(400, "Las contraseñas no coinciden. Por favor, verifícalas.")),
    ).toBe(true);
    expect(esErrorDeEnlace(new ErrorApi(500, "Error del servidor"))).toBe(false);
  });
});
