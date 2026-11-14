import logoBomberosJcp from "@/assets/logo-bomberos-jcp.jpeg";
import { esModoDemo } from "@/demo/modoDemo";

/** Datos de la institución que van en el encabezado y el pie de la constancia.
    El template es uno solo (HojaConstancia y el PDF del modo demo); cambian solo estos datos. */
export interface DatosInstitucion {
  nombre: string;
  /** Personería, provincia, matrícula: una línea cada uno. */
  registros: string[];
  sede: string;
  direccion: string;
  contacto: string;
  /** Localidad de la línea de emisión ("JOSÉ C. PAZ, 12 DE OCTUBRE DE 2026."). */
  localidadEmision: string;
  /** Escudo. Sin escudo, el encabezado empieza por el nombre. */
  logo: string | null;
  /** Texto en diagonal sobre la hoja (solo en la demo). */
  marcaAgua: string | null;
}

export const INSTITUCION_REAL: DatosInstitucion = {
  nombre: "ASOCIACIÓN DE BOMBEROS VOLUNTARIOS DE JOSÉ C. PAZ",
  registros: ["PERSONERÍA JURÍDICA N° 32092", "PROVINCIA DE BUENOS AIRES - REPÚBLICA ARGENTINA", "I.N.O.B.V. N° 234"],
  sede: "Cuartel Central - Comandante Donato De Salvis",
  direccion: "Pasaje San Agustín 703 (1665) José Clemente Paz - Bs. As.",
  contacto: "Tel.: 02320-422222 / 02320-436736 E-mail: adbvjosecpaz@gmail.com",
  localidadEmision: "JOSÉ C. PAZ",
  logo: logoBomberosJcp,
  marcaAgua: null,
};

/** US58: versión genérica para el modo demo, sin datos del cuartel real. */
export const INSTITUCION_DEMO: DatosInstitucion = {
  nombre: "Cuartel de Bomberos Voluntarios (demo)",
  registros: ["PERSONERÍA JURÍDICA N° 00000 (EJEMPLO)", "PROVINCIA DE EJEMPLO - REPÚBLICA ARGENTINA"],
  sede: "Cuartel Central (ejemplo)",
  direccion: "Calle Ejemplo 123 (0000) Villa Ejemplo",
  contacto: "Tel.: 0000-000000 E-mail: contacto@ejemplo.com",
  localidadEmision: "VILLA EJEMPLO",
  logo: null,
  marcaAgua: "DEMO · sin validez",
};

export function datosInstitucion(demo: boolean = esModoDemo()): DatosInstitucion {
  return demo ? INSTITUCION_DEMO : INSTITUCION_REAL;
}
