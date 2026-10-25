import logo from "@/assets/logo-bomberos-jcp.jpeg";
import type { ReactNode } from "react";
import type { Solicitud } from "@/types/dominio";
import { fechaEmision, formatearDni, formatearFecha, formatearHora } from "../domain/formato";

/** Una hoja A4 (210 × 297 mm) con el formato oficial de la constancia.
    Reproduce el PDF que arma el back para que la vista previa sea fiel. */
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

  return (
    <article className="hoja-a4 relative overflow-hidden bg-white text-black">
      <div className="absolute inset-x-[20mm] top-[10mm] flex flex-col items-center text-center">
        <img src={logo} alt="" className="size-[30mm] object-contain" />
        <p className="mt-[2mm] text-[12pt] font-bold leading-tight tracking-[0.01em]">
          ASOCIACIÓN DE BOMBEROS VOLUNTARIOS DE JOSÉ C. PAZ
        </p>
        <p className="mt-[1mm] text-[9pt] leading-[1.2]">PERSONERÍA JURÍDICA N° 32092</p>
        <p className="text-[9pt] leading-[1.2]">PROVINCIA DE BUENOS AIRES - REPÚBLICA ARGENTINA</p>
        <p className="text-[9pt] leading-[1.2]">I.N.O.B.V. N° 234</p>
        <p className="mt-[3mm] text-[8pt] italic leading-[1.2]">
          Cuartel Central - Comandante Donato De Salvis
        </p>
        <p className="text-[8pt] leading-[1.2]">Pasaje San Agustín 703 (1665) José Clemente Paz - Bs. As.</p>
        <p className="text-[8pt] leading-[1.2]">
          Tel.: 02320-422222 / 02320-436736 E-mail: adbvjosecpaz@gmail.com
        </p>
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
        <p className="mt-[1mm] font-bold">{fechaEmision()}</p>
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
