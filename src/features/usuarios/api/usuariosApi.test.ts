import { afterEach, describe, expect, it, vi } from "vitest";
import { http } from "@/lib/http";
import { crearUsuario, listarUsuarios, reenviarBienvenida } from "./usuariosApi";

describe("usuariosApi", () => {
  afterEach(() => vi.restoreAllMocks());

  it("lista los usuarios del findAll y normaliza los roles", async () => {
    const get = vi.spyOn(http, "get").mockResolvedValue({
      data: {
        items: [
          {
            id: "u1",
            email: "agomez@bomberos.org",
            nombre: "Ana",
            apellido: "Gómez",
            activo: true,
            roles: ["ADMIN"],
          },
          {
            id: "u2",
            email: "lrios@bomberos.org",
            nombre: "Lucía",
            apellido: "Ríos",
            activo: true,
          },
        ],
        total: 2,
        pagina: 1,
        paginas: 1,
        porPagina: 10,
      },
    });

    const pagina = await listarUsuarios();

    expect(get).toHaveBeenCalledWith("/users");
    expect(pagina.total).toBe(2);
    expect(pagina.items[0]).toMatchObject({ email: "agomez@bomberos.org", roles: ["ADMIN"] });
    expect(pagina.items[1].roles).toEqual([]);
  });

  it("crea el usuario con el cuerpo que espera el back", async () => {
    const post = vi.spyOn(http, "post").mockResolvedValue({
      data: { message: "Usuario creado exitosamente", userId: "u3" },
    });

    await crearUsuario({
      nombre: "Carla",
      apellido: "Núñez",
      email: "cmunoz@bomberos.org",
      password: "Cuartel2026",
      roleName: "comun",
    });

    expect(post).toHaveBeenCalledWith("/users", {
      nombre: "Carla",
      apellido: "Núñez",
      email: "cmunoz@bomberos.org",
      password: "Cuartel2026",
      roleName: "comun",
    });
  });

  it("reenvía el correo de bienvenida del usuario", async () => {
    const post = vi.spyOn(http, "post").mockResolvedValue({ data: { message: "ok" } });

    await reenviarBienvenida("u 1");

    expect(post).toHaveBeenCalledWith("/users/u%201/reenviar-bienvenida");
  });
});
