import { describe, expect, it } from "vitest";
import { validarBusquedaBuches, validarBusquedaFicha, validarBusquedaMoviles } from "./busquedaMoviles";

describe("validarBusquedaMoviles", () => {
  it("recorta la búsqueda y acepta páginas mayores a 1", () => {
    expect(validarBusquedaMoviles({ q: "  ae 012 ", pagina: "2" })).toEqual({ q: "ae 012", pagina: 2 });
  });

  it("descarta búsquedas vacías o de más de 80 caracteres y páginas inválidas", () => {
    expect(validarBusquedaMoviles({ q: "   ", pagina: "1" })).toEqual({ q: undefined, pagina: undefined });
    expect(validarBusquedaMoviles({ q: "x".repeat(81), pagina: "-3" })).toEqual({ q: undefined, pagina: undefined });
    expect(validarBusquedaMoviles({ q: 12 })).toEqual({ q: undefined, pagina: undefined });
  });
});

describe("validarBusquedaFicha", () => {
  const R = "66666666-6666-4666-8666-666666666666";

  it("acepta inventario y revisión", () => {
    expect(validarBusquedaFicha({ pestana: "inventario" })).toEqual({ pestana: "inventario", revision: undefined });
    expect(validarBusquedaFicha({ pestana: "revision" })).toEqual({ pestana: "revision", revision: undefined });
  });

  it("datos o un valor raro caen en la pestaña por defecto", () => {
    expect(validarBusquedaFicha({ pestana: "datos" })).toEqual({ pestana: undefined, revision: undefined });
    expect(validarBusquedaFicha({ pestana: "toString" })).toEqual({ pestana: undefined, revision: undefined });
    expect(validarBusquedaFicha({})).toEqual({ pestana: undefined, revision: undefined });
  });

  it("la revisión elegida solo vale en la pestaña Revisiones y con un id válido", () => {
    expect(validarBusquedaFicha({ pestana: "revision", revision: R })).toEqual({ pestana: "revision", revision: R });
    expect(validarBusquedaFicha({ pestana: "revision", revision: "abc" }).revision).toBeUndefined();
    expect(validarBusquedaFicha({ pestana: "inventario", revision: R }).revision).toBeUndefined();
  });

  it("el buche elegido solo vale en la pestaña Inventario y con un id válido", () => {
    expect(validarBusquedaFicha({ pestana: "inventario", buche: R }).buche).toBe(R);
    expect(validarBusquedaFicha({ pestana: "inventario", buche: "LC-1" }).buche).toBeUndefined();
    expect(validarBusquedaFicha({ pestana: "revision", buche: R }).buche).toBeUndefined();
  });
});

describe("validarBusquedaBuches", () => {
  it("acepta solo un id válido", () => {
    const R = "66666666-6666-4666-8666-666666666666";
    expect(validarBusquedaBuches({ buche: R })).toEqual({ buche: R });
    expect(validarBusquedaBuches({ buche: 3 })).toEqual({ buche: undefined });
  });
});
