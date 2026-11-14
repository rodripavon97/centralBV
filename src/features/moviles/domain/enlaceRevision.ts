/** URL absoluta del formulario de revisión: es el payload del QR de la ficha. */
export function urlRevisionMovil(id: string, origin: string = window.location.origin): string {
  return `${origin}/moviles/${id}/revision`;
}
