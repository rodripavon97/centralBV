import { afterEach, describe, expect, it, vi } from "vitest";
import { leerSesion } from "@/features/auth/session";
import { datosDeEjemplo } from "./datosEjemplo";
import {
  activarModoDemo,
  cargarEstadoDemo,
  CLAVE_DATOS_DEMO,
  CLAVE_DEMO,
  esModoDemo,
  guardarEstadoDemo,
  reiniciarDatosDemo,
  salirModoDemo,
  tokenDemo,
} from "./modoDemo";

afterEach(() => vi.restoreAllMocks());

describe("modo demo", () => {
  it("activar guarda el flag, una sesión con todos los roles que no vence en la presentación y los datos de ejemplo", () => {
    expect(esModoDemo()).toBe(false);
    activarModoDemo();

    expect(esModoDemo()).toBe(true);
    const sesion = leerSesion();
    expect(sesion.estado).toBe("activa");
    expect(sesion.roles).toEqual(["ADMIN", "ADMINISTRATIVO", "AUTOMOTORES", "COMUN"]);
    const exp = JSON.parse(atob(tokenDemo().split(".")[1])).exp as number;
    expect(exp * 1000 - Date.now()).toBeGreaterThan(7 * 24 * 60 * 60 * 1000);
    expect(cargarEstadoDemo().moviles).toHaveLength(7);
  });

  it("activar de nuevo no pisa lo que ya se cargó", () => {
    activarModoDemo();
    const estado = cargarEstadoDemo();
    estado.moviles.pop();
    guardarEstadoDemo(estado);

    activarModoDemo();
    expect(cargarEstadoDemo().moviles).toHaveLength(6);
  });

  it("los cambios guardados sobreviven a una recarga (se vuelven a leer de localStorage)", () => {
    const estado = cargarEstadoDemo();
    estado.usuarios[0].nombre = "Cambiado";
    guardarEstadoDemo(estado);
    expect(cargarEstadoDemo().usuarios[0].nombre).toBe("Cambiado");
  });

  it.each([
    ["JSON roto", "{no es json"],
    ["otra versión", JSON.stringify({ version: 99, estado: datosDeEjemplo() })],
    ["forma inválida", JSON.stringify({ version: 1, estado: { moviles: "x" } })],
    ["no es un objeto", JSON.stringify({ version: 1, estado: [] })],
  ])("si los datos guardados no se pueden leer (%s) carga los de ejemplo", (_caso, guardado) => {
    window.localStorage.setItem(CLAVE_DATOS_DEMO, guardado);
    expect(cargarEstadoDemo().solicitudes).toHaveLength(7);
    expect(JSON.parse(window.localStorage.getItem(CLAVE_DATOS_DEMO) as string).version).toBe(1);
  });

  it("reiniciar vuelve a los datos de ejemplo", () => {
    const estado = cargarEstadoDemo();
    estado.moviles = [];
    guardarEstadoDemo(estado);
    reiniciarDatosDemo();
    expect(cargarEstadoDemo().moviles).toHaveLength(7);
  });

  it("salir borra el flag, la sesión y los datos", () => {
    activarModoDemo();
    salirModoDemo();
    expect(window.localStorage.getItem(CLAVE_DEMO)).toBeNull();
    expect(window.localStorage.getItem(CLAVE_DATOS_DEMO)).toBeNull();
    expect(leerSesion().estado).toBe("ausente");
  });

  it("si el storage falla, no rompe: sin flag y con datos en memoria", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("lleno");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    expect(esModoDemo()).toBe(false);
    expect(cargarEstadoDemo().moviles).toHaveLength(7);
    expect(() => salirModoDemo()).not.toThrow();
  });
});

describe("datos de ejemplo", () => {
  it("son genéricos: nada del cuartel de José C. Paz", () => {
    const texto = JSON.stringify(datosDeEjemplo()).toLowerCase();
    expect(texto).not.toMatch(/paz|mitre|san agust/);
  });

  it("tienen móviles en todos los estados, solicitudes en cada estado y 4 usuarios con roles distintos", () => {
    const datos = datosDeEjemplo();
    expect(new Set(datos.moviles.map((m) => m.estado))).toEqual(new Set(["OPERATIVO", "OBSERVACIONES", "MANTENIMIENTO", "FUERA_SERVICIO"]));
    expect(new Set(datos.solicitudes.map((s) => s.estado))).toEqual(new Set(["PENDIENTE", "REALIZADA", "FIRMADA", "RETIRADA", "CANCELADA"]));
    expect(new Set(datos.usuarios.flatMap((u) => u.roles)).size).toBe(4);
    const estadosBuches = new Set(Object.values(datos.compartimentos).flat().map((b) => b.estado));
    expect(estadosBuches).toEqual(new Set(["OPERATIVO", "OBSERVACIONES", "DANADO", "FUERA_DE_USO"]));
  });
});

