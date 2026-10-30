import { describe, expect, it } from "vitest";
import {
  cumpleRequisitosContrasena,
  validarNuevaContrasena,
  validarSolicitudRecuperacion,
} from "./recuperacion";

describe("validarSolicitudRecuperacion", () => {
  it("pide el correo", () => {
    expect(validarSolicitudRecuperacion({ email: "  " })).toEqual({
      email: "Ingresá tu correo electrónico.",
    });
  });

  it("rechaza un formato inválido", () => {
    expect(validarSolicitudRecuperacion({ email: "no-es-correo" })).toEqual({
      email: "Ingresá un correo válido.",
    });
  });

  it("acepta un correo válido", () => {
    expect(validarSolicitudRecuperacion({ email: " IRios@Bomberos.org " })).toEqual({});
  });
});

describe("validarNuevaContrasena", () => {
  it("pide las dos contraseñas", () => {
    expect(validarNuevaContrasena({ nueva: "", confirmar: "" })).toEqual({
      nueva: "Ingresá una contraseña nueva.",
      confirmar: "Confirmá la nueva contraseña.",
    });
  });

  it("aplica los requisitos de US01", () => {
    expect(validarNuevaContrasena({ nueva: "corta", confirmar: "corta" }).nueva).toBe(
      "La contraseña debe tener 8 caracteres o más, una mayúscula, una minúscula y un número.",
    );
    expect(cumpleRequisitosContrasena("Cuartel2026")).toBe(true);
  });

  it("avisa cuando no coinciden", () => {
    expect(
      validarNuevaContrasena({ nueva: "Cuartel2026", confirmar: "Cuartel2027" }).confirmar,
    ).toBe("Las contraseñas no coinciden.");
  });

  it("acepta una contraseña válida y confirmada", () => {
    expect(validarNuevaContrasena({ nueva: "Cuartel2026", confirmar: "Cuartel2026" })).toEqual({});
  });
});
