/* Denominación (número interno) de un móvil. Mismas reglas que
   src/fleet/domain/denomination.ts del back: en José C. Paz los móviles se llaman
   M-1, M-2… Letras + número, con o sin separador, queda "M-1"; el resto, en mayúsculas. */

const LETRAS_Y_NUMERO = /^([A-Z]+)[\s._-]*(\d+)$/;

export function normalizarDenominacion(valor: string): string {
  const limpio = valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
  const m = LETRAS_Y_NUMERO.exec(limpio);
  return m ? `${m[1]}-${m[2]}` : limpio;
}
