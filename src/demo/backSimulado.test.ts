import { beforeEach, describe, expect, it } from "vitest";
import {
  esEscritura,
  planDeBuches,
  resolverPedido,
  tokenSimulado,
  type CompartimentoApi,
  type EstadoBackend,
  type MovilApi,
  type RevisionApi,
  type SolicitudApi,
  type UsuarioApi,
} from "./backSimulado";
import { datosDeEjemplo } from "./datosEjemplo";

let estado: EstadoBackend;

const pedir = (metodo: string, path: string, cuerpo?: unknown, opciones = {}) =>
  resolverPedido(estado, { metodo, url: new URL(path, "http://demo.local"), cuerpo }, opciones);

const mensaje = (r: { cuerpo?: unknown }) => (r.cuerpo as { message?: string }).message;

beforeEach(() => {
  estado = datosDeEjemplo(Date.parse("2026-11-10T12:00:00Z"));
});

describe("back simulado · auth", () => {
  it("loguea solo con las credenciales de prueba y devuelve los roles configurados", () => {
    expect(pedir("POST", "/auth/login", { email: "x@otro.com", password: "Secreta123" }).status).toBe(401);
    expect(pedir("POST", "/auth/login", {}).status).toBe(401);
    const r = pedir("post", "/auth/login", { email: "admin@centralbv.test", password: "Secreta123" });
    expect(r.status).toBe(200);
    expect((r.cuerpo as { user: { roles: string[] } }).user.roles).toEqual(estado.rolesDeLogin);
  });

  it("recuperar contraseña responde OK y usa el aviso de mails si lo hay", () => {
    expect(mensaje(pedir("POST", "/auth/forgot-password", { email: "a@b.c" }))).toMatch(/Si la cuenta existe/);
    expect(mensaje(pedir("POST", "/auth/forgot-password", {}, { mensajeMails: "Sin mails" }))).toBe("Sin mails");
  });

  it("restablecer valida el token y que la contraseña no se repita", () => {
    expect(pedir("POST", "/auth/reset-password", {}).status).toBe(400);
    expect(pedir("POST", "/auth/reset-password", { token: "t", newPassword: "Igual1234" }).status).toBe(400);
    expect(pedir("POST", "/auth/reset-password", { token: "t", newPassword: "Nueva1234" }).status).toBe(200);
  });

  it("arma tokens con roles y vencimiento", () => {
    const payload = JSON.parse(atob(tokenSimulado(["ADMIN"], 60, { nombre: "X" }).split(".")[1]));
    expect(payload).toMatchObject({ roles: ["ADMIN"], nombre: "X" });
    expect(payload.exp).toBeGreaterThan(Date.now() / 1000);
  });
});

describe("back simulado · catálogos", () => {
  it("lista, crea con id UUID, renombra y no desactiva lo que está en uso", () => {
    expect(pedir("GET", "/flota/catalogos/tipos").cuerpo).toHaveLength(5);
    const nuevo = pedir("POST", "/flota/catalogos/tipos", { valor: "Escalera" });
    const item = nuevo.cuerpo as { id: string; enUso: number };
    expect(nuevo.status).toBe(201);
    expect(item.id).toMatch(/^[0-9a-f]{8}-0000-4000-8000-\d{12}$/);

    const modelo = pedir("POST", "/flota/catalogos/modelos", { valor: "Nuevo", marcaId: estado.marcas[0].id });
    expect(modelo.cuerpo).toMatchObject({ marcaId: estado.marcas[0].id });
    expect(pedir("POST", "/flota/catalogos/marcas", {}).cuerpo).toMatchObject({ valor: "Nuevo" });

    expect(pedir("PATCH", `/flota/catalogos/tipos/${item.id}`, { valor: "Escalera mecánica" }).cuerpo).toMatchObject({
      valor: "Escalera mecánica",
    });
    expect(pedir("PATCH", `/flota/catalogos/tipos/${item.id}`, {}).cuerpo).toMatchObject({ valor: "Escalera mecánica" });
    expect(pedir("PATCH", `/flota/catalogos/tipos/${estado.tipos[0].id}/desactivar`).status).toBe(409);
    expect(pedir("PATCH", `/flota/catalogos/tipos/${item.id}/desactivar`).status).toBe(200);
    expect(estado.tipos.some((t) => t.id === item.id)).toBe(false);
    expect(pedir("PATCH", "/flota/catalogos/tipos/no-existe").status).toBe(404);
  });

  it("no repite ids aunque se haya borrado un ítem del medio", () => {
    const a = pedir("POST", "/flota/catalogos/tipos", { valor: "A" }).cuerpo as { id: string };
    pedir("PATCH", `/flota/catalogos/tipos/${estado.tipos[2].id}`, { valor: "Cisterna grande" });
    estado.tipos.splice(0, 1);
    const b = pedir("POST", "/flota/catalogos/tipos", { valor: "B" }).cuerpo as { id: string };
    expect(b.id).not.toBe(a.id);
  });
});

describe("back simulado · móviles", () => {
  const cuerpoMovil = (extra = {}) => ({
    denominacion: "M-30",
    patente: "AZ300BV",
    tipoId: estado.tipos[2].id,
    marcaId: estado.marcas[3].id,
    modeloId: estado.modelos[6].id,
    ...extra,
  });

  it("resume y filtra la flota sin los dados de baja", () => {
    pedir("PATCH", "/flota/vehiculos/movil-6/baja", { motivo: "Vendido" });
    const resumen = pedir("GET", "/flota/vehiculos/resumen").cuerpo as { total: number; porEstado: Record<string, number> };
    expect(resumen.total).toBe(6);
    expect(resumen.porEstado.OPERATIVO).toBe(2);

    const lista = (path: string) => (pedir("GET", path).cuerpo as { items: MovilApi[] }).items.map((m) => m.denominacion);
    expect(lista("/flota/vehiculos")).toHaveLength(6);
    expect(lista("/flota/vehiculos?estado=OBSERVACIONES")).toEqual(["M-2", "M-7"]);
    expect(lista(`/flota/vehiculos?tipoId=${estado.tipos[1].id}`)).toEqual(["M-4", "M-7"]);
    expect(lista("/flota/vehiculos?busqueda=ac 303")).toEqual(["M-3"]);
  });

  it("crea, edita, rechaza duplicados y da de baja", () => {
    const creado = pedir("POST", "/flota/vehiculos", cuerpoMovil());
    expect(creado.status).toBe(201);
    expect(creado.cuerpo).toMatchObject({ id: "movil-8", estado: "OPERATIVO", tipo: { valor: "Cisterna" } });
    expect(estado.tipos[2].enUso).toBe(2);

    expect(pedir("POST", "/flota/vehiculos", cuerpoMovil({ patente: "AZ999BV" })).cuerpo).toMatchObject({ campo: "denominacion" });
    expect(pedir("POST", "/flota/vehiculos", cuerpoMovil({ denominacion: "M-99" })).cuerpo).toMatchObject({ campo: "patente" });
    const sinCatalogo = pedir("POST", "/flota/vehiculos", { denominacion: "M-40", patente: "AZ400BV", tipoId: "x", marcaId: "x", modeloId: "x" });
    expect(sinCatalogo.cuerpo).toMatchObject({ tipo: estado.tipos[0], marca: estado.marcas[0] });

    expect(pedir("GET", "/flota/vehiculos/movil-8").cuerpo).toMatchObject({ denominacion: "M-30" });
    const editado = pedir("PATCH", "/flota/vehiculos/movil-8", cuerpoMovil({ denominacion: "M-31", tipoId: "x", marcaId: "x", modeloId: "x" }));
    expect(editado.cuerpo).toMatchObject({ denominacion: "M-31", tipo: { valor: "Cisterna" } });
    expect(pedir("PATCH", "/flota/vehiculos/movil-8", cuerpoMovil({ tipoId: estado.tipos[0].id })).cuerpo).toMatchObject({
      tipo: { valor: "Autobomba" },
    });

    expect(pedir("PATCH", "/flota/vehiculos/movil-8/baja", {}).cuerpo).toMatchObject({ estado: "BAJA_DEFINITIVA", motivoBaja: null });
    expect(pedir("PATCH", "/flota/vehiculos/nada/baja", {}).status).toBe(404);
    expect(pedir("GET", "/flota/vehiculos/nada").status).toBe(404);
    expect(pedir("DELETE", "/flota/vehiculos/movil-1").status).toBe(404);
  });

  it("registra revisiones y recalcula el estado del móvil", () => {
    const lista = pedir("GET", "/flota/vehiculos/movil-2/revisiones").cuerpo as { items: RevisionApi[]; total: number };
    expect(lista.total).toBe(2);

    const critica = pedir("POST", "/flota/vehiculos/movil-1/revisiones", { frenos: { estado: "CRITICO", comentario: "Sin frenos" }, comentarioGeneral: "Urgente" });
    expect(critica.status).toBe(201);
    const revision = critica.cuerpo as RevisionApi;
    expect(revision).toMatchObject({ comentarioGeneral: "Urgente", revisadoPor: estado.usuarioActual, refrigerante: { estado: "OK" } });
    expect(estado.moviles[0].estado).toBe("FUERA_SERVICIO");
    expect(pedir("GET", `/flota/vehiculos/movil-1/revisiones/${revision.id}`).cuerpo).toEqual(revision);
    expect(pedir("GET", "/flota/vehiculos/movil-1/revisiones/otra").status).toBe(404);

    pedir("POST", "/flota/vehiculos/movil-6/revisiones", { bateria: { estado: "ADVERTENCIA" } });
    expect(estado.moviles[5].estado).toBe("OBSERVACIONES");
    pedir("POST", "/flota/vehiculos/movil-6/revisiones", {});
    expect(estado.moviles[5].estado).toBe("OPERATIVO");

    expect(pedir("GET", "/flota/vehiculos/nada/revisiones").status).toBe(404);
    pedir("PATCH", "/flota/vehiculos/movil-5/baja", {});
    expect(pedir("POST", "/flota/vehiculos/movil-5/revisiones", {}).status).toBe(409);
    expect(pedir("PUT", "/flota/vehiculos/movil-1/revisiones").status).toBe(404);
  });
});

describe("back simulado · buches (US17)", () => {
  const buchesDe = (id: string) => pedir("GET", `/flota/vehiculos/${id}/compartimentos`).cuerpo as CompartimentoApi[];

  it("arma el plan igual que el back", () => {
    expect(planDeBuches({ ladoConductor: 2, techo: true }).map((b) => b.nombre)).toEqual(["LC-1", "LC-2", "TE-1"]);
    expect(planDeBuches({})).toEqual([]);
  });

  it("genera una sola vez, ordenados por zona", () => {
    expect(buchesDe("movil-6")).toEqual([]);
    expect(pedir("POST", "/flota/vehiculos/movil-6/compartimentos/generar", {}).status).toBe(400);
    const generados = pedir("POST", "/flota/vehiculos/movil-6/compartimentos/generar", { trasero: 1, ladoConductor: 1, cabina: true });
    expect(generados.status).toBe(201);
    expect((generados.cuerpo as CompartimentoApi[]).map((b) => b.nombre)).toEqual(["LC-1", "TR-1", "CB-1"]);
    expect(pedir("POST", "/flota/vehiculos/movil-6/compartimentos/generar", { trasero: 1 }).cuerpo).toMatchObject({
      code: "COMPARTIMENTOS_YA_GENERADOS",
    });
  });

  it("agrega con nombre único, edita, cambia de zona al final, cambia estado y elimina", () => {
    const agregar = (nombre: string, zona = "TRASERO") => pedir("POST", "/flota/vehiculos/movil-1/compartimentos", { nombre, zona });
    expect(agregar("lc-1").cuerpo).toMatchObject({ campo: "nombre", code: "COMPARTIMENTO_DUPLICADO" });
    const nuevo = agregar(" tr-2 ").cuerpo as CompartimentoApi;
    expect(nuevo).toMatchObject({ nombre: "TR-2", orden: 2, estado: "OPERATIVO" });

    const ruta = `/flota/vehiculos/movil-1/compartimentos/${nuevo.id}`;
    expect(pedir("PATCH", ruta, { nombre: "LA-1" }).status).toBe(409);
    expect(pedir("PATCH", ruta, { nombre: "tr-9", zona: "LADO_CONDUCTOR" }).cuerpo).toMatchObject({ nombre: "TR-9", zona: "LADO_CONDUCTOR", orden: 4 });
    expect(pedir("PATCH", ruta, { zona: "LADO_CONDUCTOR" }).cuerpo).toMatchObject({ orden: 4 });
    expect(pedir("PATCH", `${ruta}/estado`, { estado: "DANADO" }).cuerpo).toMatchObject({ estado: "DANADO" });

    expect(pedir("DELETE", ruta)).toEqual({ status: 204 });
    expect(buchesDe("movil-1").some((b) => b.id === nuevo.id)).toBe(false);
    expect(pedir("PATCH", ruta, {}).status).toBe(404);
    expect(pedir("PUT", `/flota/vehiculos/movil-1/compartimentos/${buchesDe("movil-1")[0].id}`).status).toBe(404);
  });

  it("un móvil dado de baja muestra sus buches pero no deja cambiarlos", () => {
    expect(pedir("GET", "/flota/vehiculos/nada/compartimentos").status).toBe(404);
    pedir("PATCH", "/flota/vehiculos/movil-2/baja", {});
    expect(buchesDe("movil-2").length).toBeGreaterThan(0);
    expect(pedir("POST", "/flota/vehiculos/movil-2/compartimentos", { nombre: "X-1", zona: "TECHO" }).status).toBe(409);
  });
});

describe("back simulado · solicitudes", () => {
  const solicitud = (id: string) => estado.solicitudes.find((s) => s.id === id) as SolicitudApi;

  it("lista activas e historial, con búsqueda, estado, orden y página", () => {
    const pagina = (path: string) => pedir("GET", path).cuerpo as { items: SolicitudApi[]; total: number; paginas: number };
    expect(pagina("/solicitudes").total).toBe(6);
    expect(pagina("/solicitudes/completadas").items.map((s) => s.numero)).toEqual(["SOL-0006"]);
    expect(pagina("/solicitudes?estado=FIRMADA").total).toBe(2);
    expect(pagina("/solicitudes?busqueda=benitez").items.map((s) => s.numero)).toEqual(["SOL-0001"]);
    expect(pagina("/solicitudes?orden=asc").items[0].numero).toBe("SOL-0007");
    expect(pagina("/solicitudes?porPagina=4&pagina=9")).toMatchObject({ paginas: 2 });
  });

  it("crea, edita y cancela una solicitud pendiente", () => {
    const base = solicitud("sol-1");
    const creada = pedir("POST", "/solicitudes", { damnificado: base.damnificado, siniestro: base.siniestro, constancia: base.constancia });
    expect(creada.cuerpo).toMatchObject({ id: "sol-8", numero: "SOL-0008", estado: "PENDIENTE" });

    const editada = pedir("PUT", "/solicitudes/sol-8", { ...base, damnificado: { ...base.damnificado, nombre: "Otra Persona" } });
    expect(editada.cuerpo).toMatchObject({ damnificado: { nombre: "Otra Persona" } });
    expect(pedir("GET", "/solicitudes/sol-8").cuerpo).toMatchObject({ numero: "SOL-0008" });

    expect(pedir("PATCH", "/solicitudes/sol-8/cancelar", { motivo: "Error" }).cuerpo).toMatchObject({ estado: "CANCELADA", motivoCancelacion: "Error" });
    expect(pedir("PATCH", "/solicitudes/sol-8/cancelar", { motivo: "Otra vez" }).status).toBe(409);
  });

  it("registra el pago, genera el PDF, firma y entrega", () => {
    expect(pedir("PATCH", "/solicitudes/sol-1/abono", { estado: "ABONADO", monto: 15000, metodoPago: "EFECTIVO" }).cuerpo).toMatchObject({
      abono: { estado: "ABONADO", monto: 15000 },
    });
    expect(pedir("PATCH", "/solicitudes/sol-1/abono", { estado: "EXENTO" }).cuerpo).toMatchObject({ abono: { estado: "EXENTO", monto: null } });
    expect(pedir("PATCH", "/solicitudes/sol-1/abono", { estado: "PENDIENTE" }).cuerpo).toMatchObject({ abono: null });

    expect(pedir("PATCH", "/solicitudes/sol-1/firmar").status).toBe(409);
    const generada = pedir("PATCH", "/solicitudes/sol-1/generar-constancia", { observaciones: "Nota" });
    expect(generada.pdf).toMatchObject({ nombre: "constancia-SOL-0001.pdf", solicitud: { estado: "REALIZADA", observaciones: "Nota" } });
    pedir("PATCH", "/solicitudes/sol-2/generar-constancia", {});
    expect(solicitud("sol-2").observaciones).toBeNull();
    expect(pedir("GET", "/solicitudes/sol-1/pdf").pdf?.nombre).toBe("constancia-SOL-0001.pdf");

    expect(pedir("PATCH", "/solicitudes/sol-1/firmar").cuerpo).toMatchObject({ estado: "FIRMADA" });
    expect(pedir("PATCH", "/solicitudes/sol-1/entregar", { nombreCompleto: "A", dni: "1" }).status).toBe(409);
    pedir("PATCH", "/solicitudes/sol-1/abono", { estado: "EXENTO" });
    expect(pedir("PATCH", "/solicitudes/sol-1/entregar", { nombreCompleto: "Laura Benítez", dni: "28111222" }).cuerpo).toMatchObject({
      estado: "RETIRADA",
      retiradoPorNombre: "Laura Benítez",
    });
  });

  it("responde 404 a lo que no existe", () => {
    expect(pedir("GET", "/solicitudes/nada").status).toBe(404);
    expect(pedir("POST", "/solicitudes/sol-1").status).toBe(404);
    expect(pedir("PATCH", "/solicitudes/sol-1/otra-cosa").status).toBe(404);
    expect(pedir("GET", "/solicitudes/sol-1/firmar").status).toBe(404);
    expect(pedir("GET", "/solicitudes/a/b/c").status).toBe(404);
  });
});

describe("back simulado · usuarios", () => {
  const nuevo = { nombre: "Eva", apellido: "Paz", email: "eva@ejemplo.com", roleName: "automotores" };

  it("lista, crea, rechaza correos repetidos, edita y reenvía la bienvenida", () => {
    expect((pedir("GET", "/users").cuerpo as { total: number }).total).toBe(4);
    const creado = pedir("POST", "/users", nuevo, { mensajeMails: "Sin mails" });
    expect(creado.cuerpo).toEqual({ message: "Sin mails", userId: "usuario-5" });
    expect(pedir("POST", "/users", nuevo).status).toBe(409);
    expect(pedir("GET", "/users/usuario-5").cuerpo).toMatchObject({ roles: ["AUTOMOTORES"], activo: true });

    expect(pedir("PATCH", "/users/usuario-5", { ...nuevo, email: "ana.lopez@ejemplo.com" }).status).toBe(409);
    expect(pedir("PATCH", "/users/usuario-5", { ...nuevo, nombre: "Eva María", roleName: "admin" }).cuerpo).toMatchObject({
      nombre: "Eva María",
      roles: ["ADMIN"],
    });
    expect(pedir("PATCH", "/users/usuario-5", { apellido: "Gómez" }).cuerpo).toMatchObject({ nombre: "Eva María", apellido: "Gómez", roles: ["ADMIN"] });
    expect(pedir("PATCH", "/users/usuario-5").cuerpo).toMatchObject({ apellido: "Gómez" });
    expect(mensaje(pedir("POST", "/users/usuario-5/reenviar-bienvenida"))).toBe("Correo reenviado");
    expect(mensaje(pedir("POST", "/users", { ...nuevo, email: "otra@ejemplo.com" }))).toBe("Usuario creado");
  });

  it("da de baja y reactiva (US61)", () => {
    expect(pedir("DELETE", "/users/usuario-2").status).toBe(200);
    expect((estado.usuarios[1] as UsuarioApi).activo).toBe(false);
    expect(pedir("PATCH", "/users/usuario-2/reactivar").cuerpo).toMatchObject({ activo: true });
  });

  it("responde 404 a lo que no existe", () => {
    expect(pedir("GET", "/users/nadie").status).toBe(404);
    expect(pedir("PUT", "/users").status).toBe(404);
    expect(pedir("GET", "/users/usuario-1/reactivar").status).toBe(404);
    expect(pedir("PUT", "/users/usuario-1").status).toBe(404);
    expect(mensaje(pedir("GET", "/otra-cosa"))).toBe("Sin mock para GET /otra-cosa");
  });
});

it("distingue lecturas de escrituras", () => {
  expect(esEscritura("get")).toBe(false);
  expect(esEscritura("OPTIONS")).toBe(false);
  expect(esEscritura("patch")).toBe(true);
});
