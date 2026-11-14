import type { ReactNode } from "react";
import type { Solicitud } from "@/types/dominio";
import { fechaEmision, formatearDni, formatearFecha, formatearHora } from "../domain/formato";
import { datosInstitucion } from "../institucion";

/** Una hoja A4 (210 × 297 mm) con el formato oficial de la constancia.
    Reproduce el PDF que arma el back para que la vista previa sea fiel.
    Los datos del cuartel salen de `datosInstitucion()`: en modo demo son genéricos (US58). */
export default function HojaConstancia({
  solicitud,
  observaciones,
  conFirmas = false,
}: {
  solicitud: Solicitud;
  observaciones?: string;
  conFirmas?: boolean;
}) {
  const { damnificado: d, siniestro: s, constancia: c } = solicitud;
  const institucion = datosInstitucion();

  return (
    <article className="hoja-a4 relative overflow-hidden bg-white text-black">
      {institucion.marcaAgua && (
        <p
          data-testid="marca-agua"
          className="pointer-events-none absolute inset-0 flex select-none items-center justify-center whitespace-nowrap text-[44pt] font-bold uppercase text-black/10 [transform:rotate(-35deg)]"
        >
          {institucion.marcaAgua}
        </p>
      )}

      <div className="absolute inset-x-[20mm] top-[10mm] flex flex-col items-center text-center">
        {institucion.logo ? (
          <img src={institucion.logo} alt="" className="size-[30mm] object-contain" />
        ) : (
          <div className="size-[30mm]" aria-hidden />
        )}
        <p className="mt-[2mm] text-[12pt] font-bold leading-tight tracking-[0.01em]">{institucion.nombre}</p>
        {institucion.registros.map((linea, i) => (
          <p key={linea} className={`${i === 0 ? "mt-[1mm] " : ""}text-[9pt] leading-[1.2]`}>
            {linea}
          </p>
        ))}
        <p className="mt-[3mm] text-[8pt] italic leading-[1.2]">{institucion.sede}</p>
        <p className="text-[8pt] leading-[1.2]">{institucion.direccion}</p>
        <p className="text-[8pt] leading-[1.2]">{institucion.contacto}</p>
      </div>

      <div className="absolute inset-x-[20mm] top-[84mm] text-center">
        <h2 className="text-[14pt] font-bold tracking-wide">CONSTANCIA DE SINIESTRO</h2>
        <div className="mx-auto mt-[1.5mm] w-[70mm] border-t border-black" />
      </div>

      <div className="absolute inset-x-[20mm] top-[96mm] text-[10pt] leading-[10mm]">
        <div className="flex">
          <p className="min-w-0 flex-1">
            <Etiqueta>SOLICITANTE:</Etiqueta> {d.nombre.toUpperCase()}
          </p>
          <p className="w-[55mm] shrink-0">
            <Etiqueta>DNI:</Etiqueta> {formatearDni(d.dni)}
          </p>
        </div>
        <p>
          <Etiqueta>DOMICILIO DEL HECHO:</Etiqueta> {s.direccion.toUpperCase()}
        </p>
        <div className="flex">
          <p className="min-w-0 flex-1">
            <Etiqueta>LOCALIDAD:</Etiqueta> {s.localidad.toUpperCase()}
          </p>
          <p className="w-[55mm] shrink-0">
            <Etiqueta>PARTIDO:</Etiqueta> {s.partido.toUpperCase()}
          </p>
        </div>
        <div className="flex">
          <p className="min-w-0 flex-1">
            <Etiqueta>MOTIVO:</Etiqueta> {s.motivo.toUpperCase()}
          </p>
          {s.patenteVehiculo && (
            <p className="w-[55mm] shrink-0">
              <Etiqueta>DOMINIO:</Etiqueta> {s.patenteVehiculo.toUpperCase()}
            </p>
          )}
        </div>
        <p>
          <Etiqueta>PERDIDAS:</Etiqueta> {s.perdidas}
        </p>
        <p>
          <Etiqueta>PARA SER PRESENTADO:</Etiqueta> {c.razonSocial.toUpperCase()}
        </p>
        {c.numeroPoliza && (
          <p>
            <Etiqueta>NÚMERO DE POLIZA:</Etiqueta> {c.numeroPoliza}
          </p>
        )}
        <p>
          <Etiqueta>PARTE N°:</Etiqueta> {s.numeroParte}
        </p>
        <p>
          <Etiqueta>FECHA:</Etiqueta> {formatearFecha(s.fecha)}
        </p>
        <p>
          <Etiqueta>HORA:</Etiqueta> {formatearHora(s.hora)} HS.
        </p>
        {observaciones?.trim() && (
          <p className="mt-[1mm] whitespace-pre-wrap leading-[5mm]">
            <Etiqueta>OBSERVACIONES:</Etiqueta> {observaciones.trim()}
          </p>
        )}
      </div>

      <div className="absolute inset-x-[20mm] bottom-[48mm] text-[10pt] leading-[5mm]">
        <p>
          Se deja constancia que los datos que se consignan precedentemente surgen del parte profesional del cual doy fe;
          teniendo validez únicamente, con titulo de propiedad o boleto de compra-venta, para el caso de siniestro sobre
          bienes muebles y/o inmuebles registrables.
        </p>
        <p className="mt-[1mm] font-bold">{fechaEmision(new Date(), institucion.localidadEmision)}</p>
      </div>

      {conFirmas && (
        <div className="absolute inset-x-[20mm] bottom-[16mm] grid grid-cols-2 gap-x-[10mm] gap-y-[10mm] text-[10pt]">
          <LineaFirma etiqueta="RETIRO:" />
          <LineaFirma etiqueta="DNI:" />
          <LineaFirma etiqueta="FIRMA:" />
          <LineaFirma etiqueta="FECHA:" />
        </div>
      )}
    </article>
  );
}

function Etiqueta({ children }: { children: ReactNode }) {
  return <span className="font-bold">{children} </span>;
}

function LineaFirma({ etiqueta }: { etiqueta: string }) {
  return (
    <div className="flex items-end gap-1">
      <span className="font-bold">{etiqueta}</span>
      <span className="mb-[1mm] h-0 flex-1 border-b border-dotted border-black" />
    </div>
  );
}
