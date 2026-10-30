import { describe, expect, it } from "vitest";
import { paginaEquivalente, paginar, validarBusquedaFlota } from "./flota";

const TIPO = "11111111-1111-4111-8111-111111111111";

describe("validarBusquedaFlota", () => {
  it("acepta estado, tipo y página válidos", () => {
    expect(validarBusquedaFlota({ estado: "mantenimiento", tipo: TIPO, pagina: "3" })).toEqual({
      estado: "mantenimiento",
      tipo: TIPO,
      pagina: 3,
    });
  });

  it("descarta valores inválidos pero devuelve todas las claves", () => {
    expect(validarBusquedaFlota({ estado: "toString", tipo: "abc", pagina: "-2" })).toEqual({
      estado: undefined,
      tipo: undefined,
      pagina: undefined,
    });
  });

  it("no acepta la baja definitiva ni la página 1", () => {
    expect(validarBusquedaFlota({ estado: "baja_definitiva", pagina: 1 })).toEqual({
      estado: undefined,
      tipo: undefined,
      pagina: undefined,
    });
  });
});

describe("paginar", () => {
  const lista = Array.from({ length: 16 }, (_, i) => i + 1);

  it("corta la página pedida y calcula el pie", () => {
    expect(paginar(lista, 2, 6)).toEqual({ items: [7, 8, 9, 10, 11, 12], pagina: 2, paginas: 3, desde: 7, hasta: 12, total: 16 });
  });

  it("una página que no existe pasa a ser la última", () => {
    expect(paginar(lista, 9, 12)).toMatchObject({ items: [13, 14, 15, 16], pagina: 2, desde: 13, hasta: 16 });
  });

  it("sin elementos queda en la página 1", () => {
    expect(paginar([], 3, 12)).toEqual({ items: [], pagina: 1, paginas: 1, desde: 0, hasta: 0, total: 0 });
  });
});

describe("paginaEquivalente", () => {
  it("sigue al primer móvil visible al cambiar la cantidad por página", () => {
    expect(paginaEquivalente(2, 12, 6)).toBe(3); // el 13.º pasa a la página 3
    expect(paginaEquivalente(3, 6, 12)).toBe(2); // el 13.º vuelve a la página 2
    expect(paginaEquivalente(1, 12, 6)).toBe(1);
  });
});
