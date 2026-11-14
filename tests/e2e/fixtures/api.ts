import { test as base, type Page, type Route } from "@playwright/test";

/**
 * Backend en memoria para los E2E de CentralBV.
 *
 * Cada test recibe un `backend` nuevo (fixture `backend`) y todas las llamadas a
 * `http://localhost:3000/**` se resuelven acá. Así los recorridos no dependen de
 * la red ni de una base real y el estado de un test no contamina a otro.
 */

const API = "http://localhost:3000";
const TODOS_LOS_ROLES = ["ADMIN", "ADMINISTRATIVO", "AUTOMOTORES", "COMUN"];
const PASSWORD = "Secreta123";

interface ItemCatalogo {
  id: string;
  valor: string;
  enUso?: number;
}

interface ModeloApi extends ItemCatalogo {
  marcaId: string;
}

interface MovilApi {
  id: string;
  estado: "OPERATIVO" | "OBSERVACIONES" | "FUERA_SERVICIO" | "MANTENIMIENTO" | "BAJA_DEFINITIVA";
  patente: string;
  denominacion: string;
  tipo: ItemCatalogo;
  marca: ItemCatalogo;
  modelo: ModeloApi;
  motivoBaja?: string | null;
}

interface RevisionApi {
  id: string;
  vehiculoId: string;
  nivelAceite: { estado: string; comentario: string | null };
  refrigerante: { estado: string; comentario: string | null };
  frenos: { estado: string; comentario: string | null };
  bateria: { estado: string; comentario: string | null };
  presionNeumaticos: { estado: string; comentario: string | null };
  lucesYBalizas: { estado: string; comentario: string | null };
  sirenaYComunicaciones: { estado: string; comentario: string | null };
  comentarioGeneral: string | null;
  revisadoPor: { id: string; nombre: string } | null;
  creadoEn: string;
}

interface AbonoApi {
  estado: "PENDIENTE" | "ABONADO" | "EXENTO";
  monto: number | null;
  metodoPago: string | null;
  fechaPago: string;
  motivoExento: string | null;
}

interface SolicitudApi {
  id: string;
  numero: string;
  estado: "PENDIENTE" | "REALIZADA" | "FIRMADA" | "RETIRADA" | "CANCELADA";
  fechaAlta: string;
  damnificado: { nombre: string; dni: string; telefono: string | null };
  siniestro: {
    tipo: "VIVIENDA" | "VEHICULAR";
    fecha: string;
    hora: string;
    direccion: string;
    numeroParte: string;
    motivo: string;
    localidad: string;
    partido: string;
    perdidas: string;
    patenteVehiculo: string | null;
  };
  constancia: { destino: "SEGURO" | "ACCION_SOCIAL"; razonSocial: string; numeroPoliza: string | null };
  abono: AbonoApi | null;
  observaciones: string | null;
  motivoCancelacion: string | null;
  canceladoEn: string | null;
  retiradoEn: string | null;
  retiradoPorNombre: string | null;
  retiradoPorDni: string | null;
}

interface UsuarioApi {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  activo: boolean;
  roles: string[];
}

export interface EstadoBackend {
  moviles: MovilApi[];
  tipos: ItemCatalogo[];
  marcas: ItemCatalogo[];
  modelos: ModeloApi[];
  revisiones: Record<string, RevisionApi[]>;
  solicitudes: SolicitudApi[];
  usuarios: UsuarioApi[];
  rolesDeLogin: string[];
  siguienteMovil: number;
  siguienteSolicitud: number;
}

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

const solicitud = (
  id: string,
  numero: string,
  estado: SolicitudApi["estado"],
  nombre: string,
  extra: Partial<SolicitudApi> = {},
): SolicitudApi => ({
  id,
  numero,
  estado,
  fechaAlta: "2026-10-12T13:05:00.000Z",
  damnificado: { nombre, dni: "30123456", telefono: "1144445555" },
  siniestro: {
    tipo: "VIVIENDA",
    fecha: "2026-10-12",
    hora: "15:07",
    direccion: "Av. Mitre 1250",
    numeroParte: "212",
    motivo: "Incendio de vivienda",
    localidad: "José C. Paz",
    partido: "José C. Paz",
    perdidas: "No se estiman",
    patenteVehiculo: null,
  },
  constancia: { destino: "SEGURO", razonSocial: "SANCOR SEGUROS", numeroPoliza: "POL-1" },
  abono: null,
  observaciones: null,
  motivoCancelacion: null,
  canceladoEn: null,
  retiradoEn: null,
  retiradoPorNombre: null,
  retiradoPorDni: null,
  ...extra,
});

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
    solicitudes: [
      solicitud("sol-1", "SOL-0001", "PENDIENTE", "Roberto Acosta"),
      solicitud("sol-2", "SOL-0002", "REALIZADA", "Marta Gómez", {
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
      solicitud("sol-3", "SOL-0003", "FIRMADA", "Lucía Fernández"),
      solicitud("sol-4", "SOL-0004", "FIRMADA", "Pedro Ramírez", {
        abono: abono("ABONADO", 12000, "TRANSFERENCIA"),
      }),
      solicitud("sol-5", "SOL-0005", "RETIRADA", "Ana Torres", {
        abono: abono("EXENTO"),
        retiradoEn: "2026-10-16T14:10:00.000Z",
        retiradoPorNombre: "Ana Torres",
        retiradoPorDni: "30123456",
      }),
      solicitud("sol-6", "SOL-0006", "CANCELADA", "Jorge Díaz", {
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
  };
}

export const tokenDePrueba = (roles: string[] = TODOS_LOS_ROLES): string =>
  `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 60 * 60, roles }))}.firma`;

export async function abrirConSesion(page: Page, ruta: string, roles: string[] = TODOS_LOS_ROLES): Promise<void> {
  await page.addInitScript((valor) => window.localStorage.setItem("centralbv.token", valor), tokenDePrueba(roles));
  await page.goto(ruta);
}

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({
    status,
    contentType: "application/json",
    headers: { "access-control-allow-origin": "*" },
    body: JSON.stringify(body),
  });

const pdf = (route: Route, filename = "constancia-SOL-0001.pdf") =>
  route.fulfill({
    status: 200,
    contentType: "application/pdf",
    headers: {
      "access-control-allow-origin": "*",
      "content-disposition": `attachment; filename="${filename}"`,
    },
    body: "%PDF-1.4\n% CentralBV constancia de prueba\n%%EOF",
  });

const error = (route: Route, status: number, message: string, extra: Record<string, unknown> = {}) =>
  json(route, status, { statusCode: status, message, ...extra });

const normalizar = (texto: string) => texto.toLowerCase().replace(/[^a-z0-9]/g, "");

function pagina<T>(items: T[], url: URL) {
  const porPagina = Number(url.searchParams.get("porPagina") ?? 20);
  const paginaPedida = Number(url.searchParams.get("pagina") ?? 1);
  const paginas = Math.max(1, Math.ceil(items.length / porPagina));
  const actual = Math.min(Math.max(1, paginaPedida), paginas);
  const inicio = (actual - 1) * porPagina;
  return {
    items: items.slice(inicio, inicio + porPagina),
    total: items.length,
    pagina: actual,
    paginas,
    porPagina,
  };
}

const porFecha = (a: SolicitudApi, b: SolicitudApi, orden: string) =>
  orden === "asc" ? a.fechaAlta.localeCompare(b.fechaAlta) : b.fechaAlta.localeCompare(a.fechaAlta);

const filtrarSolicitudes = (solicitudes: SolicitudApi[], url: URL) => {
  const busqueda = normalizar(url.searchParams.get("busqueda") ?? "");
  const estado = url.searchParams.get("estado");
  return solicitudes
    .filter((s) => (estado ? s.estado === estado : true))
    .filter((s) =>
      busqueda
        ? [s.numero, s.damnificado.nombre, s.damnificado.dni].some((valor) => normalizar(valor).includes(busqueda))
        : true,
    )
    .sort((a, b) => porFecha(a, b, url.searchParams.get("orden") ?? "desc"));
};

function manejar(backend: Backend, route: Route): Promise<unknown> {
  const peticion = route.request();
  const metodo = peticion.method();
  const url = new URL(peticion.url());
  const path = url.pathname;
  const estado = backend.estado;

  if (metodo === "OPTIONS") {
    return route.fulfill({
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "access-control-allow-headers": "authorization,content-type,accept",
      },
    });
  }

  /* ---------- Auth ---------- */
  if (metodo === "POST" && path === "/auth/login") {
    const cuerpo = peticion.postDataJSON() as { email?: string; password?: string };
    if (!cuerpo.email?.endsWith("@centralbv.test") || cuerpo.password !== PASSWORD) {
      return error(route, 401, "Credenciales inválidas");
    }
    return json(route, 200, {
      access_token: tokenDePrueba(estado.rolesDeLogin),
      user: { id: "usuario-1", nombre: "Juan", email: cuerpo.email, roles: estado.rolesDeLogin },
    });
  }
  if (metodo === "POST" && path === "/auth/forgot-password") {
    return json(route, 200, { message: "Si la cuenta existe, enviamos el enlace." });
  }
  if (metodo === "POST" && path === "/auth/reset-password") {
    const cuerpo = peticion.postDataJSON() as { token?: string; newPassword?: string };
    if (!cuerpo.token) return error(route, 400, "El enlace expiró o ya fue utilizado.");
    if (cuerpo.newPassword === "Igual1234") {
      return error(route, 400, "La contraseña nueva no puede ser igual a la anterior.");
    }
    return json(route, 200, { message: "Contraseña actualizada." });
  }

  /* ---------- Catálogos ---------- */
  const catalogo = path.match(/^\/flota\/catalogos\/(tipos|marcas|modelos)$/);
  if (catalogo) {
    const clave = catalogo[1] as "tipos" | "marcas" | "modelos";
    if (metodo === "GET") return json(route, 200, estado[clave]);
    if (metodo === "POST") {
      const cuerpo = peticion.postDataJSON() as { valor?: string; marcaId?: string };
      const id = `${clave}-${estado[clave].length + 1}`;
      const item = { id, valor: cuerpo.valor ?? "Nuevo", enUso: 0, ...(clave === "modelos" && { marcaId: cuerpo.marcaId }) };
      estado[clave].push(item);
      return json(route, 201, item);
    }
  }

  const catalogoItem = path.match(/^\/flota\/catalogos\/(tipos|marcas|modelos)\/([^/]+)(\/desactivar)?$/);
  if (catalogoItem) {
    const clave = catalogoItem[1] as "tipos" | "marcas" | "modelos";
    const id = catalogoItem[2];
    if (metodo === "PATCH" && catalogoItem[3]) {
      const item = estado[clave].find((i) => i.id === id);
      if (!item) return error(route, 404, "No encontrado");
      if (item.enUso) return error(route, 409, "El ítem está en uso");
      estado[clave] = estado[clave].filter((i) => i.id !== id) as typeof estado[typeof clave];
      return json(route, 200, {});
    }
    if (metodo === "PATCH") {
      const cuerpo = peticion.postDataJSON() as { valor?: string };
      const item = estado[clave].find((i) => i.id === id);
      if (!item) return error(route, 404, "No encontrado");
      item.valor = cuerpo.valor ?? item.valor;
      return json(route, 200, item);
    }
  }

  /* ---------- Flota ---------- */
  if (metodo === "GET" && path === "/flota/vehiculos/resumen") {
    const activos = estado.moviles.filter((m) => m.estado !== "BAJA_DEFINITIVA");
    return json(route, 200, {
      total: activos.length,
      porEstado: activos.reduce<Record<string, number>>((acc, m) => ({ ...acc, [m.estado]: (acc[m.estado] ?? 0) + 1 }), {}),
    });
  }
  if (metodo === "GET" && path === "/flota/vehiculos") {
    const busqueda = normalizar(url.searchParams.get("busqueda") ?? "");
    const estadoFiltro = url.searchParams.get("estado");
    const tipoId = url.searchParams.get("tipoId");
    const items = estado.moviles
      .filter((m) => m.estado !== "BAJA_DEFINITIVA")
      .filter((m) => (estadoFiltro ? m.estado === estadoFiltro : true))
      .filter((m) => (tipoId ? m.tipo.id === tipoId : true))
      .filter((m) => (busqueda ? [m.denominacion, m.patente].some((v) => normalizar(v).includes(busqueda)) : true));
    return json(route, 200, { items, total: items.length });
  }
  if (metodo === "POST" && path === "/flota/vehiculos") {
    const cuerpo = peticion.postDataJSON() as {
      denominacion: string;
      patente: string;
      tipoId: string;
      marcaId: string;
      modeloId: string;
    };
    const tipo = estado.tipos.find((t) => t.id === cuerpo.tipoId) ?? estado.tipos[0];
    const marca = estado.marcas.find((m) => m.id === cuerpo.marcaId) ?? estado.marcas[0];
    const modelo = estado.modelos.find((m) => m.id === cuerpo.modeloId) ?? estado.modelos[0];
    if (estado.moviles.some((m) => m.denominacion === cuerpo.denominacion)) {
      return error(route, 409, "Ya existe un móvil con ese número interno.", { campo: "denominacion" });
    }
    if (estado.moviles.some((m) => m.patente === cuerpo.patente)) {
      return error(route, 409, "Ya existe un móvil con esa patente.", { campo: "patente" });
    }
    const nuevo: MovilApi = {
      id: `movil-${estado.siguienteMovil}`,
      estado: "OPERATIVO",
      patente: cuerpo.patente,
      denominacion: cuerpo.denominacion,
      tipo,
      marca,
      modelo,
    };
    estado.siguienteMovil += 1;
    estado.moviles.push(nuevo);
    return json(route, 201, nuevo);
  }

  const baja = path.match(/^\/flota\/vehiculos\/([^/]+)\/baja$/);
  if (baja && metodo === "PATCH") {
    const movil = estado.moviles.find((m) => m.id === baja[1]);
    if (!movil) return error(route, 404, "Móvil no encontrado");
    const cuerpo = peticion.postDataJSON() as { motivo?: string };
    movil.estado = "BAJA_DEFINITIVA";
    movil.motivoBaja = cuerpo.motivo ?? null;
    return json(route, 200, movil);
  }

  const revisiones = path.match(/^\/flota\/vehiculos\/([^/]+)\/revisiones$/);
  if (revisiones) {
    const movilId = revisiones[1];
    const movil = estado.moviles.find((m) => m.id === movilId);
    if (!movil) return error(route, 404, "Móvil no encontrado");
    if (movil.estado === "BAJA_DEFINITIVA") return error(route, 409, "El móvil está dado de baja.");
    const lista = estado.revisiones[movilId] ?? [];
    if (metodo === "GET") return json(route, 200, pagina(lista, url));
    if (metodo === "POST") {
      const cuerpo = peticion.postDataJSON() as Record<string, { estado?: string; comentario?: string | null } | string | null>;
      const claves = [
        "nivelAceite",
        "refrigerante",
        "frenos",
        "bateria",
        "presionNeumaticos",
        "lucesYBalizas",
        "sirenaYComunicaciones",
      ] as const;
      const item = (clave: (typeof claves)[number]) => {
        const valor = cuerpo[clave] as { estado?: string; comentario?: string | null } | undefined;
        return { estado: valor?.estado ?? "OK", comentario: valor?.comentario ?? null };
      };
      const nueva: RevisionApi = {
        id: `revision-${lista.length + 1}`,
        vehiculoId: movilId,
        nivelAceite: item("nivelAceite"),
        refrigerante: item("refrigerante"),
        frenos: item("frenos"),
        bateria: item("bateria"),
        presionNeumaticos: item("presionNeumaticos"),
        lucesYBalizas: item("lucesYBalizas"),
        sirenaYComunicaciones: item("sirenaYComunicaciones"),
        comentarioGeneral: typeof cuerpo.comentarioGeneral === "string" ? cuerpo.comentarioGeneral : null,
        revisadoPor: { id: "usuario-1", nombre: "Juan Pérez" },
        creadoEn: new Date().toISOString(),
      };
      lista.unshift(nueva);
      estado.revisiones[movilId] = lista;
      const criticos = claves.filter((clave) => nueva[clave].estado === "CRITICO");
      const atenciones = claves.filter((clave) => nueva[clave].estado === "ADVERTENCIA");
      movil.estado = criticos.length ? "FUERA_SERVICIO" : atenciones.length ? "OBSERVACIONES" : "OPERATIVO";
      return json(route, 201, nueva);
    }
  }

  const revisionDetalle = path.match(/^\/flota\/vehiculos\/([^/]+)\/revisiones\/([^/]+)$/);
  if (revisionDetalle && metodo === "GET") {
    const encontrada = (estado.revisiones[revisionDetalle[1]] ?? []).find((r) => r.id === revisionDetalle[2]);
    return encontrada ? json(route, 200, encontrada) : error(route, 404, "Revisión no encontrada");
  }

  const movil = path.match(/^\/flota\/vehiculos\/([^/]+)$/);
  if (movil) {
    const encontrado = estado.moviles.find((m) => m.id === movil[1]);
    if (!encontrado) return error(route, 404, "Móvil no encontrado");
    if (metodo === "GET") return json(route, 200, encontrado);
    if (metodo === "PATCH") {
      const cuerpo = peticion.postDataJSON() as {
        denominacion: string;
        patente: string;
        tipoId: string;
        marcaId: string;
        modeloId: string;
      };
      encontrado.denominacion = cuerpo.denominacion;
      encontrado.patente = cuerpo.patente;
      encontrado.tipo = estado.tipos.find((t) => t.id === cuerpo.tipoId) ?? encontrado.tipo;
      encontrado.marca = estado.marcas.find((m) => m.id === cuerpo.marcaId) ?? encontrado.marca;
      encontrado.modelo = estado.modelos.find((m) => m.id === cuerpo.modeloId) ?? encontrado.modelo;
      return json(route, 200, encontrado);
    }
  }

  /* ---------- Solicitudes ---------- */
  if (metodo === "GET" && path === "/solicitudes/completadas") {
    const retiradas = filtrarSolicitudes(
      estado.solicitudes.filter((s) => s.estado === "RETIRADA"),
      url,
    );
    return json(route, 200, pagina(retiradas, url));
  }
  if (metodo === "GET" && path === "/solicitudes") {
    const activas = filtrarSolicitudes(
      estado.solicitudes.filter((s) => s.estado !== "RETIRADA"),
      url,
    );
    return json(route, 200, pagina(activas, url));
  }
  if (metodo === "POST" && path === "/solicitudes") {
    const cuerpo = peticion.postDataJSON() as {
      damnificado: SolicitudApi["damnificado"];
      siniestro: SolicitudApi["siniestro"];
      constancia: SolicitudApi["constancia"];
    };
    const numero = `SOL-${String(estado.siguienteSolicitud).padStart(4, "0")}`;
    const nueva = solicitud(`sol-${estado.siguienteSolicitud}`, numero, "PENDIENTE", cuerpo.damnificado.nombre, {
      fechaAlta: new Date().toISOString(),
      damnificado: cuerpo.damnificado,
      siniestro: cuerpo.siniestro,
      constancia: cuerpo.constancia,
    });
    estado.siguienteSolicitud += 1;
    estado.solicitudes.push(nueva);
    return json(route, 201, nueva);
  }

  const cancelar = path.match(/^\/solicitudes\/([^/]+)\/cancelar$/);
  if (cancelar && metodo === "PATCH") {
    const encontrada = estado.solicitudes.find((s) => s.id === cancelar[1]);
    if (!encontrada) return error(route, 404, "Solicitud no encontrada");
    if (encontrada.estado !== "PENDIENTE") return error(route, 409, "La solicitud ya no se puede cancelar.");
    encontrada.estado = "CANCELADA";
    encontrada.motivoCancelacion = (peticion.postDataJSON() as { motivo: string }).motivo;
    encontrada.canceladoEn = new Date().toISOString();
    return json(route, 200, encontrada);
  }

  const abonoPatch = path.match(/^\/solicitudes\/([^/]+)\/abono$/);
  if (abonoPatch && metodo === "PATCH") {
    const encontrada = estado.solicitudes.find((s) => s.id === abonoPatch[1]);
    if (!encontrada) return error(route, 404, "Solicitud no encontrada");
    const cuerpo = peticion.postDataJSON() as {
      estado: AbonoApi["estado"];
      monto?: number | null;
      metodoPago?: string | null;
      motivoExento?: string | null;
    };
    encontrada.abono =
      cuerpo.estado === "PENDIENTE"
        ? null
        : {
            estado: cuerpo.estado,
            monto: cuerpo.monto ?? null,
            metodoPago: cuerpo.metodoPago ?? null,
            fechaPago: new Date().toISOString(),
            motivoExento: cuerpo.motivoExento ?? null,
          };
    return json(route, 200, encontrada);
  }

  const generar = path.match(/^\/solicitudes\/([^/]+)\/generar-constancia$/);
  if (generar && metodo === "PATCH") {
    const encontrada = estado.solicitudes.find((s) => s.id === generar[1]);
    if (!encontrada) return error(route, 404, "Solicitud no encontrada");
    encontrada.estado = "REALIZADA";
    encontrada.observaciones = (peticion.postDataJSON() as { observaciones?: string | null }).observaciones ?? null;
    return pdf(route, `constancia-${encontrada.numero}.pdf`);
  }

  const firmar = path.match(/^\/solicitudes\/([^/]+)\/firmar$/);
  if (firmar && metodo === "PATCH") {
    const encontrada = estado.solicitudes.find((s) => s.id === firmar[1]);
    if (!encontrada) return error(route, 404, "Solicitud no encontrada");
    if (encontrada.estado !== "REALIZADA") return error(route, 409, "La constancia todavía no fue generada.");
    encontrada.estado = "FIRMADA";
    return json(route, 200, encontrada);
  }

  const entregar = path.match(/^\/solicitudes\/([^/]+)\/entregar$/);
  if (entregar && metodo === "PATCH") {
    const encontrada = estado.solicitudes.find((s) => s.id === entregar[1]);
    if (!encontrada) return error(route, 404, "Solicitud no encontrada");
    if (encontrada.abono?.estado === "PENDIENTE" || !encontrada.abono) {
      return error(route, 409, "El arancel está pendiente.");
    }
    const cuerpo = peticion.postDataJSON() as { nombreCompleto: string; dni: string };
    encontrada.estado = "RETIRADA";
    encontrada.retiradoEn = new Date().toISOString();
    encontrada.retiradoPorNombre = cuerpo.nombreCompleto;
    encontrada.retiradoPorDni = cuerpo.dni;
    return json(route, 200, encontrada);
  }

  const pdfSolicitud = path.match(/^\/solicitudes\/([^/]+)\/pdf$/);
  if (pdfSolicitud && metodo === "GET") {
    const encontrada = estado.solicitudes.find((s) => s.id === pdfSolicitud[1]);
    if (!encontrada) return error(route, 404, "Solicitud no encontrada");
    return pdf(route, `constancia-${encontrada.numero}.pdf`);
  }

  const solicitudDetalle = path.match(/^\/solicitudes\/([^/]+)$/);
  if (solicitudDetalle) {
    const encontrada = estado.solicitudes.find((s) => s.id === solicitudDetalle[1]);
    if (!encontrada) return error(route, 404, "Solicitud no encontrada");
    if (metodo === "GET") return json(route, 200, encontrada);
    if (metodo === "PUT") {
      const cuerpo = peticion.postDataJSON() as {
        damnificado: SolicitudApi["damnificado"];
        siniestro: SolicitudApi["siniestro"];
        constancia: SolicitudApi["constancia"];
      };
      encontrada.damnificado = cuerpo.damnificado;
      encontrada.siniestro = cuerpo.siniestro;
      encontrada.constancia = cuerpo.constancia;
      return json(route, 200, encontrada);
    }
  }

  /* ---------- Usuarios ---------- */
  if (metodo === "GET" && path === "/users") {
    return json(route, 200, pagina(estado.usuarios, url));
  }
  if (metodo === "POST" && path === "/users") {
    const cuerpo = peticion.postDataJSON() as {
      nombre: string;
      apellido: string;
      email: string;
      roleName: string;
    };
    if (estado.usuarios.some((u) => u.email === cuerpo.email)) {
      return error(route, 409, "Ya existe un usuario con ese correo electrónico.");
    }
    const nuevo: UsuarioApi = {
      id: `usuario-${estado.usuarios.length + 1}`,
      email: cuerpo.email,
      nombre: cuerpo.nombre,
      apellido: cuerpo.apellido,
      activo: true,
      roles: [cuerpo.roleName.toUpperCase()],
    };
    estado.usuarios.push(nuevo);
    return json(route, 201, { message: "Usuario creado", userId: nuevo.id });
  }

  const reenviar = path.match(/^\/users\/([^/]+)\/reenviar-bienvenida$/);
  if (reenviar && metodo === "POST") {
    return json(route, 200, { message: "Correo reenviado" });
  }

  const usuario = path.match(/^\/users\/([^/]+)$/);
  if (usuario) {
    const encontrado = estado.usuarios.find((u) => u.id === usuario[1]);
    if (!encontrado) return error(route, 404, "Usuario no encontrado");
    if (metodo === "GET") return json(route, 200, encontrado);
    if (metodo === "PATCH") {
      /* PATCH es parcial: el formulario manda solo los campos modificados. */
      const cuerpo = (peticion.postDataJSON() ?? {}) as Partial<{
        nombre: string;
        apellido: string;
        email: string;
        roleName: string;
      }>;
      if (cuerpo.nombre !== undefined) encontrado.nombre = cuerpo.nombre;
      if (cuerpo.apellido !== undefined) encontrado.apellido = cuerpo.apellido;
      if (cuerpo.email !== undefined) encontrado.email = cuerpo.email;
      if (cuerpo.roleName) encontrado.roles = [cuerpo.roleName.toUpperCase()];
      return json(route, 200, encontrado);
    }
  }

  return error(route, 404, `Sin mock para ${metodo} ${path}`);
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
export const credenciales = { email: "admin@centralbv.test", password: PASSWORD };
