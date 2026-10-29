import { describe, expect, it } from "vitest";
import {
  VALORES_VACIOS,
  cumpleContrasena,
  datosDesdeValores,
  validarUsuario,
  type ValoresUsuario,
} from "./validacionUsuario";

const validos: ValoresUsuario = {
  nombre: "Carla",
  apellido: "Núñez",
  email: "cmunoz@bomberos.org",
  password: "Cuartel2026",
  rol: "comun",
};

describe("validacionUsuario", () => {
  it("acepta un usuario completo", () => {
    expect(validarUsuario(validos)).toEqual({});
  });

  it("exige nombre, apellido, correo, contraseña y rol", () => {
    expect(validarUsuario(VALORES_VACIOS)).toMatchObject({
      nombre: "Ingresá el nombre.",
      apellido: "Ingresá el apellido.",
      email: "Ingresá el correo electrónico.",
      password: "Ingresá una contraseña temporal.",
      rol: "Seleccioná un rol.",
    });
  });

  it("rechaza caracteres que el back no acepta en nombre y apellido", () => {
    const errores = validarUsuario({ ...validos, nombre: "Carla 2", apellido: "Núñez!" });
    expect(errores.nombre).toMatch(/solo puede contener letras/);
    expect(errores.apellido).toMatch(/solo puede contener letras/);
  });

  it("valida el formato del correo", () => {
    expect(validarUsuario({ ...validos, email: "cmunoz" }).email).toBe("Ingresá un correo electrónico válido.");
  });

  it("aplica las cuatro reglas de la contraseña temporal", () => {
    expect(cumpleContrasena("Cuartel2026")).toBe(true);
    expect(cumpleContrasena("corta1")).toBe(false);
    expect(cumpleContrasena("cuartel2026")).toBe(false);
    expect(cumpleContrasena("CUARTEL2026")).toBe(false);
    expect(cumpleContrasena("Cuartel")).toBe(false);
    expect(validarUsuario({ ...validos, password: "cuartel" }).password).toMatch(/8 caracteres o más/);
  });

  it("normaliza espacios y el correo antes de mandarlo al back", () => {
    expect(
      datosDesdeValores({
        ...validos,
        nombre: "  Carla ",
        apellido: " Núñez  ",
        email: " CMunoz@Bomberos.org ",
      }),
    ).toEqual({
      nombre: "Carla",
      apellido: "Núñez",
      email: "cmunoz@bomberos.org",
      password: "Cuartel2026",
      roleName: "comun",
    });
  });
});
