import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ahora,
  fechaAISO,
  fechaDesdeISO,
  formatearFecha,
  formatearHora,
  hoy,
  horaActual,
  parsearFecha,
  parsearHora,
} from "./fecha";

describe("fecha y hora", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("convierte entre texto dd/mm/aaaa e ISO", () => {
    expect(formatearFecha("2026-10-11")).toBe("11/10/2026");
    expect(parsearFecha("11/10/2026")).toBe("2026-10-11");
    expect(fechaAISO(new Date(2026, 9, 11))).toBe("2026-10-11");
    expect(fechaDesdeISO("2026-10-11")).toEqual(new Date(2026, 9, 11));
  });

  it("recorta los segundos de la hora", () => {
    expect(formatearHora("18:20:00")).toBe("18:20");
    expect(parsearHora("18:20")).toBe("18:20");
    expect(parsearHora("9:05")).toBe("09:05");
  });

  it("rechaza fechas y horas que no existen", () => {
    expect(parsearFecha("31/02/2026")).toBeNull();
    expect(parsearFecha("2026-10-11")).toBeNull();
    expect(parsearHora("24:00")).toBeNull();
    expect(parsearHora("9:5")).toBeNull();
    expect(fechaDesdeISO("2026-02-30")).toBeNull();
    expect(fechaDesdeISO("no es una fecha")).toBeNull();
  });

  it("usa la fecha y la hora local actuales", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 13, 9, 5));

    expect(hoy()).toBe("2026-11-13");
    expect(ahora()).toBe("2026-11-13T09:05");
    expect(horaActual()).toBe("09:05");
  });
});
