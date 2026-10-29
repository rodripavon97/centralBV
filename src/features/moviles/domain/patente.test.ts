import { describe, expect, it } from "vitest";
import { esPatenteConocida, formatearPatente, normalizarPatente } from "./patente";

/* Mismos casos que src/fleet/__tests__/license-plate.spec.ts del back. */
describe("patente", () => {
  it("normaliza a mayúsculas, sin espacios, guiones, puntos ni acentos", () => {
    expect(normalizarPatente(" ab 123-cd ")).toBe("AB123CD");
    expect(normalizarPatente("a.b.c 123")).toBe("ABC123");
    expect(normalizarPatente("áb123cd")).toBe("AB123CD");
    expect(normalizarPatente(" - . ")).toBe("");
  });

  it.each([
    ["ab123cd", "AB 123 CD"],
    ["abc123", "ABC 123"],
    ["a123bcd", "A 123 BCD"],
    ["123abc", "123 ABC"],
    ["b1234567", "B 1234567"],
  ])("formatea %s como %s", (entrada, esperado) => {
    expect(formatearPatente(entrada)).toBe(esperado);
    expect(esPatenteConocida(entrada)).toBe(true);
  });

  it("un formato desconocido queda en su forma canónica", () => {
    expect(formatearPatente("bv-01")).toBe("BV01");
    expect(esPatenteConocida("BV01")).toBe(false);
  });
});
