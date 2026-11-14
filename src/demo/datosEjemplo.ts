import {
  crearSolicitud,
  planDeBuches,
  uuidSimulado,
  type AbonoApi,
  type CompartimentoApi,
  type EstadoBackend,
  type ItemCatalogo,
  type ItemRevisionApi,
  type ModeloApi,
  type MovilApi,
  type RevisionApi,
  type SolicitudApi,
} from "./backSimulado";

/**
 * Datos de ejemplo del modo demo (US58). Todo es inventado: nombres, patentes,
 * direcciones y localidades no corresponden a ningún cuartel real.
 */

export const USUARIO_DEMO = { id: "usuario-demo", nombre: "Usuario demo" };

const LOCALIDAD = "Villa Ejemplo";
const PARTIDO = "San Ejemplo";

const DIA = 24 * 60 * 60 * 1000;
const haceDias = (dias: number, ahora: number) => new Date(ahora - dias * DIA).toISOString();
const fechaDe = (iso: string) => iso.slice(0, 10);

const OK: ItemRevisionApi = { estado: "OK", comentario: null };
const atencion = (comentario: string): ItemRevisionApi => ({ estado: "ADVERTENCIA", comentario });
const critico = (comentario: string): ItemRevisionApi => ({ estado: "CRITICO", comentario });

function catalogos() {
  const tipo = (n: number, valor: string): ItemCatalogo => ({ id: uuidSimulado("10000000", n), valor });
  const marca = (n: number, valor: string): ItemCatalogo => ({ id: uuidSimulado("20000000", n), valor });
  const tipos = [tipo(1, "Autobomba"), tipo(2, "Rescate"), tipo(3, "Cisterna"), tipo(4, "Forestal"), tipo(5, "Unidad liviana")];
  const marcas = [marca(1, "Iveco"), marca(2, "Mercedes-Benz"), marca(3, "Ford"), marca(4, "Scania")];
  const modelo = (n: number, valor: string, m: ItemCatalogo): ModeloApi => ({ id: uuidSimulado("30000000", n), valor, marcaId: m.id });
  const modelos = [
    modelo(1, "Tector", marcas[0]),
    modelo(2, "Daily", marcas[0]),
    modelo(3, "Atego 1726", marcas[1]),
    modelo(4, "Accelo", marcas[1]),
    modelo(5, "F-4000", marcas[2]),
    modelo(6, "Ranger", marcas[2]),
    modelo(7, "R450", marcas[3]),
  ];
  return { tipos, marcas, modelos };
}

function revision(
  n: number,
  vehiculoId: string,
  creadoEn: string,
  items: Partial<Record<keyof Omit<RevisionApi, "id" | "vehiculoId" | "comentarioGeneral" | "revisadoPor" | "creadoEn">, ItemRevisionApi>> = {},
  comentarioGeneral: string | null = null,
): RevisionApi {
  return {
    id: uuidSimulado("40000000", n),
    vehiculoId,
    nivelAceite: OK,
    refrigerante: OK,
    frenos: OK,
    bateria: OK,
    presionNeumaticos: OK,
    lucesYBalizas: OK,
    sirenaYComunicaciones: OK,
    ...items,
    comentarioGeneral,
    revisadoPor: { id: "usuario-3", nombre: "Tomás Ibarra" },
    creadoEn,
  };
}

/** Datos de ejemplo frescos: las fechas se calculan desde `ahora` para que se vean recientes. */
export function datosDeEjemplo(ahora: number = Date.now()): EstadoBackend {
  const { tipos, marcas, modelos } = catalogos();
  const movil = (
    n: number,
    estado: MovilApi["estado"],
    tipo: ItemCatalogo,
    modelo: ModeloApi,
    patente: string,
  ): MovilApi => ({
    id: `movil-${n}`,
    estado,
    patente,
    denominacion: `M-${n}`,
    tipo,
    marca: marcas.find((m) => m.id === modelo.marcaId) ?? marcas[0],
    modelo,
  });

  const moviles = [
    movil(1, "OPERATIVO", tipos[0], modelos[0], "AA101BV"),
    movil(2, "OBSERVACIONES", tipos[0], modelos[2], "AB202BV"),
    movil(3, "MANTENIMIENTO", tipos[2], modelos[6], "AC303BV"),
    movil(4, "FUERA_SERVICIO", tipos[1], modelos[3], "AD404BV"),
    movil(5, "OPERATIVO", tipos[3], modelos[4], "AE505BV"),
    movil(6, "OPERATIVO", tipos[4], modelos[5], "AF606BV"),
    movil(7, "OBSERVACIONES", tipos[1], modelos[1], "AG707BV"),
  ];
  for (const lista of [tipos, marcas, modelos] as ItemCatalogo[][]) {
    for (const item of lista) {
      item.enUso = moviles.filter((m) => m.tipo.id === item.id || m.marca.id === item.id || m.modelo.id === item.id).length;
    }
  }

  // Buches generados con la misma regla que "Generar buches", con algunos estados cambiados.
  let siguienteCompartimento = 1;
  const compartimentos: Record<string, CompartimentoApi[]> = {};
  const generar = (
    movilId: string,
    cantidades: Parameters<typeof planDeBuches>[0],
    estados: Record<string, CompartimentoApi["estado"]> = {},
  ) => {
    compartimentos[movilId] = planDeBuches(cantidades).map((b) => ({
      id: uuidSimulado("00000000", siguienteCompartimento++),
      ...b,
      estado: estados[b.nombre] ?? "OPERATIVO",
    }));
  };
  generar("movil-1", { ladoConductor: 3, ladoAcompanante: 3, trasero: 1, techo: true, cabina: true });
  generar("movil-2", { ladoConductor: 3, ladoAcompanante: 3, trasero: 1, cabina: true }, { "LC-2": "OBSERVACIONES", "LA-3": "DANADO" });
  generar("movil-3", { ladoConductor: 2, ladoAcompanante: 2, trasero: 1 }, { "TR-1": "OBSERVACIONES" });
  generar("movil-4", { ladoConductor: 2, ladoAcompanante: 2, techo: true, cabina: true }, { "LC-1": "FUERA_DE_USO", "TE-1": "DANADO" });
  generar("movil-7", { ladoConductor: 2, ladoAcompanante: 2, cabina: true }, { "CB-1": "OBSERVACIONES" });
  // M-5 y M-6 quedan sin buches para probar "Generar buches".

  const revisiones: Record<string, RevisionApi[]> = {
    "movil-1": [revision(1, "movil-1", haceDias(1, ahora))],
    "movil-2": [
      revision(2, "movil-2", haceDias(2, ahora), { presionNeumaticos: atencion("Rueda trasera izquierda baja") }),
      revision(3, "movil-2", haceDias(9, ahora)),
    ],
    "movil-4": [
      revision(4, "movil-4", haceDias(3, ahora), { frenos: critico("Pastillas gastadas"), bateria: atencion("Arranca con dificultad") }, "Queda fuera de servicio hasta cambiar las pastillas."),
    ],
    "movil-7": [revision(5, "movil-7", haceDias(5, ahora), { lucesYBalizas: atencion("Baliza trasera sin funcionar") })],
  };

  const abono = (estado: AbonoApi["estado"], monto: number | null, metodoPago: string | null, dias: number): AbonoApi => ({
    estado,
    monto,
    metodoPago,
    fechaPago: haceDias(dias, ahora),
    motivoExento: estado === "EXENTO" ? "Familia damnificada sin recursos" : null,
  });
  const siniestro = (
    dias: number,
    hora: string,
    direccion: string,
    motivo: string,
    numeroParte: string,
    extra: Partial<SolicitudApi["siniestro"]> = {},
  ): SolicitudApi["siniestro"] => ({
    tipo: "VIVIENDA",
    fecha: fechaDe(haceDias(dias, ahora)),
    hora,
    direccion,
    numeroParte,
    motivo,
    localidad: LOCALIDAD,
    partido: PARTIDO,
    perdidas: "A determinar por la aseguradora",
    patenteVehiculo: null,
    ...extra,
  });
  const seguro = (numeroPoliza: string) => ({ destino: "SEGURO" as const, razonSocial: "Aseguradora Ejemplo S.A.", numeroPoliza });
  const accionSocial = { destino: "ACCION_SOCIAL" as const, razonSocial: "Desarrollo Social de Ejemplo", numeroPoliza: null };
  const solicitud = (n: number, estado: SolicitudApi["estado"], nombre: string, dni: string, dias: number, extra: Partial<SolicitudApi>) =>
    crearSolicitud(`sol-${n}`, `SOL-${String(n).padStart(4, "0")}`, estado, nombre, {
      fechaAlta: haceDias(dias, ahora),
      damnificado: { nombre, dni, telefono: `11 5000-${String(1000 + n)}` },
      ...extra,
    });

  const solicitudes: SolicitudApi[] = [
    solicitud(1, "PENDIENTE", "Laura Benítez", "28111222", 1, {
      siniestro: siniestro(2, "21:40", "Calle de los Álamos 1234", "Incendio de cocina", "101"),
      constancia: seguro("POL-000123"),
    }),
    solicitud(2, "PENDIENTE", "Martín Quiroga", "33444555", 2, {
      siniestro: siniestro(3, "07:15", "Ruta Provincial 99 km 12", "Colisión entre dos vehículos", "102", {
        tipo: "VEHICULAR",
        patenteVehiculo: "AH808ZZ",
        perdidas: "Frente y paragolpes",
      }),
      constancia: seguro("POL-000456"),
      abono: abono("ABONADO", 15000, "TRANSFERENCIA", 1),
    }),
    solicitud(3, "REALIZADA", "Sofía Medina", "35666777", 4, {
      siniestro: siniestro(5, "16:05", "Pasaje Las Rosas 45", "Incendio de pastizal lindero", "097"),
      constancia: accionSocial,
      abono: abono("EXENTO", null, null, 3),
    }),
    solicitud(4, "FIRMADA", "Diego Castro", "30888999", 6, {
      siniestro: siniestro(7, "03:30", "Av. del Parque 2550", "Cortocircuito en tablero eléctrico", "093"),
      constancia: seguro("POL-000789"),
      abono: abono("ABONADO", 15000, "EFECTIVO", 2),
    }),
    solicitud(5, "FIRMADA", "Valeria Ríos", "29222333", 8, {
      siniestro: siniestro(9, "12:50", "Calle Ficticia 777", "Incendio de vehículo estacionado", "090", {
        tipo: "VEHICULAR",
        patenteVehiculo: "AI909YY",
        perdidas: "Pérdida total",
      }),
      constancia: seguro("POL-000321"),
    }),
    solicitud(6, "RETIRADA", "Hernán Sosa", "31555666", 12, {
      siniestro: siniestro(13, "19:20", "Calle Los Pinos 300", "Incendio de vivienda", "084"),
      constancia: seguro("POL-000654"),
      abono: abono("ABONADO", 15000, "DEBITO", 8),
      retiradoEn: haceDias(7, ahora),
      retiradoPorNombre: "Hernán Sosa",
      retiradoPorDni: "31555666",
    }),
    solicitud(7, "CANCELADA", "Paula Herrera", "34777888", 10, {
      siniestro: siniestro(11, "10:10", "Bv. Central 1500", "Escape de gas", "087"),
      constancia: seguro("POL-000987"),
      motivoCancelacion: "La persona pidió la constancia por error",
      canceladoEn: haceDias(9, ahora),
    }),
  ];

  return {
    tipos,
    marcas,
    modelos,
    moviles,
    revisiones,
    compartimentos,
    siguienteCompartimento,
    solicitudes,
    usuarios: [
      { id: "usuario-1", email: "ana.lopez@ejemplo.com", nombre: "Ana", apellido: "López", activo: true, roles: ["ADMIN"] },
      { id: "usuario-2", email: "bruno.diaz@ejemplo.com", nombre: "Bruno", apellido: "Díaz", activo: true, roles: ["ADMINISTRATIVO"] },
      { id: "usuario-3", email: "tomas.ibarra@ejemplo.com", nombre: "Tomás", apellido: "Ibarra", activo: true, roles: ["AUTOMOTORES"] },
      { id: "usuario-4", email: "carla.vega@ejemplo.com", nombre: "Carla", apellido: "Vega", activo: false, roles: ["COMUN"] },
    ],
    rolesDeLogin: ["ADMIN", "ADMINISTRATIVO", "AUTOMOTORES", "COMUN"],
    siguienteMovil: moviles.length + 1,
    siguienteSolicitud: solicitudes.length + 1,
    usuarioActual: { ...USUARIO_DEMO },
  };
}
