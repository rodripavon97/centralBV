import { describe, expect, it } from "vitest";
import { rutaInternaSegura } from "./volverA";

describe("rutaInternaSegura", () => {
  it("acepta paths internos con search y hash", () => {
    expect(rutaInternaSegura("/moviles/abc/revision")).toBe("/moviles/abc/revision");
    expect(rutaInternaSegura("/moviles/abc?pestana=revision")).toBe("/moviles/abc?pestana=revision");
    expect(rutaInternaSegura("/dashboard#seccion")).toBe("/dashboard#seccion");
  });

  it("rechaza orígenes externos y formas peligrosas", () => {
    expect(rutaInternaSegura("https://evil.example/phish")).toBeUndefined();
    expect(rutaInternaSegura("//evil.example/phish")).toBeUndefined();
    expect(rutaInternaSegura("/\\evil.example")).toBeUndefined();
    expect(rutaInternaSegura("moviles/abc")).toBeUndefined();
    expect(rutaInternaSegura("")).toBeUndefined();
    expect(rutaInternaSegura(null)).toBeUndefined();
  });
});
