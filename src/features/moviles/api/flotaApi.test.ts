import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorApi, http } from "@/lib/http";
import {
  actualizarMovil,
  crearItem,
  crearModelo,
  crearMovil,
  darDeBajaMovil,
  eliminarItem,
  listarFlota,
  listarMarcas,
  listarModelos,
  listarMoviles,
  obtenerMovil,
  obtenerResumenFlota,
  listarRevisiones,
  obtenerRevision,
  registrarRevision,
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
          tipoId: "t1",
          marcaId: "m1",
          modeloId: "mo1",
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
    const get = vi.spyOn(http, "get").mockResolvedValue({
      data: { ...movilApi, estado: "BAJA_DEFINITIVA", motivoBaja: "Fin de vida útil" },
    });
    await expect(obtenerMovil(movilApi.id)).resolves.toMatchObject({
      codigo: "M-4",
      estado: "baja_definitiva",
      tipoId: "t1",
      marcaId: "m1",
      modeloId: "mo1",
      motivoBaja: "Fin de vida útil",
    });
    expect(get).toHaveBeenCalledWith(`/flota/vehiculos/${movilApi.id}`);
  });

  it("obtenerMovil devuelve ErrorApi con el status del back", async () => {
    vi.spyOn(http, "get").mockRejectedValue(errorHttp(404, { message: "El vehículo de emergencia no existe" }));
    await expect(obtenerMovil("x")).rejects.toMatchObject({ status: 404 });
  });

  it("actualiza los datos generales del móvil (US48)", async () => {
    const patch = vi.spyOn(http, "patch").mockResolvedValue({ data: { ...movilApi, denominacion: "M-5" } });
    await expect(actualizarMovil(movilApi.id, valores)).resolves.toMatchObject({
      codigo: "M-5",
      tipoId: "t1",
      marcaId: "m1",
      modeloId: "mo1",
    });
    expect(patch).toHaveBeenCalledWith(`/flota/vehiculos/${movilApi.id}`, {
      denominacion: "m4",
      patente: "aj 567 st",
      tipoId: "t1",
      marcaId: "m1",
      modeloId: "mo1",
    });
  });

  it("manda confirmarPatenteEspecial al actualizar si se confirma", async () => {
    const patch = vi.spyOn(http, "patch").mockResolvedValue({ data: movilApi });
    await actualizarMovil(movilApi.id, valores, { confirmarPatenteEspecial: true });
    expect(patch.mock.calls[0][1]).toEqual(expect.objectContaining({ confirmarPatenteEspecial: true }));
  });

  it("da de baja definitiva con el motivo recortado", async () => {
    const patch = vi.spyOn(http, "patch").mockResolvedValue({
      data: { ...movilApi, estado: "BAJA_DEFINITIVA", motivoBaja: "Fin de vida útil" },
    });
    await expect(darDeBajaMovil(movilApi.id, "  Fin de vida útil  ")).resolves.toMatchObject({
      estado: "baja_definitiva",
      motivoBaja: "Fin de vida útil",
    });
    expect(patch).toHaveBeenCalledWith(`/flota/vehiculos/${movilApi.id}/baja`, { motivo: "Fin de vida útil" });
  });

  describe("revisiones (US07)", () => {
    const ok = { estado: "OK" as const, comentario: null };
    const revisionApi = {
      id: "r1",
      vehiculoId: "m1",
      nivelAceite: ok,
      frenos: { estado: "CRITICO" as const, comentario: "Pedal esponjoso" },
      refrigerante: ok,
      bateria: ok,
      presionNeumaticos: { estado: "ADVERTENCIA" as const, comentario: "Trasera baja" },
      lucesYBalizas: ok,
      sirenaYComunicaciones: ok,
      comentarioGeneral: null,
      revisadoPor: { id: "u1", nombre: "Lucía Ríos" },
      creadoEn: "2026-10-25T02:50:00Z",
    };

    it("registra la revisión con las claves del back", async () => {
      const post = vi.spyOn(http, "post").mockResolvedValue({ data: revisionApi });
      const items = Object.fromEntries(
        ["ACEITE", "REFRIGERANTE", "FRENOS", "BATERIA", "NEUMATICOS", "LUCES", "SIRENA"].map((c) => [
          c,
          c === "FRENOS"
            ? { estado: "critico" as const, detalle: " Pedal esponjoso " }
            : c === "NEUMATICOS"
              ? { estado: "atencion" as const, detalle: "Trasera baja" }
              : { estado: "ok" as const, detalle: "texto que no se manda" },
        ]),
      );
      const r = await registrarRevision("m1", { comentario: "  ", items });

      expect(post).toHaveBeenCalledWith("/flota/vehiculos/m1/revisiones", {
        nivelAceite: ok,
        refrigerante: ok,
        frenos: { estado: "CRITICO", comentario: "Pedal esponjoso" },
        bateria: ok,
        presionNeumaticos: { estado: "ADVERTENCIA", comentario: "Trasera baja" },
        lucesYBalizas: ok,
        sirenaYComunicaciones: ok,
        comentarioGeneral: null,
      });
      expect(r).toMatchObject({
        id: "r1",
        realizadaEn: "2026-10-25T02:50:00Z",
        resultado: "fuera_de_servicio",
        revisadoPor: "Lucía Ríos",
      });
      expect(r).not.toHaveProperty("comentario");
      expect(r.items).toHaveLength(7);
      expect(r.items).toContainEqual({ codigo: "FRENOS", estado: "critico", detalle: "Pedal esponjoso" });
      expect(r.items).toContainEqual({ codigo: "NEUMATICOS", estado: "atencion", detalle: "Trasera baja" });
      expect(r.items).toContainEqual({ codigo: "ACEITE", estado: "ok" });
    });

    it("el resultado sale de los ítems, con la regla del back; sin autor no hay revisadoPor", async () => {
      vi.spyOn(http, "get").mockResolvedValueOnce({
        data: { ...revisionApi, frenos: ok, comentarioGeneral: "Rutina", revisadoPor: null },
      });
      const r = await obtenerRevision("m1", "r1");
      expect(r).toMatchObject({ resultado: "observaciones", comentario: "Rutina" });
      expect(r).not.toHaveProperty("revisadoPor");
    });

    it("trae el historial paginado, de a 10", async () => {
      const get = vi.spyOn(http, "get").mockResolvedValueOnce({
        data: { items: [revisionApi], total: 12, pagina: 2, paginas: 2, porPagina: 10 },
      });
      const pagina = await listarRevisiones("m1", 2);
      expect(get).toHaveBeenCalledWith("/flota/vehiculos/m1/revisiones", { params: { pagina: 2, porPagina: 10 } });
      expect(pagina).toMatchObject({ total: 12, pagina: 2, paginas: 2 });
      expect(pagina.items[0]).toMatchObject({ id: "r1", resultado: "fuera_de_servicio" });
    });

    it("trae una revisión puntual", async () => {
      const get = vi.spyOn(http, "get").mockResolvedValueOnce({ data: revisionApi });
      await expect(obtenerRevision("m1", "r1")).resolves.toMatchObject({ id: "r1" });
      expect(get).toHaveBeenCalledWith("/flota/vehiculos/m1/revisiones/r1");
    });

    it("en mantenimiento sin comentario el back marca el campo comentarioGeneral", async () => {
      vi.spyOn(http, "post").mockRejectedValue(
        errorHttp(400, { message: "Contá qué se hizo", campo: "comentarioGeneral", code: "COMENTARIO_OBLIGATORIO" }),
      );
      await expect(registrarRevision("m1", { comentario: "", items: {} })).rejects.toMatchObject({
        status: 400,
        campo: "comentarioGeneral",
      });
    });

    it("un 409 del back (móvil dado de baja) llega con su mensaje", async () => {
      vi.spyOn(http, "post").mockRejectedValue(errorHttp(409, { message: "El vehículo ya está dado de baja definitiva" }));
      await expect(registrarRevision("m1", { comentario: "", items: {} })).rejects.toMatchObject({
        status: 409,
        message: "El vehículo ya está dado de baja definitiva",
      });
    });
  });
});
