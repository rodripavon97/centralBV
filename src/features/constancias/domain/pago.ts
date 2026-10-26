import type { EstadoPago, Solicitud } from "@/types/dominio";

/** Sin abono cargado el arancel figura como pendiente (el back manda abono: null). */
export const estadoPagoDe = (s: Pick<Solicitud, "abono">): EstadoPago => s.abono?.estado ?? "pendiente";

/** El pago se registra o modifica en cualquier estado salvo cancelada y entregada (US14). */
export const puedeRegistrarPago = (s: Pick<Solicitud, "estado">) => s.estado !== "cancelada" && s.estado !== "entregada";

/** RN/02: una solicitud firmada con el arancel pendiente no se puede entregar. */
export const entregaBloqueada = (s: Pick<Solicitud, "estado" | "abono">) =>
  s.estado === "firmada" && estadoPagoDe(s) === "pendiente";
