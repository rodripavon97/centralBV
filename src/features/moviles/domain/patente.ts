/* Patentes argentinas. Mismas reglas que src/fleet/domain/license-plate.ts del back:
   se guarda la forma canónica (solo mayúsculas y dígitos, "AB123CD") y se muestra
   agrupada ("AB 123 CD"). Si cambian los formatos, cambiarlos en los dos lados. */

const FORMATOS: { patron: RegExp; grupos: number[] }[] = [
  { patron: /^[A-Z]{2}\d{3}[A-Z]{2}$/, grupos: [2, 3, 2] }, // AB 123 CD · Mercosur auto
  { patron: /^[A-Z]{3}\d{3}$/, grupos: [3, 3] }, // ABC 123 · auto 1995–2016
  { patron: /^[A-Z]\d{3}[A-Z]{3}$/, grupos: [1, 3, 3] }, // A 123 BCD · Mercosur moto
  { patron: /^\d{3}[A-Z]{3}$/, grupos: [3, 3] }, // 123 ABC · moto 1995–2016
  { patron: /^[A-Z]\d{4,7}$/, grupos: [1, 7] }, // B 1234567 · provincial anterior a 1995
];

/** Forma canónica: mayúsculas, sin acentos, solo letras y números. */
export function normalizarPatente(patente: string): string {
  return patente
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/** true si coincide con algún formato argentino conocido. */
export function esPatenteConocida(patente: string): boolean {
  const p = normalizarPatente(patente);
  return FORMATOS.some(({ patron }) => patron.test(p));
}

/** "ab123cd" → "AB 123 CD". Un formato desconocido queda en su forma canónica ("BV01"). */
export function formatearPatente(patente: string): string {
  const p = normalizarPatente(patente);
  const formato = FORMATOS.find(({ patron }) => patron.test(p));
  if (!formato) return p;
  const partes: string[] = [];
  let inicio = 0;
  formato.grupos.forEach((largo, i) => {
    const fin = i === formato.grupos.length - 1 ? p.length : inicio + largo;
    partes.push(p.slice(inicio, fin));
    inicio = fin;
  });
  return partes.filter(Boolean).join(" ");
}
