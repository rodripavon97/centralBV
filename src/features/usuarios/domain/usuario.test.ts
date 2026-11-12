import { describe, expect, it } from "vitest";
import { etiquetaRol, rolPrincipal } from "./usuario";

describe("roles de usuario", () => {
  it("elige el rol de mayor prioridad", () => {
    expect(rolPrincipal(["COMUN", "ADMINISTRATIVO"])).toBe("ADMINISTRATIVO");
    expect(rolPrincipal(["COMUN", "ADMIN"])).toBe("ADMIN");
    expect(rolPrincipal(["AUTOMOTORES"])).toBe("AUTOMOTORES");
  });

  it("usa el primer rol si ninguno es conocido", () => {
    expect(rolPrincipal(["SUPERVISOR", "LECTOR"])).toBe("SUPERVISOR");
    expect(rolPrincipal([])).toBe("");
  });

  it("traduce el rol a una etiqueta visible", () => {
    expect(etiquetaRol(["ADMIN"])).toBe("Administrador general");
    expect(etiquetaRol(["ADMINISTRATIVO"])).toBe("Administrativo");
    expect(etiquetaRol(["AUTOMOTORES"])).toBe("Administrador de móviles");
    expect(etiquetaRol(["COMUN"])).toBe("Inspector");
  });

  it("devuelve el identificador o Sin rol cuando no hay etiqueta", () => {
    expect(etiquetaRol(["SUPERVISOR"])).toBe("SUPERVISOR");
    expect(etiquetaRol([])).toBe("Sin rol");
  });
});
