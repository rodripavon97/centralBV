import { describe, expect, it } from "vitest";
import { formatearMonto } from "./formato";
import { entregaBloqueada, estadoPagoDe, puedeRegistrarPago } from "./pago";
import {
  datosPagoDesdeValores,
  parsearMonto,
  validarPago,
  valoresPagoDesdeSolicitud,
  type ValoresPago,
} from "./validacionPago";

const valores = (v: Partial<ValoresPago>): ValoresPago => ({
  estado: "abonado",
  monto: "",
  metodoPago: "",
  motivoExento: "",
  ...v,
});

describe("pago", () => {
  it("sin abono el arancel figura pendiente", () => {
    expect(estadoPagoDe({})).toBe("pendiente");
    expect(estadoPagoDe({ abono: { estado: "exento", fechaPago: "2026-10-12T10:00:00Z" } })).toBe("exento");
  });

  it("permite registrar el pago salvo en solicitudes canceladas y entregadas", () => {
    expect(puedeRegistrarPago({ estado: "pendiente" })).toBe(true);
    expect(puedeRegistrarPago({ estado: "constancia_generada" })).toBe(true);
    expect(puedeRegistrarPago({ estado: "firmada" })).toBe(true);
    expect(puedeRegistrarPago({ estado: "cancelada" })).toBe(false);
    expect(puedeRegistrarPago({ estado: "entregada" })).toBe(false);
  });

  it("bloquea la entrega solo si está firmada y el arancel sigue pendiente", () => {
    expect(entregaBloqueada({ estado: "firmada" })).toBe(true);
    expect(entregaBloqueada({ estado: "firmada", abono: { estado: "abonado", fechaPago: "x" } })).toBe(false);
    expect(entregaBloqueada({ estado: "firmada", abono: { estado: "exento", fechaPago: "x" } })).toBe(false);
    expect(entregaBloqueada({ estado: "constancia_generada" })).toBe(false);
  });
});

describe("validarPago", () => {
  it("abonado exige monto y método", () => {
    expect(validarPago(valores({}))).toEqual({
      monto: "Ingresá el monto abonado",
      metodoPago: "Elegí el método de pago",
    });
  });

  it("rechaza montos en cero, negativos o con texto", () => {
    for (const monto of ["0", "-5", "abc", "10,555"]) {
      expect(validarPago(valores({ monto, metodoPago: "efectivo" })).monto).toMatch(/mayor a 0/);
    }
  });

  it("acepta un abono completo", () => {
    expect(validarPago(valores({ monto: "12.000", metodoPago: "transferencia" }))).toEqual({});
  });

  it("exento exige el motivo y no pide monto ni método", () => {
    expect(validarPago(valores({ estado: "exento" }))).toEqual({ motivoExento: "Ingresá el motivo de la exención" });
    expect(validarPago(valores({ estado: "exento", motivoExento: "Acción social" }))).toEqual({});
  });

  it("pendiente no pide nada", () => {
    expect(validarPago(valores({ estado: "pendiente" }))).toEqual({});
  });
});

describe("montos", () => {
  it("entiende los formatos argentinos", () => {
    expect(parsearMonto("12000")).toBe(12000);
    expect(parsearMonto("12.000")).toBe(12000);
    expect(parsearMonto("$ 12.000,50")).toBe(12000.5);
    expect(parsearMonto("1500.5")).toBe(1500.5);
    expect(parsearMonto("")).toBeNull();
  });

  it("los muestra con separador de miles", () => {
    expect(formatearMonto(12000)).toBe("$ 12.000");
    expect(formatearMonto(1500.5)).toBe("$ 1.500,50");
  });
});

describe("datos del pago", () => {
  it("arma el body según el estado", () => {
    expect(datosPagoDesdeValores(valores({ monto: "12.000", metodoPago: "debito" }))).toEqual({
      estado: "abonado",
      monto: 12000,
      metodoPago: "debito",
    });
    expect(datosPagoDesdeValores(valores({ estado: "exento", motivoExento: "  Acción social " }))).toEqual({
      estado: "exento",
      motivoExento: "Acción social",
    });
    expect(datosPagoDesdeValores(valores({ estado: "pendiente", monto: "5" }))).toEqual({ estado: "pendiente" });
  });

  it("precarga el pago registrado para modificarlo", () => {
    expect(
      valoresPagoDesdeSolicitud({
        abono: { estado: "abonado", monto: 1500.5, metodoPago: "efectivo", fechaPago: "x" },
      }),
    ).toEqual({ estado: "abonado", monto: "1.500,50", metodoPago: "efectivo", motivoExento: "" });
    expect(
      valoresPagoDesdeSolicitud({
        abono: { estado: "abonado", monto: 12000, metodoPago: "transferencia", fechaPago: "x" },
      }).monto,
    ).toBe("12.000");
    expect(valoresPagoDesdeSolicitud({}).estado).toBe("abonado");
  });
});
