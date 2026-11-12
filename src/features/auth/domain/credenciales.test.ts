import { describe, expect, it } from "vitest";
import { normalizarCredenciales, tieneErrores, validarCredenciales } from "./credenciales";

describe("credenciales", () => {
  it("normaliza el correo y conserva la contraseña", () => {
    expect(normalizarCredenciales({ email: "  IRios@Bomberos.ORG ", password: " Secreta1 " })).toEqual({
      email: "irios@bomberos.org",
      password: " Secreta1 ",
    });
  });

  it("exige correo y contraseña", () => {
    expect(validarCredenciales({ email: "", password: "" })).toEqual({
      email: "Ingresá tu email.",
      password: "Ingresá tu contraseña.",
    });
  });

  it("rechaza un correo con formato inválido", () => {
    expect(validarCredenciales({ email: "irios", password: "Secreta1" })).toEqual({
      email: "Ingresá un email válido.",
    });
  });

  it("acepta credenciales válidas", () => {
    const errores = validarCredenciales({ email: "irios@bomberos.org", password: "Secreta1" });
    expect(errores).toEqual({});
    expect(tieneErrores(errores)).toBe(false);
  });

  it("detecta errores presentes", () => {
    expect(tieneErrores({ password: "Ingresá tu contraseña." })).toBe(true);
  });
});
