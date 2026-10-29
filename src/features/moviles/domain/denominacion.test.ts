import { describe, expect, it } from "vitest";
import { normalizarDenominacion } from "./denominacion";

/* Mismos casos que src/fleet/__tests__/denomination.spec.ts del back. */
describe("normalizarDenominacion", () => {
  it.each([
    ["m1", "M-1"],
    ["M 1", "M-1"],
    ["m-1", "M-1"],
    [" M_12 ", "M-12"],
    ["ab-04", "AB-04"],
    ["móvil 7", "MOVIL-7"],
  ])("%s → %s", (entrada, esperado) => {
    expect(normalizarDenominacion(entrada)).toBe(esperado);
  });

  it("lo que no es letras + número queda en mayúsculas", () => {
    expect(normalizarDenominacion("  unidad   rescate ")).toBe("UNIDAD RESCATE");
  });
});
