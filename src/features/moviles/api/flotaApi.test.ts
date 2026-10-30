import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorApi, http } from "@/lib/http";
import {
  crearItem,
  crearModelo,
  crearMovil,
  eliminarItem,
  listarFlota,
  listarMarcas,
  listarModelos,
  listarMoviles,
  obtenerMovil,
  obtenerResumenFlota,
  renombrarItem,
} from "./flotaApi";

const movilApi = {
  id: "44444444-4444-4444-8444-444444444444",
  estado: "OPERATIVO" as const,
  patente: "AJ567ST",
  denominacion: "M-4",
  tipo: { id: "t1", valor: "Autobomba" },
  marca: { id: "m1", valor: "Mercedes-Benz" },
  modelo: { id: "mo1", valor: "Atego 1726", marcaId: "m1" },
};

const valores = { denominacion: " m4 ", patente: " aj 567 st ", tipoId: "t1", marcaId: "m1", modeloId: "mo1" };

function errorHttp(status: number, data: unknown) {
  return new AxiosError("error", "ERR", undefined, undefined, {
    status,
    data,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
  });
}

describe("flotaApi", () => {
  afterEach(() => vi.restoreAllMocks());

  it("lista móviles activos ordenados y traduce al formato del front", async () => {
    const get = vi.spyOn(http, "get").mockResolvedValue({ data: { items: [movilApi], total: 1 } });
    await expect(listarMoviles()).resolves.toEqual({
      items: [
        {
          id: movilApi.id,
          codigo: "M-4",
          patente: "AJ567ST",
          tipo: "Autobomba",
          marca: "Mercedes-Benz",
          modelo: "Atego 1726",
          estado: "operativo",
        },
      ],
      total: 1,
    });
    expect(get).toHaveBeenCalledWith("/flota/vehiculos", {
      params: { ordenPor: "denominacion", orden: "asc", pagina: 1, porPagina: 100 },
    });
  });

  it("crea un móvil sin confirmar la patente por defecto", async () => {
    const post = vi.spyOn(http, "post").mockResolvedValue({ data: movilApi });
    await crearMovil(valores);
    expect(post).toHaveBeenCalledWith("/flota/vehiculos", {
      denominacion: "m4",
      patente: "aj 567 st",
      tipoId: "t1",
      marcaId: "m1",
      modeloId: "mo1",
    });
  });

  it("manda confirmarPatenteEspecial cuando se confirma", async () => {
    const post = vi.spyOn(http, "post").mockResolvedValue({ data: movilApi });
    await crearMovil(valores, { confirmarPatenteEspecial: true });
    expect(post.mock.calls[0][1]).toEqual(expect.objectContaining({ confirmarPatenteEspecial: true }));
  });

  it("conserva campo y código de los errores por campo", async () => {
    vi.spyOn(http, "post").mockRejectedValue(
      errorHttp(409, { message: "Ya existe un móvil con esa patente", campo: "patente", code: "PATENTE_DUPLICADA" }),
    );
    const error = await crearMovil(valores).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ErrorApi);
    expect(error).toMatchObject({
      status: 409,
      message: "Ya existe un móvil con esa patente",
      campo: "patente",
      codigo: "PATENTE_DUPLICADA",
    });
  });

  it("traduce los catálogos con enUso", async () => {
    vi.spyOn(http, "get")
      .mockResolvedValueOnce({ data: [{ id: "m1", valor: "Ford", enUso: 2 }] })
      .mockResolvedValueOnce({ data: [{ id: "mo1", valor: "F-350", marcaId: "m1", enUso: 1 }] });
    await expect(listarMarcas()).resolves.toEqual([{ id: "m1", nombre: "Ford", enUso: 2 }]);
    await expect(listarModelos()).resolves.toEqual([{ id: "mo1", nombre: "F-350", marcaId: "m1", enUso: 1 }]);
  });

  it("crea, renombra y elimina ítems de catálogo con las rutas del back", async () => {
    const post = vi
      .spyOn(http, "post")
      .mockResolvedValueOnce({ data: { id: "m2", valor: "Scania" } })
      .mockResolvedValueOnce({ data: { id: "mo2", valor: "P320", marcaId: "m2" } });
    const patch = vi.spyOn(http, "patch").mockResolvedValue({ data: undefined });

    await expect(crearItem("marcas", " Scania ")).resolves.toEqual({ id: "m2", nombre: "Scania", enUso: 0 });
    expect(post).toHaveBeenCalledWith("/flota/catalogos/marcas", { valor: "Scania" });

    await crearModelo("P320", "m2");
    expect(post).toHaveBeenCalledWith("/flota/catalogos/modelos", { valor: "P320", marcaId: "m2" });

    await renombrarItem("tipos", "t1", "Autobomba ");
    expect(patch).toHaveBeenCalledWith("/flota/catalogos/tipos/t1", { valor: "Autobomba" });

    await eliminarItem("modelos", "mo2");
    expect(patch).toHaveBeenCalledWith("/flota/catalogos/modelos/mo2/desactivar");
  });

  it("lista la flota filtrada y la ordena en orden natural", async () => {
    const get = vi.spyOn(http, "get").mockResolvedValue({
      data: {
        items: [
          { ...movilApi, id: "a", denominacion: "M-10", estado: "MANTENIMIENTO" },
          { ...movilApi, id: "b", denominacion: "M-2" },
        ],
        total: 2,
      },
    });
    const flota = await listarFlota({ estado: "mantenimiento", tipoId: "t1" });
    expect(flota.map((m) => m.codigo)).toEqual(["M-2", "M-10"]);
    expect(flota[1].estado).toBe("mantenimiento");
    expect(get).toHaveBeenCalledWith("/flota/vehiculos", {
      params: { estado: "MANTENIMIENTO", tipoId: "t1", pagina: 1, porPagina: 100 },
    });
  });

  it("sin filtros no manda estado ni tipo", async () => {
    const get = vi.spyOn(http, "get").mockResolvedValue({ data: { items: [], total: 0 } });
    await listarFlota();
    expect(get).toHaveBeenCalledWith("/flota/vehiculos", { params: { pagina: 1, porPagina: 100 } });
  });

  it("traduce el resumen por estado y completa los que faltan con 0", async () => {
    const get = vi.spyOn(http, "get").mockResolvedValue({
      data: { total: 5, porEstado: { OPERATIVO: 3, OBSERVACIONES: 1, MANTENIMIENTO: 1 } },
    });
    await expect(obtenerResumenFlota()).resolves.toEqual({
      total: 5,
      porEstado: { operativo: 3, observaciones: 1, fuera_de_servicio: 0, mantenimiento: 1 },
    });
    expect(get).toHaveBeenCalledWith("/flota/vehiculos/resumen");
  });

  it("el resumen devuelve ErrorApi si falla", async () => {
    vi.spyOn(http, "get").mockRejectedValue(errorHttp(500, {}));
    await expect(obtenerResumenFlota()).rejects.toBeInstanceOf(ErrorApi);
  });

  it("manda la búsqueda recortada y la omite si está vacía (US06)", async () => {
    const get = vi.spyOn(http, "get").mockResolvedValue({ data: { items: [], total: 0 } });
    await listarMoviles({ busqueda: "  ae 012 " });
    expect(get).toHaveBeenLastCalledWith("/flota/vehiculos", {
      params: { busqueda: "ae 012", ordenPor: "denominacion", orden: "asc", pagina: 1, porPagina: 100 },
    });
    await listarMoviles({ busqueda: "   " });
    expect(get).toHaveBeenLastCalledWith("/flota/vehiculos", {
      params: { ordenPor: "denominacion", orden: "asc", pagina: 1, porPagina: 100 },
    });
  });

  it("obtiene un móvil por id, también dado de baja", async () => {
    const get = vi.spyOn(http, "get").mockResolvedValue({ data: { ...movilApi, estado: "BAJA_DEFINITIVA" } });
    await expect(obtenerMovil(movilApi.id)).resolves.toMatchObject({ codigo: "M-4", estado: "baja_definitiva" });
    expect(get).toHaveBeenCalledWith(`/flota/vehiculos/${movilApi.id}`);
  });

  it("obtenerMovil devuelve ErrorApi con el status del back", async () => {
    vi.spyOn(http, "get").mockRejectedValue(errorHttp(404, { message: "El vehículo de emergencia no existe" }));
    await expect(obtenerMovil("x")).rejects.toMatchObject({ status: 404 });
  });
});
