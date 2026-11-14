import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorApi, http } from "@/lib/http";
import { cambiarEstadoBuche, crearBuche, editarBuche, eliminarBuche, generarBuches, listarBuches } from "./flotaApi";

const bucheApi = { id: "b1", nombre: "LC-1", zona: "LADO_CONDUCTOR", orden: 1, estado: "FUERA_DE_USO" };
const buche = { id: "b1", nombre: "LC-1", zona: "lado_conductor", orden: 1, estado: "fuera_de_uso" };

function errorHttp(status: number, data: unknown) {
  return new AxiosError("error", "ERR", undefined, undefined, {
    status,
    data,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
  });
}

describe("flotaApi · buches", () => {
  afterEach(() => vi.restoreAllMocks());

  it("lista los buches y traduce zona y estado", async () => {
    const get = vi.spyOn(http, "get").mockResolvedValue({
      data: [
        bucheApi,
        { ...bucheApi, id: "b2", nombre: "CB-1", zona: "CABINA", estado: "OBSERVACIONES" },
        { ...bucheApi, id: "b3", nombre: "TR-1", zona: "TRASERO", estado: "DANADO" },
      ],
    });
    await expect(listarBuches("m/1")).resolves.toEqual([
      buche,
      { ...buche, id: "b2", nombre: "CB-1", zona: "cabina", estado: "observaciones" },
      { ...buche, id: "b3", nombre: "TR-1", zona: "trasero", estado: "danado" },
    ]);
    expect(get).toHaveBeenCalledWith("/flota/vehiculos/m%2F1/compartimentos");
  });

  it("genera con las cantidades elegidas", async () => {
    const post = vi.spyOn(http, "post").mockResolvedValue({ data: [{ ...bucheApi, zona: "TECHO", estado: "OPERATIVO" }] });
    const r = await generarBuches("m1", { ladoConductor: 2, ladoAcompanante: 0, trasero: 1, techo: true, cabina: false });
    expect(r).toEqual([{ ...buche, zona: "techo", estado: "operativo" }]);
    expect(post).toHaveBeenCalledWith("/flota/vehiculos/m1/compartimentos/generar", {
      ladoConductor: 2,
      ladoAcompanante: 0,
      trasero: 1,
      techo: true,
      cabina: false,
    });
  });

  it("crea un buche con el nombre recortado y la zona del back", async () => {
    const post = vi.spyOn(http, "post").mockResolvedValue({ data: { ...bucheApi, zona: "TRASERO" } });
    await expect(crearBuche("m1", { nombre: " tr-2 ", zona: "trasero" })).resolves.toMatchObject({ zona: "trasero" });
    expect(post).toHaveBeenCalledWith("/flota/vehiculos/m1/compartimentos", { nombre: "tr-2", zona: "TRASERO" });
  });

  it("propaga el nombre duplicado como error del campo", async () => {
    vi.spyOn(http, "post").mockRejectedValue(
      errorHttp(409, { message: "Ya existe un buche con ese nombre", campo: "nombre", code: "COMPARTIMENTO_DUPLICADO" }),
    );
    const error = await crearBuche("m1", { nombre: "LC-1", zona: "lado_conductor" }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ErrorApi);
    expect(error).toMatchObject({ status: 409, campo: "nombre", codigo: "COMPARTIMENTO_DUPLICADO" });
  });

  it("edita solo lo que cambia", async () => {
    const patch = vi.spyOn(http, "patch").mockResolvedValue({ data: { ...bucheApi, zona: "LADO_ACOMPANANTE" } });
    await editarBuche("m1", "b1", { zona: "lado_acompanante" });
    expect(patch).toHaveBeenLastCalledWith("/flota/vehiculos/m1/compartimentos/b1", { zona: "LADO_ACOMPANANTE" });
    await editarBuche("m1", "b1", { nombre: " LC-9 " });
    expect(patch).toHaveBeenLastCalledWith("/flota/vehiculos/m1/compartimentos/b1", { nombre: "LC-9" });
  });

  it("cambia el estado de un buche", async () => {
    const patch = vi.spyOn(http, "patch").mockResolvedValue({ data: { ...bucheApi, estado: "DANADO" } });
    await expect(cambiarEstadoBuche("m1", "b1", "danado")).resolves.toMatchObject({ estado: "danado" });
    expect(patch).toHaveBeenCalledWith("/flota/vehiculos/m1/compartimentos/b1/estado", { estado: "DANADO" });
  });

  it("elimina un buche y propaga si tiene materiales", async () => {
    const del = vi.spyOn(http, "delete").mockResolvedValueOnce({ data: undefined });
    await expect(eliminarBuche("m1", "b1")).resolves.toBeUndefined();
    expect(del).toHaveBeenCalledWith("/flota/vehiculos/m1/compartimentos/b1");
    del.mockRejectedValueOnce(errorHttp(409, { message: "Tiene materiales", code: "COMPARTIMENTO_CON_MATERIALES" }));
    await expect(eliminarBuche("m1", "b1")).rejects.toMatchObject({ codigo: "COMPARTIMENTO_CON_MATERIALES" });
  });
});
