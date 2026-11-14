import { test as base, type Page, type Route } from "@playwright/test";
import {
  crearSolicitud,
  DOMINIO_DE_PRUEBA,
  PASSWORD_DE_PRUEBA,
  resolverPedido,
  TODOS_LOS_ROLES,
  tokenSimulado,
  type AbonoApi,
  type EstadoBackend,
  type ItemCatalogo,
  type MovilApi,
  type ModeloApi,
  type RevisionApi,
} from "../../../src/demo/backSimulado";

/**
 * Backend en memoria para los E2E de CentralBV.
 *
 * Cada test recibe un `backend` nuevo (fixture `backend`) y todas las llamadas a
 * `http://localhost:3000/**` se resuelven acá. Así los recorridos no dependen de
 * la red ni de una base real y el estado de un test no contamina a otro.
 *
 * Las reglas de los endpoints viven en `src/demo/backSimulado.ts`, el mismo back
 * simulado que usa el modo demo (US58). Acá quedan los datos de prueba y la
 * conexión con Playwright.
 */

const API = "http://localhost:3000";

export type { CompartimentoApi, EstadoBackend } from "../../../src/demo/backSimulado";

export interface Backend {
  estado: EstadoBackend;
  /** Cambia los roles que devuelve POST /auth/login. */
  rolesDeLogin: (roles: string[]) => void;
}

const TIPO_AUTOBOMBA = "11111111-1111-4111-8111-111111111111";
const TIPO_RESCATE = "22222222-2222-4222-8222-222222222222";
const TIPO_CISTERNA = "33333333-3333-4333-8333-333333333333";
const MARCA_IVECO = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const MARCA_SCANIA = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const MODELO_TECTOR = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const MODELO_ATEGO = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const MODELO_R450 = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const REVISION_M1 = "99999999-9999-4999-8999-999999999999";

const revision = (id: string, vehiculoId: string, creadoEn: string, critico = false): RevisionApi => ({
  id,
  vehiculoId,
  nivelAceite: { estado: "OK", comentario: null },
  refrigerante: { estado: "OK", comentario: null },
  frenos: { estado: critico ? "CRITICO" : "OK", comentario: critico ? "Pastillas gastadas" : null },
  bateria: { estado: "OK", comentario: null },
  presionNeumaticos: { estado: "ADVERTENCIA", comentario: "Baja la rueda trasera" },
  lucesYBalizas: { estado: "OK", comentario: null },
  sirenaYComunicaciones: { estado: "OK", comentario: null },
  comentarioGeneral: null,
  revisadoPor: { id: "usuario-1", nombre: "Juan Pérez" },
  creadoEn,
});

const abono = (
  estado: AbonoApi["estado"],
  monto: number | null = null,
  metodoPago: string | null = null,
): AbonoApi => ({ estado, monto, metodoPago, fechaPago: "2026-10-15T13:00:00.000Z", motivoExento: null });

export function estadoInicial(): EstadoBackend {
  const tipos: ItemCatalogo[] = [
    { id: TIPO_AUTOBOMBA, valor: "Autobomba", enUso: 2 },
    { id: TIPO_RESCATE, valor: "Rescate", enUso: 1 },
    { id: TIPO_CISTERNA, valor: "Cisterna", enUso: 0 },
  ];
  const marcas: ItemCatalogo[] = [
    { id: MARCA_IVECO, valor: "Iveco", enUso: 3 },
    { id: MARCA_SCANIA, valor: "Scania", enUso: 1 },
  ];
  const modelos: ModeloApi[] = [
    { id: MODELO_TECTOR, valor: "Tector", marcaId: MARCA_IVECO, enUso: 2 },
    { id: MODELO_ATEGO, valor: "Atego 1726", marcaId: MARCA_IVECO, enUso: 1 },
    { id: MODELO_R450, valor: "R450", marcaId: MARCA_SCANIA, enUso: 1 },
  ];
  const movil = (
    id: string,
    denominacion: string,
    estado: MovilApi["estado"],
    tipo: ItemCatalogo,
    patente: string,
    marca = marcas[0],
    modelo = modelos[0],
  ): MovilApi => ({ id, estado, patente, denominacion, tipo, marca, modelo });

  return {
    tipos,
    marcas,
    modelos,
    moviles: [
      movil("movil-1", "M-1", "OPERATIVO", tipos[0], "AB123CD"),
      movil("movil-2", "M-2", "OBSERVACIONES", tipos[0], "AC456EF", marcas[1], modelos[2]),
      movil("movil-3", "M-3", "FUERA_SERVICIO", tipos[1], "AD789GH"),
      movil("movil-4", "M-4", "MANTENIMIENTO", tipos[1], "AE012IJ", marcas[1], modelos[2]),
      movil("movil-5", "M-5", "BAJA_DEFINITIVA", tipos[0], "AF345KL", marcas[0], modelos[1]),
    ],
    revisiones: {
      "movil-1": [revision(REVISION_M1, "movil-1", "2026-10-20T18:30:00.000Z", true)],
    },
    compartimentos: {},
    siguienteCompartimento: 1,
    solicitudes: [
      crearSolicitud("sol-1", "SOL-0001", "PENDIENTE", "Roberto Acosta"),
      crearSolicitud("sol-2", "SOL-0002", "REALIZADA", "Marta Gómez", {
        siniestro: {
          tipo: "VEHICULAR",
          fecha: "2026-10-11",
          hora: "18:20",
          direccion: "Ruta 8 km 42",
          numeroParte: "318",
          motivo: "Colisión",
          localidad: "San Miguel",
          partido: "San Miguel",
          perdidas: "Guardaplast y óptica",
          patenteVehiculo: "AB123CD",
        },
        abono: abono("ABONADO", 12000, "EFECTIVO"),
      }),
      crearSolicitud("sol-3", "SOL-0003", "FIRMADA", "Lucía Fernández"),
      crearSolicitud("sol-4", "SOL-0004", "FIRMADA", "Pedro Ramírez", {
        abono: abono("ABONADO", 12000, "TRANSFERENCIA"),
      }),
      crearSolicitud("sol-5", "SOL-0005", "RETIRADA", "Ana Torres", {
        abono: abono("EXENTO"),
        retiradoEn: "2026-10-16T14:10:00.000Z",
        retiradoPorNombre: "Ana Torres",
        retiradoPorDni: "30123456",
      }),
      crearSolicitud("sol-6", "SOL-0006", "CANCELADA", "Jorge Díaz", {
        motivoCancelacion: "El pedido no corresponde",
        canceladoEn: "2026-10-13T12:00:00.000Z",
      }),
    ],
    usuarios: [
      { id: "usuario-1", email: "juan@centralbv.test", nombre: "Juan", apellido: "Pérez", activo: true, roles: ["ADMIN"] },
      { id: "usuario-2", email: "maria@centralbv.test", nombre: "María", apellido: "Gómez", activo: true, roles: ["ADMINISTRATIVO"] },
      { id: "usuario-3", email: "carlos@centralbv.test", nombre: "Carlos", apellido: "Ruiz", activo: false, roles: ["COMUN"] },
    ],
    rolesDeLogin: [...TODOS_LOS_ROLES],
    siguienteMovil: 6,
    siguienteSolicitud: 7,
    usuarioActual: { id: "usuario-1", nombre: "Juan Pérez" },
  };
}

export const tokenDePrueba = (roles: string[] = TODOS_LOS_ROLES): string => tokenSimulado(roles);

export async function abrirConSesion(page: Page, ruta: string, roles: string[] = TODOS_LOS_ROLES): Promise<void> {
  await page.addInitScript((valor) => window.localStorage.setItem("centralbv.token", valor), tokenDePrueba(roles));
  await page.goto(ruta);
}

const CORS = { "access-control-allow-origin": "*" };

async function manejar(backend: Backend, route: Route): Promise<void> {
  const peticion = route.request();
  if (peticion.method() === "OPTIONS") {
    return route.fulfill({
      status: 204,
      headers: {
        ...CORS,
        "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "access-control-allow-headers": "authorization,content-type,accept",
      },
    });
  }

  let cuerpo: unknown;
  try {
    cuerpo = peticion.postDataJSON() ?? undefined;
  } catch {
    cuerpo = undefined;
  }
  const respuesta = resolverPedido(backend.estado, { metodo: peticion.method(), url: new URL(peticion.url()), cuerpo });

  if (respuesta.pdf) {
    return route.fulfill({
      status: 200,
      contentType: "application/pdf",
      headers: { ...CORS, "content-disposition": `attachment; filename="${respuesta.pdf.nombre}"` },
      body: "%PDF-1.4\n% CentralBV constancia de prueba\n%%EOF",
    });
  }
  if (respuesta.cuerpo === undefined) return route.fulfill({ status: respuesta.status, headers: CORS });
  return route.fulfill({
    status: respuesta.status,
    contentType: "application/json",
    headers: CORS,
    body: JSON.stringify(respuesta.cuerpo),
  });
}

export async function instalarBackend(page: Page): Promise<Backend> {
  const backend: Backend = {
    estado: estadoInicial(),
    rolesDeLogin: (roles: string[]) => {
      backend.estado.rolesDeLogin = roles;
    },
  };
  await page.route(`${API}/**`, (route) => manejar(backend, route));
  return backend;
}

/** Fixture de Playwright: cada test arranca con un backend limpio interceptado. */
export const test = base.extend<{ backend: Backend }>({
  // `auto` garantiza que la intercepción exista incluso en tests que no piden
  // `backend` explícitamente (por ejemplo, los que solo usan `page`).
  backend: [
    async ({ page }, use) => {
      const backend = await instalarBackend(page);
      await use(backend);
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
export const credenciales = { email: `admin${DOMINIO_DE_PRUEBA}`, password: PASSWORD_DE_PRUEBA };
