import type { EstadoSolicitud, Solicitud, TipoSiniestro } from "@/types/dominio";
import { TIPOS_SINIESTRO, formatearFecha, hoy } from "./formato";
import type { DatosSolicitud } from "./validacion";

/* Capa de datos de solicitudes. Por ahora es un mock en memoria: el backend
   todavía no expone los endpoints (TBUS08, TBUS09 y TBUS13). Cuando estén,
   se reemplaza el cuerpo de estas funciones por fetch sin tocar las pantallas.

   Para ver los estados de la UI sin backend:
     ?simular=error  → falla la carga del listado
     ?simular=vacio  → el listado viene sin solicitudes */

export const POR_PAGINA = 20;

export interface FiltroSolicitudes {
  busqueda?: string;
  estado?: EstadoSolicitud;
  orden?: "desc" | "asc"; // por fecha de alta; por defecto la más reciente primero
  pagina?: number; // empieza en 1
}

export interface PaginaSolicitudes {
  items: Solicitud[];
  total: number;
  pagina: number;
  paginas: number;
}

export class ErrorSolicitud extends Error {}

const DEMORA_MS = 400;
const esperar = () => new Promise((r) => setTimeout(r, DEMORA_MS));
const simular = () => new URLSearchParams(window.location.search).get("simular");

const normalizar = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export async function listarSolicitudes(filtro: FiltroSolicitudes): Promise<PaginaSolicitudes> {
  await esperar();
  if (simular() === "error") throw new ErrorSolicitud("No se pudo conectar con el servidor");
  const fuente = simular() === "vacio" ? [] : solicitudes;

  const q = normalizar(filtro.busqueda?.trim() ?? "");
  const qDigitos = q.replace(/\D/g, "");
  const filtradas = fuente.filter((s) => {
    if (filtro.estado && s.estado !== filtro.estado) return false;
    if (!q) return true;
    const { damnificado: d } = s;
    const texto = normalizar(
      [s.numero, `${d.nombre} ${d.apellido}`, `${d.apellido} ${d.nombre}`, TIPOS_SINIESTRO[s.siniestro.tipo], formatearFecha(s.fechaAlta)].join(" "),
    );
    return texto.includes(q) || (qDigitos.length >= 3 && (d.dni.includes(qDigitos) || s.numero.includes(qDigitos)));
  });

  const signo = filtro.orden === "asc" ? 1 : -1;
  filtradas.sort((a, b) => signo * (a.fechaAlta.localeCompare(b.fechaAlta) || a.numero.localeCompare(b.numero)));

  const paginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const pagina = Math.min(Math.max(1, filtro.pagina ?? 1), paginas);
  return {
    items: filtradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA),
    total: filtradas.length,
    pagina,
    paginas,
  };
}

export async function obtenerSolicitud(id: string): Promise<Solicitud | null> {
  await esperar();
  return solicitudes.find((s) => s.id === id) ?? null;
}

export async function crearSolicitud(datos: DatosSolicitud): Promise<Solicitud> {
  await esperar();
  const ultimo = Math.max(...solicitudes.map((s) => Number(s.numero.slice(4))), 0);
  const numero = `SOL-${String(ultimo + 1).padStart(4, "0")}`;
  const nueva: Solicitud = { id: numero.toLowerCase(), numero, fechaAlta: hoy(), estado: "pendiente", ...datos };
  solicitudes = [nueva, ...solicitudes];
  return nueva;
}

export async function actualizarSolicitud(id: string, datos: DatosSolicitud): Promise<Solicitud> {
  await esperar();
  return reemplazar(id, (s) => ({ ...s, ...datos }));
}

export async function cancelarSolicitud(id: string, motivo: string): Promise<Solicitud> {
  await esperar();
  if (!motivo.trim()) throw new ErrorSolicitud("El motivo de la cancelación es obligatorio");
  return reemplazar(id, (s) => ({ ...s, estado: "cancelada", motivoCancelacion: motivo.trim() }));
}

/** Solo las solicitudes pendientes se pueden editar o cancelar (US13). */
function reemplazar(id: string, cambio: (s: Solicitud) => Solicitud) {
  const actual = solicitudes.find((s) => s.id === id);
  if (!actual) throw new ErrorSolicitud("La solicitud no existe");
  if (actual.estado !== "pendiente")
    throw new ErrorSolicitud("Solo se pueden modificar solicitudes pendientes");
  const nueva = cambio(actual);
  solicitudes = solicitudes.map((s) => (s.id === id ? nueva : s));
  return nueva;
}

/* ---------- Datos de prueba ---------- */

// Las cinco más recientes son las del diseño en Figma.
const DISENO: [string, string, string, TipoSiniestro, EstadoSolicitud][] = [
  ["Lucía", "Fernández", "30112456", "incendio_vivienda", "pendiente"],
  ["Martín", "Gómez", "28774310", "incendio_vehicular", "constancia_generada"],
  ["Alicia", "Benítez", "33220981", "incendio_vivienda", "firmada"],
  ["Pablo", "Bravo", "27905112", "accidente_transito", "cancelada"],
  ["Carla", "Díaz", "35001774", "incendio_vivienda", "pendiente"],
];
const NOMBRES = ["Jorge", "Silvia", "Raúl", "Mariana", "Diego", "Florencia", "Hugo", "Verónica", "Sergio", "Natalia", "Oscar", "Paula", "Ramiro", "Gabriela"];
const APELLIDOS = ["López", "Martínez", "Romero", "Sosa", "Acosta", "Medina", "Herrera", "Suárez", "Aguirre", "Ríos", "Molina", "Castro", "Ortiz", "Peralta", "Luna"];
const CALLES = ["San Martín", "Belgrano", "Rivadavia", "Mitre", "Sarmiento", "Moreno", "Urquiza", "Pellegrini"];
const TIPOS = Object.keys(TIPOS_SINIESTRO) as TipoSiniestro[];
const ESTADOS_VIEJAS: EstadoSolicitud[] = ["firmada", "firmada", "firmada", "constancia_generada", "firmada", "cancelada"];
const DESCRIPCIONES: Record<TipoSiniestro, string> = {
  incendio_vivienda: "Incendio en cocina, se evacuaron 4 personas.",
  incendio_vehicular: "Incendio en el compartimento del motor, sin heridos.",
  accidente_transito: "Colisión entre dos vehículos, se asistió a los ocupantes.",
};

function crearDatosDePrueba(): Solicitud[] {
  return Array.from({ length: 47 }, (_, i) => {
    const fecha = new Date(2026, 9, 11 - i);
    const fechaAlta = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
    const [nombre, apellido, dni, tipo, estado] = DISENO[i] ?? [
      NOMBRES[i % NOMBRES.length],
      APELLIDOS[(i * 7) % APELLIDOS.length],
      String(20_000_000 + ((i * 7_919_113) % 19_000_000)),
      TIPOS[i % TIPOS.length],
      ESTADOS_VIEJAS[i % ESTADOS_VIEJAS.length],
    ];
    const lugar = `Calle ${CALLES[i % CALLES.length]} ${150 + ((i * 37) % 1800)}`;
    const numero = `SOL-${String(147 - i).padStart(4, "0")}`;
    return {
      id: numero.toLowerCase(),
      numero,
      fechaAlta,
      estado,
      damnificado: {
        nombre,
        apellido,
        dni,
        telefono: i % 4 === 3 ? undefined : `11 5555-${String(142 + i * 13).padStart(4, "0")}`,
        domicilio: i === 0 ? "Calle San Martín 450" : i % 5 === 4 ? undefined : lugar,
      },
      siniestro: {
        tipo,
        fechaHora:
          i === 0
            ? `${fechaAlta}T18:20`
            : `${fechaAlta}T${String(8 + ((i * 5) % 14)).padStart(2, "0")}:${String((i * 17) % 60).padStart(2, "0")}`,
        lugar: i === 0 ? "Calle San Martín 450" : lugar,
        descripcion: DESCRIPCIONES[tipo],
      },
      motivoCancelacion: estado === "cancelada" ? "El pedido no corresponde a una intervención del cuartel." : undefined,
    };
  });
}

let solicitudes: Solicitud[] = crearDatosDePrueba();
