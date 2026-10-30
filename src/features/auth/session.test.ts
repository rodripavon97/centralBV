import { afterEach, describe, expect, it } from "vitest";
import { tokenDePrueba } from "@/test/token";
import { guardarToken, leerRoles, tieneRol } from "./session";

describe("roles de la sesión", () => {
  afterEach(() => window.localStorage.clear());

  it("lee los roles del token", () => {
    guardarToken(tokenDePrueba(["AUTOMOTORES"]));
    expect(leerRoles()).toEqual(["AUTOMOTORES"]);
    expect(tieneRol("AUTOMOTORES")).toBe(true);
    expect(tieneRol("ADMINISTRATIVO")).toBe(false);
  });

  it("ADMIN tiene control total", () => {
    guardarToken(tokenDePrueba(["ADMIN"]));
    expect(tieneRol("AUTOMOTORES")).toBe(true);
  });

  it("sin sesión no hay roles", () => {
    expect(leerRoles()).toEqual([]);
    expect(tieneRol("AUTOMOTORES")).toBe(false);
  });
});
