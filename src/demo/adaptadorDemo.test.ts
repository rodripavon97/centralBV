import axios, { type AxiosAdapter, type AxiosResponse } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { aErrorApi, http } from "@/lib/http";
import { crearMovil, listarMoviles, obtenerResumenFlota } from "@/features/moviles/api/flotaApi";
import { descargarConstanciaPdf, generarConstancia } from "@/features/constancias/api/solicitudesApi";
import { crearUsuario, reenviarBienvenida } from "@/features/usuarios/api/usuariosApi";
import { adaptadorDemo, crearAdaptador, datosPdfDesdeApi } from "./adaptadorDemo";
import { crearSolicitud } from "./backSimulado";
import { activarModoDemo, cargarEstadoDemo, MENSAJE_SIN_MAILS, salirModoDemo } from "./modoDemo";

/** Adapter "de red" de mentira: si se llama, el pedido habría salido del navegador. */
const red = vi.fn<AxiosAdapter>(async (config) => ({ data: { red: true }, status: 200, statusText: "OK", headers: {}, config }) as AxiosResponse);
const adaptadorOriginal = http.defaults.adapter;

beforeEach(() => {
  http.defaults.adapter = crearAdaptador(red);
});

afterEach(() => {
  http.defaults.adapter = adaptadorOriginal;
});

describe("adapter del modo demo", () => {
  it("sin el flag, axios usa el adapter de red como siempre", async () => {
    const { data } = await http.get("/flota/vehiculos/resumen");
    expect(data).toEqual({ red: true });
    expect(red).toHaveBeenCalledTimes(1);
  });

  it("http usa el adapter con demo por defecto", () => {
    expect(typeof adaptadorOriginal).toBe("function");
    expect(crearAdaptador()).toBeTypeOf("function");
  });

  describe("con el flag", () => {
    beforeEach(() => activarModoDemo());

    it("responde con el back simulado y no sale a la red", async () => {
      const resumen = await obtenerResumenFlota();
      expect(resumen.total).toBe(7);
      const moviles = await listarMoviles({ busqueda: "M-3" });
      expect(moviles.items.map((m) => m.codigo)).toEqual(["M-3"]);
      expect(red).not.toHaveBeenCalled();
    });

    it("lo que se crea queda guardado en localStorage", async () => {
      const estado = cargarEstadoDemo();
      await crearMovil(
        { denominacion: "M-40", patente: "AZ400BV", tipoId: estado.tipos[0].id, marcaId: estado.marcas[0].id, modeloId: estado.modelos[0].id },
      );
      expect(cargarEstadoDemo().moviles.some((m) => m.denominacion === "M-40")).toBe(true);
    });

    it("los errores llegan como los de axios y aErrorApi los convierte (409 con campo)", async () => {
      const estado = cargarEstadoDemo();
      const error = await crearMovil({ denominacion: "M-1", patente: "AZ401BV", tipoId: estado.tipos[0].id, marcaId: estado.marcas[0].id, modeloId: estado.modelos[0].id }).catch((e: unknown) => e);
      expect(error).toMatchObject({ status: 409, campo: "denominacion" });

      const sinMock = await http.delete("/nada").catch((e: unknown) => e);
      expect(axios.isAxiosError(sinMock)).toBe(true);
      expect(aErrorApi(sinMock)).toMatchObject({ status: 404 });
      expect(red).not.toHaveBeenCalled();
    });

    it("sin validateStatus o con uno que acepta el status, devuelve la respuesta", async () => {
      const config = { method: "get", url: "/nada", headers: new axios.AxiosHeaders() };
      const respuesta = await adaptadorDemo({ ...config, validateStatus: () => true });
      expect(respuesta.status).toBe(404);
      const sinValidar = await adaptadorDemo(config);
      expect(sinValidar.status).toBe(404);
    });

    it("los mails no se mandan y la respuesta lo avisa", async () => {
      expect(await crearUsuario({ nombre: "Eva", apellido: "Paz", email: "eva@ejemplo.com", password: "Cuartel2026", roleName: "comun" })).toMatchObject({
        message: MENSAJE_SIN_MAILS,
      });
      await expect(reenviarBienvenida("usuario-1")).resolves.toBeUndefined();
    });

    it("genera el PDF de la constancia en el navegador", async () => {
      const generado = await generarConstancia("sol-1", "Nota de prueba");
      expect(generado.filename).toBe("constancia-SOL-0001.pdf");
      expect(generado.blob).toBeInstanceOf(Blob);
      const texto = await generado.blob.text();
      expect(texto.startsWith("%PDF-")).toBe(true);
      expect(texto).toContain("Cuartel de Bomberos Voluntarios \\(demo\\)");

      const descargado = await descargarConstanciaPdf("sol-1");
      expect(descargado.filename).toBe("constancia-SOL-0001.pdf");
      expect(red).not.toHaveBeenCalled();
    });

    it("al salir vuelve a la red", async () => {
      salirModoDemo();
      await http.get("/users");
      expect(red).toHaveBeenCalledTimes(1);
    });
  });
});

describe("datos del PDF", () => {
  it("dominio solo si es vehicular y póliza solo si va al seguro, como el back", () => {
    const vivienda = crearSolicitud("s", "SOL-1", "PENDIENTE", "Ana", {
      siniestro: { ...crearSolicitud("x", "x", "PENDIENTE", "x").siniestro, patenteVehiculo: "AA111AA" },
      constancia: { destino: "ACCION_SOCIAL", razonSocial: "Municipio", numeroPoliza: "P-1" },
      observaciones: "  ",
    });
    expect(datosPdfDesdeApi(vivienda)).toMatchObject({ patente: null, numeroPoliza: null, observaciones: null, dni: "30.123.456", fecha: "12/10/2026" });

    const vehicular = crearSolicitud("s", "SOL-1", "PENDIENTE", "Ana", {
      siniestro: { ...vivienda.siniestro, tipo: "VEHICULAR" },
      observaciones: "Nota",
    });
    expect(datosPdfDesdeApi(vehicular)).toMatchObject({ patente: "AA111AA", numeroPoliza: "POL-1", observaciones: "Nota" });
  });
});
