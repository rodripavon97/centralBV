import { describe, expect, it } from "vitest";
import { urlRevisionMovil } from "./enlaceRevision";

describe("urlRevisionMovil", () => {
  it("arma la URL absoluta de la revisión del móvil", () => {
    expect(urlRevisionMovil("abc-123", "https://centralbv.example")).toBe(
      "https://centralbv.example/moviles/abc-123/revision",
    );
  });
});
