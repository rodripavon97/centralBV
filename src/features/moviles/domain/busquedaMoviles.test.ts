import { describe, expect, it } from "vitest";
import { validarBusquedaFicha, validarBusquedaMoviles } from "./busquedaMoviles";

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
  it("acepta inventario y revisión", () => {
    expect(validarBusquedaFicha({ pestana: "inventario" })).toEqual({ pestana: "inventario" });
    expect(validarBusquedaFicha({ pestana: "revision" })).toEqual({ pestana: "revision" });
  });

  it("datos o un valor raro caen en la pestaña por defecto", () => {
    expect(validarBusquedaFicha({ pestana: "datos" })).toEqual({ pestana: undefined });
    expect(validarBusquedaFicha({ pestana: "toString" })).toEqual({ pestana: undefined });
    expect(validarBusquedaFicha({})).toEqual({ pestana: undefined });
  });
});
