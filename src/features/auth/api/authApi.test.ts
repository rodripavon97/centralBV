import { afterEach, describe, expect, it, vi } from "vitest";
import { http } from "@/lib/http";
import { iniciarSesion } from "./authApi";

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
