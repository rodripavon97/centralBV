/**
 * Back simulado de CentralBV: resuelve en memoria los mismos endpoints que el back real.
 *
 * Lo usan dos lugares:
 * - el modo demo (US58), a través del adapter de axios de `src/demo/adaptadorDemo.ts`;
 * - los E2E, que lo conectan a Playwright en `tests/e2e/fixtures/api.ts`.
 *
 * Es lógica pura: no toca la red, el DOM ni localStorage. Recibe el estado, el pedido y
 * devuelve la respuesta (y muta el estado). Por eso no usa el alias `@/`: Playwright lo
 * importa con una ruta relativa.
 */

/* ---------- Tipos de la API ---------- */

export interface ItemCatalogo {
  id: string;
  valor: string;
  enUso?: number;
}

export interface ModeloApi extends ItemCatalogo {
  marcaId: string;
}

export interface MovilApi {
  id: string;
  estado: "OPERATIVO" | "OBSERVACIONES" | "FUERA_SERVICIO" | "MANTENIMIENTO" | "BAJA_DEFINITIVA";
  patente: string;
  denominacion: string;
  tipo: ItemCatalogo;
  marca: ItemCatalogo;
  modelo: ModeloApi;
  motivoBaja?: string | null;
}

/** Buche (compartimento) de un móvil, como lo devuelve el back de US17. */
export interface CompartimentoApi {
  id: string;
  nombre: string;
  zona: "LADO_CONDUCTOR" | "LADO_ACOMPANANTE" | "TRASERO" | "TECHO" | "CABINA";
  orden: number;
  estado: "OPERATIVO" | "OBSERVACIONES" | "DANADO" | "FUERA_DE_USO";
}

export interface ItemRevisionApi {
  estado: string;
  comentario: string | null;
}

export interface RevisionApi {
  id: string;
  vehiculoId: string;
  nivelAceite: ItemRevisionApi;
  refrigerante: ItemRevisionApi;
  frenos: ItemRevisionApi;
  bateria: ItemRevisionApi;
  presionNeumaticos: ItemRevisionApi;
  lucesYBalizas: ItemRevisionApi;
  sirenaYComunicaciones: ItemRevisionApi;
  comentarioGeneral: string | null;
  revisadoPor: { id: string; nombre: string } | null;
  creadoEn: string;
}

export interface AbonoApi {
  estado: "PENDIENTE" | "ABONADO" | "EXENTO";
  monto: number | null;
  metodoPago: string | null;
  fechaPago: string;
  motivoExento: string | null;
}

export interface SolicitudApi {
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

export interface UsuarioApi {
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
  compartimentos: Record<string, CompartimentoApi[]>;
  siguienteCompartimento: number;
  solicitudes: SolicitudApi[];
  usuarios: UsuarioApi[];
  rolesDeLogin: string[];
  siguienteMovil: number;
  siguienteSolicitud: number;
  /** Quien firma las revisiones que se registran. */
  usuarioActual: { id: string; nombre: string };
}

/* ---------- Pedido y respuesta ---------- */

export interface PedidoSimulado {
  metodo: string;
  /** URL completa, con los query params. */
  url: URL;
  /** Cuerpo ya parseado (JSON). */
  cuerpo?: unknown;
}

export interface RespuestaSimulada {
  status: number;
  cuerpo?: unknown;
  /** La respuesta es el PDF de una constancia: cada adaptador decide cómo armarlo. */
  pdf?: { nombre: string; solicitud: SolicitudApi };
}

export interface OpcionesBack {
  /** Mensaje para los endpoints que en el back real mandan mails. */
  mensajeMails?: string;
}

export const TODOS_LOS_ROLES = ["ADMIN", "ADMINISTRATIVO", "AUTOMOTORES", "COMUN"];
export const PASSWORD_DE_PRUEBA = "Secreta123";
export const DOMINIO_DE_PRUEBA = "@centralbv.test";

/* ---------- Ayudas ---------- */

const ok = (cuerpo: unknown, status = 200): RespuestaSimulada => ({ status, cuerpo });

const error = (status: number, message: string, extra: Record<string, unknown> = {}): RespuestaSimulada => ({
  status,
  cuerpo: { statusCode: status, message, ...extra },
});

/** Para buscar sin importar mayúsculas, tildes ni separadores ("Benítez" ≈ "benitez", "AC 303" ≈ "ac303"). */
const normalizar = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** Id con forma de UUID: el front solo acepta un tipo, una revisión o un buche en la URL si lo es. */
export const uuidSimulado = (prefijo: string, n: number) => `${prefijo}-0000-4000-8000-${String(n).padStart(12, "0")}`;

/** Primer id libre de la forma `crear(n)`, empezando por el tamaño de la lista + 1. */
function idLibre(lista: { id: string }[], crear: (n: number) => string): string {
  const usados = new Set(lista.map((item) => item.id));
  let n = lista.length + 1;
  while (usados.has(crear(n))) n += 1;
  return crear(n);
}

const PREFIJO_CATALOGO = { tipos: "10000000", marcas: "20000000", modelos: "30000000" } as const;
const PREFIJO_REVISION = "40000000";

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

/** Solicitud con valores por defecto: la usan los datos de prueba y el alta. */
export const crearSolicitud = (
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

/** Token con la forma de un JWT (sin firma real), con roles y vencimiento. */
export function tokenSimulado(roles: string[], segundosDeVida = 60 * 60, extra: Record<string, unknown> = {}): string {
  const payload = { exp: Math.floor(Date.now() / 1000) + segundosDeVida, roles, ...extra };
  return `header.${btoa(JSON.stringify(payload))}.firma`;
}

const CLAVES_REVISION = [
  "nivelAceite",
  "refrigerante",
  "frenos",
  "bateria",
  "presionNeumaticos",
  "lucesYBalizas",
  "sirenaYComunicaciones",
] as const;

const ZONAS: CompartimentoApi["zona"][] = ["LADO_CONDUCTOR", "LADO_ACOMPANANTE", "TRASERO", "TECHO", "CABINA"];

/** Arma los buches de "Generar buches" igual que el back (US17). */
export function planDeBuches(cantidades: {
  ladoConductor?: number;
  ladoAcompanante?: number;
  trasero?: number;
  techo?: boolean;
  cabina?: boolean;
}): { nombre: string; zona: CompartimentoApi["zona"]; orden: number }[] {
  const plan: [string, CompartimentoApi["zona"], number][] = [
    ["LC", "LADO_CONDUCTOR", Number(cantidades.ladoConductor ?? 0)],
    ["LA", "LADO_ACOMPANANTE", Number(cantidades.ladoAcompanante ?? 0)],
    ["TR", "TRASERO", Number(cantidades.trasero ?? 0)],
    ["TE", "TECHO", cantidades.techo ? 1 : 0],
    ["CB", "CABINA", cantidades.cabina ? 1 : 0],
  ];
  return plan.flatMap(([prefijo, zona, cantidad]) =>
    Array.from({ length: cantidad }, (_, i) => ({ nombre: `${prefijo}-${i + 1}`, zona, orden: i + 1 })),
  );
}

/* ---------- Endpoints ---------- */

type Manejador = (estado: EstadoBackend, pedido: PedidoSimulado, opciones: OpcionesBack) => RespuestaSimulada | null;

const cuerpoDe = <T>(pedido: PedidoSimulado) => (pedido.cuerpo ?? {}) as T;

const auth: Manejador = (estado, pedido, opciones) => {
  const { metodo, url } = pedido;
  const path = url.pathname;
  if (metodo !== "POST") return null;
  if (path === "/auth/login") {
    const cuerpo = cuerpoDe<{ email?: string; password?: string }>(pedido);
    if (!cuerpo.email?.endsWith(DOMINIO_DE_PRUEBA) || cuerpo.password !== PASSWORD_DE_PRUEBA) {
      return error(401, "Credenciales inválidas");
    }
    return ok({
      access_token: tokenSimulado(estado.rolesDeLogin),
      user: { id: "usuario-1", nombre: "Juan", email: cuerpo.email, roles: estado.rolesDeLogin },
    });
  }
  if (path === "/auth/forgot-password") {
    return ok({ message: opciones.mensajeMails ?? "Si la cuenta existe, enviamos el enlace." });
  }
  if (path === "/auth/reset-password") {
    const cuerpo = cuerpoDe<{ token?: string; newPassword?: string }>(pedido);
    if (!cuerpo.token) return error(400, "El enlace expiró o ya fue utilizado.");
    if (cuerpo.newPassword === "Igual1234") return error(400, "La contraseña nueva no puede ser igual a la anterior.");
    return ok({ message: "Contraseña actualizada." });
  }
  return null;
};

const catalogos: Manejador = (estado, pedido) => {
  const { metodo, url } = pedido;
  const path = url.pathname;

  const catalogo = path.match(/^\/flota\/catalogos\/(tipos|marcas|modelos)$/);
  if (catalogo) {
    const clave = catalogo[1] as "tipos" | "marcas" | "modelos";
    if (metodo === "GET") return ok(estado[clave]);
    if (metodo === "POST") {
      const cuerpo = cuerpoDe<{ valor?: string; marcaId?: string }>(pedido);
      const id = idLibre(estado[clave], (n) => uuidSimulado(PREFIJO_CATALOGO[clave], n));
      const item = { id, valor: cuerpo.valor ?? "Nuevo", enUso: 0, ...(clave === "modelos" && { marcaId: cuerpo.marcaId }) };
      (estado[clave] as ItemCatalogo[]).push(item);
      return ok(item, 201);
    }
  }

  const catalogoItem = path.match(/^\/flota\/catalogos\/(tipos|marcas|modelos)\/([^/]+)(\/desactivar)?$/);
  if (catalogoItem && metodo === "PATCH") {
    const clave = catalogoItem[1] as "tipos" | "marcas" | "modelos";
    const id = catalogoItem[2];
    const item = estado[clave].find((i) => i.id === id);
    if (!item) return error(404, "No encontrado");
    if (catalogoItem[3]) {
      if (item.enUso) return error(409, "El ítem está en uso");
      const lista = estado[clave] as ItemCatalogo[];
      lista.splice(lista.indexOf(item), 1);
      return ok({});
    }
    item.valor = cuerpoDe<{ valor?: string }>(pedido).valor ?? item.valor;
    return ok(item);
  }
  return null;
};

/** Recalcula cuántos móviles usan cada ítem de catálogo (para no desactivar uno en uso). */
function recontarCatalogos(estado: EstadoBackend) {
  const contar = (lista: ItemCatalogo[], clave: "tipo" | "marca" | "modelo") => {
    for (const item of lista) item.enUso = estado.moviles.filter((m) => m[clave].id === item.id).length;
  };
  contar(estado.tipos, "tipo");
  contar(estado.marcas, "marca");
  contar(estado.modelos, "modelo");
}

interface CuerpoMovil {
  denominacion: string;
  patente: string;
  tipoId: string;
  marcaId: string;
  modeloId: string;
}

const flota: Manejador = (estado, pedido) => {
  const { metodo, url } = pedido;
  const path = url.pathname;

  if (metodo === "GET" && path === "/flota/vehiculos/resumen") {
    const activos = estado.moviles.filter((m) => m.estado !== "BAJA_DEFINITIVA");
    return ok({
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
    return ok({ items, total: items.length });
  }
  if (metodo === "POST" && path === "/flota/vehiculos") {
    const cuerpo = cuerpoDe<CuerpoMovil>(pedido);
    if (estado.moviles.some((m) => m.denominacion === cuerpo.denominacion)) {
      return error(409, "Ya existe un móvil con ese número interno.", { campo: "denominacion" });
    }
    if (estado.moviles.some((m) => m.patente === cuerpo.patente)) {
      return error(409, "Ya existe un móvil con esa patente.", { campo: "patente" });
    }
    const nuevo: MovilApi = {
      id: `movil-${estado.siguienteMovil}`,
      estado: "OPERATIVO",
      patente: cuerpo.patente,
      denominacion: cuerpo.denominacion,
      tipo: estado.tipos.find((t) => t.id === cuerpo.tipoId) ?? estado.tipos[0],
      marca: estado.marcas.find((m) => m.id === cuerpo.marcaId) ?? estado.marcas[0],
      modelo: estado.modelos.find((m) => m.id === cuerpo.modeloId) ?? estado.modelos[0],
    };
    estado.siguienteMovil += 1;
    estado.moviles.push(nuevo);
    recontarCatalogos(estado);
    return ok(nuevo, 201);
  }

  const baja = path.match(/^\/flota\/vehiculos\/([^/]+)\/baja$/);
  if (baja && metodo === "PATCH") {
    const movil = estado.moviles.find((m) => m.id === baja[1]);
    if (!movil) return error(404, "Móvil no encontrado");
    movil.estado = "BAJA_DEFINITIVA";
    movil.motivoBaja = cuerpoDe<{ motivo?: string }>(pedido).motivo ?? null;
    return ok(movil);
  }

  const revisionDetalle = path.match(/^\/flota\/vehiculos\/([^/]+)\/revisiones\/([^/]+)$/);
  if (revisionDetalle && metodo === "GET") {
    const encontrada = (estado.revisiones[revisionDetalle[1]] ?? []).find((r) => r.id === revisionDetalle[2]);
    return encontrada ? ok(encontrada) : error(404, "Revisión no encontrada");
  }

  const revisiones = path.match(/^\/flota\/vehiculos\/([^/]+)\/revisiones$/);
  if (revisiones) {
    const movilId = revisiones[1];
    const movil = estado.moviles.find((m) => m.id === movilId);
    if (!movil) return error(404, "Móvil no encontrado");
    if (movil.estado === "BAJA_DEFINITIVA") return error(409, "El móvil está dado de baja.");
    const lista = estado.revisiones[movilId] ?? [];
    if (metodo === "GET") return ok(pagina(lista, url));
    if (metodo === "POST") {
      const cuerpo = cuerpoDe<Record<string, Partial<ItemRevisionApi> | string | null>>(pedido);
      const item = (clave: (typeof CLAVES_REVISION)[number]) => {
        const valor = cuerpo[clave] as Partial<ItemRevisionApi> | undefined;
        return { estado: valor?.estado ?? "OK", comentario: valor?.comentario ?? null };
      };
      const todas = Object.values(estado.revisiones).flat();
      const nueva: RevisionApi = {
        id: idLibre(todas, (n) => uuidSimulado(PREFIJO_REVISION, n)),
        vehiculoId: movilId,
        nivelAceite: item("nivelAceite"),
        refrigerante: item("refrigerante"),
        frenos: item("frenos"),
        bateria: item("bateria"),
        presionNeumaticos: item("presionNeumaticos"),
        lucesYBalizas: item("lucesYBalizas"),
        sirenaYComunicaciones: item("sirenaYComunicaciones"),
        comentarioGeneral: typeof cuerpo.comentarioGeneral === "string" ? cuerpo.comentarioGeneral : null,
        revisadoPor: { ...estado.usuarioActual },
        creadoEn: new Date().toISOString(),
      };
      lista.unshift(nueva);
      estado.revisiones[movilId] = lista;
      const criticos = CLAVES_REVISION.filter((clave) => nueva[clave].estado === "CRITICO");
      const atenciones = CLAVES_REVISION.filter((clave) => nueva[clave].estado === "ADVERTENCIA");
      movil.estado = criticos.length ? "FUERA_SERVICIO" : atenciones.length ? "OBSERVACIONES" : "OPERATIVO";
      return ok(nueva, 201);
    }
  }

  const movil = path.match(/^\/flota\/vehiculos\/([^/]+)$/);
  if (movil) {
    const encontrado = estado.moviles.find((m) => m.id === movil[1]);
    if (!encontrado) return error(404, "Móvil no encontrado");
    if (metodo === "GET") return ok(encontrado);
    if (metodo === "PATCH") {
      const cuerpo = cuerpoDe<CuerpoMovil>(pedido);
      encontrado.denominacion = cuerpo.denominacion;
      encontrado.patente = cuerpo.patente;
      encontrado.tipo = estado.tipos.find((t) => t.id === cuerpo.tipoId) ?? encontrado.tipo;
      encontrado.marca = estado.marcas.find((m) => m.id === cuerpo.marcaId) ?? encontrado.marca;
      encontrado.modelo = estado.modelos.find((m) => m.id === cuerpo.modeloId) ?? encontrado.modelo;
      recontarCatalogos(estado);
      return ok(encontrado);
    }
  }
  return null;
};

/** Buches (US17): generar una sola vez, nombre único, cambio de zona al final, baja → 409 y 4 estados. */
const buches: Manejador = (estado, pedido) => {
  const { metodo, url } = pedido;
  const compartimentos = url.pathname.match(/^\/flota\/vehiculos\/([^/]+)\/compartimentos(?:\/(generar|[^/]+))?(\/estado)?$/);
  if (!compartimentos) return null;

  const movil = estado.moviles.find((m) => m.id === compartimentos[1]);
  if (!movil) return error(404, "Móvil no encontrado");
  const lista = (estado.compartimentos[movil.id] ??= []);
  const ordenados = () => [...lista].sort((a, b) => ZONAS.indexOf(a.zona) - ZONAS.indexOf(b.zona) || a.orden - b.orden);
  const nuevoId = () => uuidSimulado("00000000", estado.siguienteCompartimento++);
  const ultimoOrden = (zona: CompartimentoApi["zona"]) => Math.max(0, ...lista.filter((c) => c.zona === zona).map((c) => c.orden));
  const repetido = (nombre: string, salvo?: string) =>
    lista.some((c) => c.id !== salvo && c.nombre.toLowerCase() === nombre.toLowerCase());
  const duplicado = () => error(409, "Ya existe un buche con ese nombre", { campo: "nombre", code: "COMPARTIMENTO_DUPLICADO" });
  const [, , accion, cambioEstado] = compartimentos;

  if (metodo === "GET" && !accion) return ok(ordenados());
  if (movil.estado === "BAJA_DEFINITIVA") return error(409, "El vehículo ya está dado de baja definitiva");

  if (metodo === "POST" && accion === "generar") {
    if (lista.length) return error(409, "El móvil ya tiene buches", { code: "COMPARTIMENTOS_YA_GENERADOS" });
    const plan = planDeBuches(cuerpoDe(pedido));
    if (!plan.length) return error(400, "Elegí al menos un buche para generar");
    for (const buche of plan) lista.push({ id: nuevoId(), ...buche, estado: "OPERATIVO" });
    return ok(ordenados(), 201);
  }
  if (metodo === "POST" && !accion) {
    const cuerpo = cuerpoDe<{ nombre: string; zona: CompartimentoApi["zona"] }>(pedido);
    const nombre = cuerpo.nombre.trim().toUpperCase();
    if (repetido(nombre)) return duplicado();
    const nuevo: CompartimentoApi = { id: nuevoId(), nombre, zona: cuerpo.zona, orden: ultimoOrden(cuerpo.zona) + 1, estado: "OPERATIVO" };
    lista.push(nuevo);
    return ok(nuevo, 201);
  }

  const buche = lista.find((c) => c.id === accion);
  if (!buche) return error(404, "El buche no existe");
  if (metodo === "PATCH" && cambioEstado) {
    buche.estado = cuerpoDe<{ estado: CompartimentoApi["estado"] }>(pedido).estado;
    return ok(buche);
  }
  if (metodo === "PATCH") {
    const cuerpo = cuerpoDe<{ nombre?: string; zona?: CompartimentoApi["zona"] }>(pedido);
    if (cuerpo.nombre !== undefined) {
      const nombre = cuerpo.nombre.trim().toUpperCase();
      if (repetido(nombre, buche.id)) return duplicado();
      buche.nombre = nombre;
    }
    if (cuerpo.zona && cuerpo.zona !== buche.zona) {
      buche.orden = ultimoOrden(cuerpo.zona) + 1;
      buche.zona = cuerpo.zona;
    }
    return ok(buche);
  }
  if (metodo === "DELETE") {
    estado.compartimentos[movil.id] = lista.filter((c) => c !== buche);
    return { status: 204 };
  }
  return null;
};

type CuerpoSolicitud = Pick<SolicitudApi, "damnificado" | "siniestro" | "constancia">;

const solicitudes: Manejador = (estado, pedido) => {
  const { metodo, url } = pedido;
  const path = url.pathname;
  if (!path.startsWith("/solicitudes")) return null;

  if (metodo === "GET" && path === "/solicitudes/completadas") {
    return ok(pagina(filtrarSolicitudes(estado.solicitudes.filter((s) => s.estado === "RETIRADA"), url), url));
  }
  if (metodo === "GET" && path === "/solicitudes") {
    return ok(pagina(filtrarSolicitudes(estado.solicitudes.filter((s) => s.estado !== "RETIRADA"), url), url));
  }
  if (metodo === "POST" && path === "/solicitudes") {
    const cuerpo = cuerpoDe<CuerpoSolicitud>(pedido);
    const numero = `SOL-${String(estado.siguienteSolicitud).padStart(4, "0")}`;
    const nueva = crearSolicitud(`sol-${estado.siguienteSolicitud}`, numero, "PENDIENTE", cuerpo.damnificado.nombre, {
      fechaAlta: new Date().toISOString(),
      damnificado: cuerpo.damnificado,
      siniestro: cuerpo.siniestro,
      constancia: cuerpo.constancia,
    });
    estado.siguienteSolicitud += 1;
    estado.solicitudes.push(nueva);
    return ok(nueva, 201);
  }

  const ruta = path.match(/^\/solicitudes\/([^/]+)(?:\/([a-z-]+))?$/);
  if (!ruta) return null;
  const [, id, accion] = ruta;
  const encontrada = estado.solicitudes.find((s) => s.id === id);
  if (!encontrada) return error(404, "Solicitud no encontrada");
  const archivo = () => ({ status: 200, pdf: { nombre: `constancia-${encontrada.numero}.pdf`, solicitud: encontrada } });

  if (!accion && metodo === "GET") return ok(encontrada);
  if (!accion && metodo === "PUT") {
    const cuerpo = cuerpoDe<CuerpoSolicitud>(pedido);
    encontrada.damnificado = cuerpo.damnificado;
    encontrada.siniestro = cuerpo.siniestro;
    encontrada.constancia = cuerpo.constancia;
    return ok(encontrada);
  }
  if (accion === "pdf" && metodo === "GET") return archivo();
  if (metodo !== "PATCH") return null;

  switch (accion) {
    case "cancelar":
      if (encontrada.estado !== "PENDIENTE") return error(409, "La solicitud ya no se puede cancelar.");
      encontrada.estado = "CANCELADA";
      encontrada.motivoCancelacion = cuerpoDe<{ motivo: string }>(pedido).motivo;
      encontrada.canceladoEn = new Date().toISOString();
      return ok(encontrada);
    case "abono": {
      const cuerpo = cuerpoDe<{
        estado: AbonoApi["estado"];
        monto?: number | null;
        metodoPago?: string | null;
        motivoExento?: string | null;
      }>(pedido);
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
      return ok(encontrada);
    }
    case "generar-constancia":
      encontrada.estado = "REALIZADA";
      encontrada.observaciones = cuerpoDe<{ observaciones?: string | null }>(pedido).observaciones ?? null;
      return archivo();
    case "firmar":
      if (encontrada.estado !== "REALIZADA") return error(409, "La constancia todavía no fue generada.");
      encontrada.estado = "FIRMADA";
      return ok(encontrada);
    case "entregar": {
      if (!encontrada.abono || encontrada.abono.estado === "PENDIENTE") return error(409, "El arancel está pendiente.");
      const cuerpo = cuerpoDe<{ nombreCompleto: string; dni: string }>(pedido);
      encontrada.estado = "RETIRADA";
      encontrada.retiradoEn = new Date().toISOString();
      encontrada.retiradoPorNombre = cuerpo.nombreCompleto;
      encontrada.retiradoPorDni = cuerpo.dni;
      return ok(encontrada);
    }
  }
  return null;
};

interface CuerpoUsuario {
  nombre: string;
  apellido: string;
  email: string;
  roleName: string;
}

const usuarios: Manejador = (estado, pedido, opciones) => {
  const { metodo, url } = pedido;
  const path = url.pathname;

  if (path === "/users") {
    if (metodo === "GET") return ok(pagina(estado.usuarios, url));
    if (metodo === "POST") {
      const cuerpo = cuerpoDe<CuerpoUsuario>(pedido);
      if (estado.usuarios.some((u) => u.email === cuerpo.email)) {
        return error(409, "Ya existe un usuario con ese correo electrónico.");
      }
      const nuevo: UsuarioApi = {
        id: idLibre(estado.usuarios, (n) => `usuario-${n}`),
        email: cuerpo.email,
        nombre: cuerpo.nombre,
        apellido: cuerpo.apellido,
        activo: true,
        roles: [cuerpo.roleName.toUpperCase()],
      };
      estado.usuarios.push(nuevo);
      return ok({ message: opciones.mensajeMails ?? "Usuario creado", userId: nuevo.id }, 201);
    }
    return null;
  }

  const ruta = path.match(/^\/users\/([^/]+)(?:\/(reenviar-bienvenida|reactivar))?$/);
  if (!ruta) return null;
  const encontrado = estado.usuarios.find((u) => u.id === ruta[1]);
  if (!encontrado) return error(404, "Usuario no encontrado");

  if (ruta[2] === "reenviar-bienvenida" && metodo === "POST") {
    return ok({ message: opciones.mensajeMails ?? "Correo reenviado" });
  }
  if (ruta[2] === "reactivar" && metodo === "PATCH") {
    encontrado.activo = true;
    return ok(encontrado);
  }
  if (ruta[2]) return null;
  if (metodo === "GET") return ok(encontrado);
  if (metodo === "PATCH") {
    // PATCH es parcial: el formulario manda solo los campos modificados.
    const cuerpo = cuerpoDe<Partial<CuerpoUsuario>>(pedido);
    if (cuerpo.email !== undefined && estado.usuarios.some((u) => u.id !== encontrado.id && u.email === cuerpo.email)) {
      return error(409, "Ya existe un usuario con ese correo electrónico.");
    }
    if (cuerpo.nombre !== undefined) encontrado.nombre = cuerpo.nombre;
    if (cuerpo.apellido !== undefined) encontrado.apellido = cuerpo.apellido;
    if (cuerpo.email !== undefined) encontrado.email = cuerpo.email;
    if (cuerpo.roleName) encontrado.roles = [cuerpo.roleName.toUpperCase()];
    return ok(encontrado);
  }
  if (metodo === "DELETE") {
    // US61: la baja es lógica; el usuario queda inactivo y se puede reactivar.
    encontrado.activo = false;
    return ok({ message: "Usuario dado de baja" });
  }
  return null;
};

const MANEJADORES: Manejador[] = [auth, catalogos, buches, flota, solicitudes, usuarios];

/** Resuelve un pedido contra el estado en memoria. Muta el estado si el pedido lo cambia. */
export function resolverPedido(estado: EstadoBackend, pedido: PedidoSimulado, opciones: OpcionesBack = {}): RespuestaSimulada {
  const normalizado = { ...pedido, metodo: pedido.metodo.toUpperCase() };
  for (const manejar of MANEJADORES) {
    const respuesta = manejar(estado, normalizado, opciones);
    if (respuesta) return respuesta;
  }
  return error(404, `Sin mock para ${normalizado.metodo} ${pedido.url.pathname}`);
}

/** true si el pedido puede cambiar el estado (para saber cuándo persistir). */
export const esEscritura = (metodo: string) => !["GET", "HEAD", "OPTIONS"].includes(metodo.toUpperCase());
